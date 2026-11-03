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
  'read_only_effective_branch_rules_verification',
  '/rules/branches/',
  '/rulesets?includes_parents=true',
  '/rulesets/${ruleset.id}',
  'BLOCKED_RULESET_DETAIL_UNAVAILABLE',
  'evaluateMainBranchProtection',
  'activeRulesPresent',
  'activeRulesetPresent',
  'requiredStatusChecksEnabled',
  'sourceGuardRequired',
  'strictStatusChecksEnabled',
  'pullRequestReviewRequired',
  'staleReviewsDismissed',
  'conversationResolutionRequired',
  'linearHistoryRequired',
  'adminEnforcementEnabled',
  'forcePushDisabled',
  'branchDeletionDisabled',
  'unrestrictedBypassActorCount',
  'UNVERIFIED_PERMISSION_DENIED',
  'BLOCKED_RULES_NOT_FOUND_OR_NOT_VISIBLE',
  'BLOCKED_RULESET_METADATA_UNAVAILABLE',
  'reviewed: false',
  'redacted: true',
  'sha256',
  'does not apply or change branch protection'
];

const policyRequirements = [
  'activeProtectionPresent',
  'activeRulesPresent',
  'activeRulesetPresent',
  'requiredStatusChecksEnabled',
  'sourceGuardRequired',
  'strictStatusChecksEnabled',
  'pullRequestReviewRequired',
  'staleReviewsDismissed',
  'conversationResolutionRequired',
  'linearHistoryRequired',
  'adminEnforcementEnabled',
  'forcePushDisabled',
  'branchDeletionDisabled',
  'requiredApprovingReviewCount',
  'requiredDeploymentEnvironments'
];
const testRequirements = [
  'complete classic protection configuration should pass',
  'complete effective ruleset configuration should pass',
  'active but incomplete ruleset must not be reported as fully protected',
  'always-bypass actors must be reported accurately',
  'unavailableResponseBlocked'
];

const workflowRequirements = [
  ['workflow runs on pull requests targeting main', workflow.includes('pull_request:') && workflow.includes('branches: [main]')],
  ['workflow runs on pushes to main', workflow.includes('push:') && workflow.includes('branches: [main]')],
  ['manual workflow dispatch remains available', workflow.includes('workflow_dispatch:')],
  ['workflow uses the built-in GitHub token rather than a bespoke PAT secret', workflow.includes('GITHUB_TOKEN: ${{ github.token }}') && !workflow.includes('KINGSMEN_BRANCH_PROTECTION_READ_TOKEN')],
  ['workflow invokes the effective-rules evidence capture script', workflow.includes('run: node scripts/ci/capture-main-branch-protection.mjs')],
  ['evidence artifact is attempted even when the verifier blocks release', workflow.includes('if: always()')],
  ['evidence capture script does not issue branch-protection write requests', !['PUT', 'POST', 'PATCH', 'DELETE'].some((method) => source.includes(`method: '${method}'`) || source.includes(`method: "${method}"`))]
];

const failures = [
  ...required.filter((token) => !source.includes(token)).map((token) => `capture_script_missing:${token}`),
  ...policyRequirements.filter((token) => !policy.includes(token)).map((token) => `policy_missing:${token}`),
  ...testRequirements.filter((token) => !test.includes(token)).map((token) => `policy_test_missing:${token}`),
  ...workflowRequirements.filter(([, passed]) => !passed).map(([name]) => name)
];

const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Effective Main Branch Rules Evidence Capture',
  status: failures.length ? 'BRANCH_PROTECTION_CAPTURE_SOURCE_FAILED' : 'BRANCH_PROTECTION_CAPTURE_SOURCE_VALIDATED',
  passed: failures.length === 0,
  assertions: required.length + policyRequirements.length + testRequirements.length + workflowRequirements.length,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
