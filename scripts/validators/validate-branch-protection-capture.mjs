#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const path = 'scripts/ci/capture-main-branch-protection.mjs';
const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
const required = [
  'read_only_branch_protection_verification',
  '/branches/\u0024{branch}/protection',
  'sourceGuardRequired',
  'pullRequestReviewRequired',
  'adminEnforcementEnabled',
  'forcePushDisabled',
  'branchDeletionDisabled',
  'UNVERIFIED_PERMISSION_DENIED',
  'BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE',
  'reviewed: false',
  'redacted: true',
  'sha256',
  'does not apply or change branch protection'
];
const failures = required.filter((token) => !source.includes(token));
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Main Branch Protection Evidence Capture',
  status: failures.length ? 'BRANCH_PROTECTION_CAPTURE_SOURCE_FAILED' : 'BRANCH_PROTECTION_CAPTURE_SOURCE_VALIDATED',
  passed: failures.length === 0,
  assertions: required.length,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
