#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
const path = 'scripts/staging/run-kingsmen-authenticated-e2e.mjs';
const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
const required = [
  'KINGSMEN_STAGING_BASE_URL', 'KINGSMEN_E2E_PLAN', 'KINGSMEN_E2E_CANDIDATE_A_TOKEN',
  'KINGSMEN_E2E_CANDIDATE_B_TOKEN', 'KINGSMEN_E2E_REVIEWER_TOKEN',
  'BLOCKED_MUTATION_NOT_AUTHORISED', 'BLOCKED_CROSS_ORIGIN_CASE',
  "redirect: 'manual'", 'AbortSignal.timeout', 'planSha256',
  'STAGING_E2E_PASSED', 'STAGING_E2E_FAILED', 'results',
  'BLOCKED_INVALID_TIMEOUT', 'BLOCKED_INVALID_ASSERTION', 'caseIds',
  'BLOCKED_INVALID_CASE_BODY', 'await response.body?.cancel()'
];
const failures = required.filter((token) => !source.includes(token));
const testPath = 'scripts/staging/test-kingsmen-authenticated-e2e.mjs';
const testSource = existsSync(testPath) ? readFileSync(testPath, 'utf8') : '';
const testContracts = ['BLOCKED_MUTATION_NOT_AUTHORISED', 'BLOCKED_SESSION_MISSING', 'response-body redaction', 'whole-plan preflight'];
const missingTests = testContracts.filter((token) => !testSource.includes(token));
const allFailures = [...failures, ...missingTests.map((token) => 'test:' + token)];
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Authenticated Staging E2E Runner Source Contract',
  status: allFailures.length ? 'STAGING_E2E_RUNNER_VALIDATION_FAILED' : 'STAGING_E2E_RUNNER_SOURCE_VALIDATED',
  passed: allFailures.length === 0,
  liveRuntimeExecuted: false,
  requiredContracts: required.length,
  failures: allFailures,
  regressionTestContracts: testContracts.length,
  missingRegressionContracts: missingTests
};
console.log(JSON.stringify(report, null, 2));
if (allFailures.length) process.exitCode = 1;
