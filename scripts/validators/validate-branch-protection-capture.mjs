#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const path = 'scripts/ci/capture-main-branch-protection.mjs';
const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
const policyPath = 'scripts/ci/main-branch-protection-policy.mjs';
const policy = existsSync(policyPath) ? readFileSync(policyPath, 'utf8') : '';
const testPath = 'scripts/ci/test-main-branch-protection-policy.mjs';
const test = existsSync(testPath) ? readFileSync(testPath, 'utf8') : '';
const workflowPath = '.github/workflows/kingsmen-branch-protection-evidence.yml';
const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, 'utf8') : '';

const required = [
  'read_only_ruleset_verification',
  '/rulesets?per_page=100',
  '/rulesets/',
  'evaluateMainBranchProtection',
  'mainBranchTargeted',
  'rulesetEnforced',
  'requiredStatusChecksEnabled',
  'testAndBuildRequired',
  'validateRequired',
  'strictStatusChecksEnabled',
  'pullRequestReviewRequired',
  'noBypassActors',
  'forcePushDisabled',
  'branchDeletionDisabled',
  'UNVERIFIED_PERMISSION_DENIED',
  'BLOCKED_MISSING_READ_TOKEN',
  'KINGSMEN_BRANCH_PROTECTION_READ_TOKEN',
  'Administration: read',
  'BLOCKED_MAIN_BRANCH_RULESET_NOT_FOUND',
  'reviewed: false',
  'redacted: true',
  'sha256',
  'does not apply or change branch protection'
];

const policyRequirements = [
  'mainBranchTargeted',
  'rulesetEnforced',
  'requiredStatusChecksEnabled',
  'testAndBuildRequired',
  'validateRequired',
  'strictStatusChecksEnabled',
  'pullRequestReviewRequired',
  'noBypassActors',
  'forcePushDisabled',
  'branchDeletionDisabled',
  'requiredApprovingReviewCount'
];
const testRequirements = [
  'active main ruleset should pass',
  'test_and_build_check',
  'validate_check',
  'strict_status_checks',
  'approval_count',
  'bypass_actor',
  'force_push_block',
  'deletion_block',
  'missing ruleset response must block'
];

const workflowRequirements = [
  ['workflow runs on pull requests targeting main', workflow.includes('pull_request:') && workflow.includes('branches: [main]')],
  ['workflow runs on pushes to main', workflow.includes('push:') && workflow.includes('branches: [main]')],
  ['manual workflow dispatch remains available', workflow.includes('workflow_dispatch:')],
  ['workflow uses dedicated read-only administration token secret', workflow.includes('KINGSMEN_BRANCH_PROTECTION_READ_TOKEN') && !workflow.includes('administration: read')],
  ['workflow interpolation expressions are not escaped', workflow.includes('github.run_id')],
  ['workflow supplies the actual GitHub run id to the artifact name', workflow.includes('name: kingsmen-main-branch-protection-')],
  ['workflow invokes the read-only evidence capture script', workflow.includes('run: node scripts/ci/capture-main-branch-protection.mjs')],
  ['evidence artifact is attempted even when the verifier blocks release', workflow.includes('if: always()')],
  ['evidence capture script does not issue branch-protection write requests', !['PUT', 'POST', 'PATCH', 'DELETE'].some((method) => source.includes("method: '" + method + "'") || source.includes('method: "' + method + '"'))]
];

const failures = [
  ...required.filter((token) => !source.includes(token)).map((token) => 'capture_script_missing:' + token),
  ...policyRequirements.filter((token) => !policy.includes(token)).map((token) => 'policy_missing:' + token),
  ...testRequirements.filter((token) => !test.includes(token)).map((token) => 'policy_test_missing:' + token),
  ...workflowRequirements.filter(([, passed]) => !passed).map(([name]) => name)
];

const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Main Branch Protection Ruleset Evidence Capture',
  status: failures.length ? 'BRANCH_PROTECTION_CAPTURE_SOURCE_FAILED' : 'BRANCH_PROTECTION_CAPTURE_SOURCE_VALIDATED',
  passed: failures.length === 0,
  assertions: required.length + policyRequirements.length + testRequirements.length + workflowRequirements.length,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
