#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const path = 'scripts/ci/capture-main-branch-protection.mjs';
const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
const workflowPath = '.github/workflows/kingsmen-branch-protection-evidence.yml';
const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, 'utf8') : '';

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

const workflowRequirements = [
  ['workflow runs on pull requests targeting main', workflow.includes('  pull_request:\n    branches: [main]')],
  ['workflow runs on pushes to main', workflow.includes('  push:\n    branches: [main]')],
  ['manual workflow dispatch remains available', workflow.includes('  workflow_dispatch:')],
  ['workflow uses read-only administration permission', workflow.includes('  administration: read')],
  ['workflow invokes the read-only evidence capture script', workflow.includes('run: node scripts/ci/capture-main-branch-protection.mjs')],
  ['evidence artifact is attempted even when the verifier blocks release', workflow.includes('        if: always()')],
  ['evidence capture script does not issue branch-protection write requests', !/method:\s*['"](PUT|POST|PATCH|DELETE)['"]/i.test(source)]
];

const failures = [
  ...required.filter((token) => !source.includes(token)).map((token) => `capture_script_missing:${token}`),
  ...workflowRequirements.filter(([, passed]) => !passed).map(([name]) => name)
];

const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Main Branch Protection Evidence Capture',
  status: failures.length ? 'BRANCH_PROTECTION_CAPTURE_SOURCE_FAILED' : 'BRANCH_PROTECTION_CAPTURE_SOURCE_VALIDATED',
  passed: failures.length === 0,
  assertions: required.length + workflowRequirements.length,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
