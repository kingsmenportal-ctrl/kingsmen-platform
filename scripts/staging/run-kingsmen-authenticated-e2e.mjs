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
const allowedMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']);
const caseIds = new Set();
const prepared = plan.cases.map((test) => {
  if (!test || typeof test.id !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/.test(test.id) ||
      caseIds.has(test.id) || typeof test.path !== 'string' || !test.path.startsWith('/') ||
      !allowedRoles.has(test.role) || !Number.isInteger(test.expectedStatus) ||
      test.expectedStatus < 100 || test.expectedStatus > 599) {
    fail('BLOCKED_INVALID_CASE', 'Cases require a unique safe ID, absolute path, allowed role, and HTTP expectedStatus.');
  }
  caseIds.add(test.id);
  const method = typeof test.method === 'string' ? test.method.toUpperCase() : 'GET';
  if (!allowedMethods.has(method)) fail('BLOCKED_INVALID_METHOD', 'Unsupported HTTP method.');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && process.env.KINGSMEN_E2E_ALLOW_MUTATIONS !== 'true') {
    fail('BLOCKED_MUTATION_NOT_AUTHORISED', 'Mutating cases require explicit KINGSMEN_E2E_ALLOW_MUTATIONS=true.');
  }
  if (test.body !== undefined && !['POST', 'PUT', 'PATCH'].includes(method)) {
    fail('BLOCKED_INVALID_CASE_BODY', 'A JSON request body is allowed only for POST, PUT, or PATCH.');
  }
  if (test.assertJsonPath !== undefined && (typeof test.assertJsonPath !== 'string' || !/^[A-Za-z0-9_$.-]+$/.test(test.assertJsonPath))) {
    fail('BLOCKED_INVALID_ASSERTION', 'JSON assertion path must contain only safe property-path characters.');
  }
  const target = new URL(test.path, origin);
  if (target.origin !== origin.origin || target.username || target.password) fail('BLOCKED_CROSS_ORIGIN_CASE', 'Case path must remain on staging origin.');
  return { test, method, target };
});
const timeoutMs = Number(process.env.KINGSMEN_E2E_TIMEOUT_MS || 15000);
if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) {
  fail('BLOCKED_INVALID_TIMEOUT', 'KINGSMEN_E2E_TIMEOUT_MS must be an integer between 100 and 120000.');
}
const results = [];
for (const { test, method, target } of prepared) {
  const tokenEnv = {
    candidate_a: 'KINGSMEN_E2E_CANDIDATE_A_TOKEN',
    candidate_b: 'KINGSMEN_E2E_CANDIDATE_B_TOKEN',
    reviewer: 'KINGSMEN_E2E_REVIEWER_TOKEN'
  }[test.role];
  if (tokenEnv && !process.env[tokenEnv]) fail('BLOCKED_SESSION_MISSING', 'A required authorised staging session token is missing.');
  const headers = { accept: 'application/json', 'x-kingsmen-e2e-case': test.id };
  if (tokenEnv) headers.authorization = 'Bearer ' + process.env[tokenEnv];
  if (test.body !== undefined) headers['content-type'] = 'application/json';
  const started = Date.now();
  let response;
  try {
    response = await fetch(target, {
      method, headers, body: test.body === undefined ? undefined : JSON.stringify(test.body),
      redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    results.push({ id: test.id, passed: false, status: null, durationMs: Date.now() - started, reason: 'request_failed' });
    continue;
  }
  const durationMs = Date.now() - started;
  let json = null;
  if (test.assertJsonPath) {
    try { json = await response.json(); } catch { json = null; }
  } else {
    try { await response.body?.cancel(); } catch {}
  }
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
