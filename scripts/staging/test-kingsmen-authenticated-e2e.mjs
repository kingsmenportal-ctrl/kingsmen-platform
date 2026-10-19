#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const runner = join(root, 'scripts/staging/run-kingsmen-authenticated-e2e.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'kingsmen-e2e-test-'));
let requests = 0;
const server = createServer((req, res) => {
  requests += 1;
  res.setHeader('content-type', 'application/json');
  if (req.url === '/assert') res.end(JSON.stringify({ data: { owner: 'candidate-a' } }));
  else res.end(JSON.stringify({ secret: 'must-not-be-written-to-report' }));
});
const run = async (cases, extraEnv = {}) => {
  const plan = join(tmp, 'plan.json');
  const report = join(tmp, 'report.json');
  writeFileSync(plan, JSON.stringify({ schema: 'kingsmen.staging-e2e-plan.v1', cases }));
  const child = spawn(process.execPath, [runner], {
    cwd: root,
    env: {
      ...process.env,
      KINGSMEN_STAGING_BASE_URL: `http://127.0.0.1:${server.address().port}`,
      KINGSMEN_E2E_PLAN: plan,
      KINGSMEN_E2E_REPORT: report,
      KINGSMEN_E2E_TIMEOUT_MS: '3000',
      KINGSMEN_E2E_ALLOW_MUTATIONS: '',
      KINGSMEN_E2E_CANDIDATE_A_TOKEN: '',
      KINGSMEN_E2E_CANDIDATE_B_TOKEN: '',
      KINGSMEN_E2E_REVIEWER_TOKEN: '',
      ...extraEnv
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const status = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  return { status, stdout, stderr, report: (() => { try { return readFileSync(report, 'utf8'); } catch { return ''; } })() };
};
try {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const good = await run([
    { id: 'assert-owner', role: 'anonymous', path: '/assert', expectedStatus: 200, assertJsonPath: 'data.owner', equals: 'candidate-a' },
    { id: 'redact-body', role: 'anonymous', path: '/redact', expectedStatus: 200 }
  ]);
  assert.equal(good.status, 0, `successful plan should pass: ${good.stderr} ${good.stdout}`);
  const goodReport = JSON.parse(good.report);
  assert.equal(goodReport.status, 'STAGING_E2E_PASSED');
  assert.equal(goodReport.caseCount, 2);
  assert.equal(goodReport.passedCases, 2);
  assert.ok(!good.report.includes('must-not-be-written-to-report'), 'response body must not enter report');

  const beforeInvalid = requests;
  const invalid = await run([
    { id: 'valid-first', role: 'anonymous', path: '/assert', expectedStatus: 200 },
    { id: 'bad id contains PII', role: 'anonymous', path: '/must-not-run', expectedStatus: 200 }
  ]);
  assert.equal(invalid.status, 2, 'unsafe case ID must fail preflight');
  assert.ok(invalid.stdout.includes('BLOCKED_INVALID_CASE'));
  assert.equal(requests, beforeInvalid, 'preflight must block the entire plan before any request');

  const mutation = await run([{ id: 'mutate', role: 'anonymous', method: 'POST', path: '/write', expectedStatus: 200 }]);
  assert.equal(mutation.status, 2, 'mutations must be opt-in');
  assert.ok(mutation.stdout.includes('BLOCKED_MUTATION_NOT_AUTHORISED'));

  const missingSession = await run([{ id: 'reviewer', role: 'reviewer', path: '/review', expectedStatus: 401 }]);
  assert.equal(missingSession.status, 2, 'reviewer session must be explicitly provided');
  assert.ok(missingSession.stdout.includes('BLOCKED_SESSION_MISSING'));

  const invalidTimeout = await run([{ id: 'timeout', role: 'anonymous', path: '/x', expectedStatus: 200 }], { KINGSMEN_E2E_TIMEOUT_MS: '999999' });
  assert.equal(invalidTimeout.status, 2, 'timeout must be bounded');
  assert.ok(invalidTimeout.stdout.includes('BLOCKED_INVALID_TIMEOUT'));

  console.log(JSON.stringify({
    schema: 'kingsmen.staging-e2e-unit-tests.v1',
    status: 'PASSED',
    passed: true,
    assertions: 14,
    scenarios: ['HTTP status + JSON assertion', 'response-body redaction', 'whole-plan preflight', 'mutation opt-in', 'reviewer session requirement', 'bounded timeout']
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
  rmSync(tmp, { recursive: true, force: true });
}
