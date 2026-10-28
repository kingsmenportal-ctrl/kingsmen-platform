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
let supabaseRequests = 0;
const server = createServer((req, res) => {
  requests += 1;
  res.setHeader('content-type', 'application/json');
  if (req.url === '/assert') res.end(JSON.stringify({ data: { owner: 'candidate-a' } }));
  else res.end(JSON.stringify({ secret: 'must-not-be-written-to-report' }));
});
const supabaseServer = createServer((req, res) => {
  supabaseRequests += 1;
  res.setHeader('content-type', 'application/json');
  if (req.url === '/functions/v1/assert-key') res.end(JSON.stringify({ apiKey: req.headers.apikey }));
  else res.end(JSON.stringify({ ok: true }));
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
      KINGSMEN_E2E_SUPABASE_URL: `http://127.0.0.1:${supabaseServer.address().port}`,
      KINGSMEN_E2E_SUPABASE_ANON_KEY: 'test-anon-key',
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
  await new Promise((resolve) => supabaseServer.listen(0, '127.0.0.1', resolve));
  const good = await run([
    { id: 'assert-owner', role: 'anonymous', path: '/assert', expectedStatus: 200, assertJsonPath: 'data.owner', equals: 'candidate-a' },
    { id: 'redact-body', role: 'anonymous', path: '/redact', expectedStatus: 200 },
    { id: 'supabase-apikey-forwarded', target: 'supabase', role: 'anonymous', path: '/functions/v1/assert-key', expectedStatus: 200, assertJsonPath: 'apiKey', equals: 'test-anon-key' }
  ]);
  assert.equal(good.status, 0, `successful plan should pass: ${good.stderr} ${good.stdout}`);
  const goodReport = JSON.parse(good.report);
  assert.equal(goodReport.status, 'STAGING_E2E_PASSED');
  assert.equal(goodReport.caseCount, 3);
  assert.equal(goodReport.passedCases, 3);
  assert.ok(!good.report.includes('must-not-be-written-to-report'), 'response body must not enter report');
  assert.equal(goodReport.targetOrigins.length, 2, 'app and Supabase function origins must be recorded');
  assert.equal(supabaseRequests, 1, 'Supabase case must use its separately configured origin and forward apikey');

  const beforeInvalid = requests + supabaseRequests;
  const invalid = await run([
    { id: 'valid-first', role: 'anonymous', path: '/assert', expectedStatus: 200 },
    { id: 'bad id contains PII', role: 'anonymous', path: '/must-not-run', expectedStatus: 200 }
  ]);
  assert.equal(invalid.status, 2, 'unsafe case ID must fail preflight');
  assert.ok(invalid.stderr.includes('BLOCKED_INVALID_CASE'));
  assert.equal(requests + supabaseRequests, beforeInvalid, 'preflight must block the entire plan before any request');

  const mutation = await run([{ id: 'mutate', role: 'anonymous', method: 'POST', path: '/write', expectedStatus: 200 }]);
  assert.equal(mutation.status, 2, 'mutations must be opt-in');
  assert.ok(mutation.stderr.includes('BLOCKED_MUTATION_NOT_AUTHORISED'));

  const missingSession = await run([{ id: 'reviewer', role: 'reviewer', path: '/review', expectedStatus: 401 }]);
  assert.equal(missingSession.status, 2, 'reviewer session must be explicitly provided');
  assert.ok(missingSession.stderr.includes('BLOCKED_SESSION_MISSING'));

  const invalidSupabaseEscape = await run([
    { id: 'escape-supabase-prefix', target: 'supabase', role: 'anonymous', path: '/rest/v1/platform_reviewers', expectedStatus: 200 }
  ]);
  assert.equal(invalidSupabaseEscape.status, 2, 'Supabase target must be limited to Edge Functions');
  assert.ok(invalidSupabaseEscape.stderr.includes('BLOCKED_CROSS_ORIGIN_CASE'));
  assert.equal(requests + supabaseRequests, beforeInvalid, 'invalid Supabase plan must fail before network I/O');

  const crossOrigin = await run([
    { id: 'escape-app-origin', role: 'anonymous', path: '//example.invalid/other', expectedStatus: 200 }
  ]);
  assert.equal(crossOrigin.status, 2, 'app case must not escape the configured app origin');
  assert.ok(crossOrigin.stderr.includes('BLOCKED_CROSS_ORIGIN_CASE'));
  assert.equal(requests + supabaseRequests, beforeInvalid, 'cross-origin plan must fail before network I/O');

  const unapprovedAppOrigin = await run([{ id: 'app-host-rejected', role: 'anonymous', path: '/x', expectedStatus: 200 }], {
    KINGSMEN_STAGING_BASE_URL: 'https://example.invalid'
  });
  assert.equal(unapprovedAppOrigin.status, 2, 'app target must be pinned to Kingsmen staging');
  assert.ok(unapprovedAppOrigin.stderr.includes('BLOCKED_UNAPPROVED_APP_ORIGIN'));
  assert.equal(requests + supabaseRequests, beforeInvalid, 'unapproved app origin must fail before network I/O');

  const unapprovedSupabaseOrigin = await run([
    { id: 'supabase-host-rejected', target: 'supabase', role: 'anonymous', path: '/functions/v1/test', expectedStatus: 200 }
  ], {
    KINGSMEN_E2E_SUPABASE_URL: 'https://example.invalid'
  });
  assert.equal(unapprovedSupabaseOrigin.status, 2, 'Supabase target must be pinned to Kingsmen staging');
  assert.ok(unapprovedSupabaseOrigin.stderr.includes('BLOCKED_UNAPPROVED_SUPABASE_ORIGIN'));
  assert.equal(requests + supabaseRequests, beforeInvalid, 'unapproved Supabase origin must fail before network I/O');

  const invalidTimeout = await run([{ id: 'timeout', role: 'anonymous', path: '/x', expectedStatus: 200 }], { KINGSMEN_E2E_TIMEOUT_MS: '999999' });
  assert.equal(invalidTimeout.status, 2, 'timeout must be bounded');
  assert.ok(invalidTimeout.stderr.includes('BLOCKED_INVALID_TIMEOUT'));

  console.log(JSON.stringify({
    schema: 'kingsmen.staging-e2e-unit-tests.v1',
    status: 'PASSED',
    passed: true,
    assertions: 28,
    scenarios: ['HTTP status + JSON assertion', 'response-body redaction', 'whole-plan preflight', 'mutation opt-in', 'reviewer session requirement', 'bounded timeout', 'separate Supabase function origin', 'Supabase apikey forwarding', 'Supabase path-prefix boundary', 'app origin boundary', 'app host allowlist', 'Supabase host allowlist']
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await Promise.all([
    new Promise((resolve) => server.close(resolve)),
    new Promise((resolve) => supabaseServer.close(resolve))
  ]);
  rmSync(tmp, { recursive: true, force: true });
}
