#!/usr/bin/env node
/**
 * Authenticated Kingsmen staging E2E runner.
 * Uses only explicitly supplied, authorised staging sessions and existing fixtures.
 * Never creates identities or documents and never writes response bodies to reports.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const fail = (code, message) => {
  console.error(JSON.stringify({ schema: 'kingsmen.staging-e2e.v1', status: code, message }));
  process.exit(2);
};
const base = process.env.KINGSMEN_STAGING_BASE_URL;
const planPath = process.env.KINGSMEN_E2E_PLAN;
if (!base || !planPath) fail('BLOCKED_CONFIGURATION_MISSING', 'Set KINGSMEN_STAGING_BASE_URL and KINGSMEN_E2E_PLAN.');
let origin;
try { origin = new URL(base); } catch { fail('BLOCKED_INVALID_BASE_URL', 'Staging base URL is invalid.'); }
if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) {
  fail('BLOCKED_INSECURE_BASE_URL', 'HTTPS is required except for localhost.');
}
let plan;
try { plan = JSON.parse(readFileSync(resolve(planPath), 'utf8')); } catch {
  fail('BLOCKED_INVALID_PLAN', 'The E2E plan is missing or invalid JSON.');
}
if (plan.schema !== 'kingsmen.staging-e2e-plan.v1' || !Array.isArray(plan.cases) || plan.cases.length === 0) {
  fail('BLOCKED_INVALID_PLAN', 'Plan must use kingsmen.staging-e2e-plan.v1 and contain cases.');
}
const allowedRoles = new Set(['anonymous', 'candidate_a', 'candidate_b', 'reviewer']);
const results = [];
for (const test of plan.cases) {
  if (!test.id || typeof test.path !== 'string' || !test.path.startsWith('/') ||
      !allowedRoles.has(test.role) || !Number.isInteger(test.expectedStatus)) {
    fail('BLOCKED_INVALID_CASE', 'Each case requires id, absolute path, role, and expectedStatus.');
  }
  const method = (test.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && process.env.KINGSMEN_E2E_ALLOW_MUTATIONS !== 'true') {
    fail('BLOCKED_MUTATION_NOT_AUTHORISED', 'Mutating cases require explicit KINGSMEN_E2E_ALLOW_MUTATIONS=true.');
  }
  if (!['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    fail('BLOCKED_INVALID_METHOD', 'Unsupported HTTP method.');
  }
  const target = new URL(test.path, origin);
  if (target.origin !== origin.origin) fail('BLOCKED_CROSS_ORIGIN_CASE', 'Case path must remain on staging origin.');
  const tokenEnv = {
    candidate_a: 'KINGSMEN_E2E_CANDIDATE_A_TOKEN',
    candidate_b: 'KINGSMEN_E2E_CANDIDATE_B_TOKEN',
    reviewer: 'KINGSMEN_E2E_REVIEWER_TOKEN'
  }[test.role];
  if (tokenEnv && !process.env[tokenEnv]) fail('BLOCKED_SESSION_MISSING', 'A required authorised staging session token is missing.');
  const headers = { accept: 'application/json', 'x-kingsmen-e2e-case': String(test.id).slice(0, 100) };
  if (tokenEnv) headers.authorization = 'Bearer ' + process.env[tokenEnv];
  if (test.body !== undefined) headers['content-type'] = 'application/json';
  const started = Date.now();
  let response;
  try {
    response = await fetch(target, {
      method, headers, body: test.body === undefined ? undefined : JSON.stringify(test.body),
      redirect: 'manual', signal: AbortSignal.timeout(Number(process.env.KINGSMEN_E2E_TIMEOUT_MS || 15000))
    });
  } catch {
    results.push({ id: test.id, passed: false, status: null, durationMs: Date.now() - started, reason: 'request_failed' });
    continue;
  }
  const durationMs = Date.now() - started;
  let text = '';
  try { text = await response.text(); } catch {}
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  let passed = response.status === test.expectedStatus;
  let reason = passed ? null : 'unexpected_status';
  if (passed && test.assertJsonPath) {
    const value = test.assertJsonPath.split('.').reduce((v, k) => v == null ? undefined : v[k], json);
    if (Object.prototype.hasOwnProperty.call(test, 'equals') && value !== test.equals) {
      passed = false; reason = 'json_assertion_failed';
    }
    if (test.notEquals !== undefined && value === test.notEquals) {
      passed = false; reason = 'json_assertion_failed';
    }
  }
  results.push({ id: test.id, passed, status: response.status, durationMs, reason });
}
const failed = results.filter(x => !x.passed).length;
const report = {
  schema: 'kingsmen.staging-e2e.v1',
  status: failed ? 'STAGING_E2E_FAILED' : 'STAGING_E2E_PASSED',
  passed: failed === 0,
  targetOrigin: origin.origin,
  planSha256: createHash('sha256').update(JSON.stringify(plan)).digest('hex'),
  caseCount: results.length, passedCases: results.length - failed, failedCases: failed,
  mutationCasesAllowed: process.env.KINGSMEN_E2E_ALLOW_MUTATIONS === 'true',
  results
};
const out = process.env.KINGSMEN_E2E_REPORT || 'reports/staging/authenticated-e2e-latest.json';
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;
