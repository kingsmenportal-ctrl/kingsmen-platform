import assert from 'node:assert/strict';
import { evaluateMainBranchProtection } from './main-branch-protection-policy.mjs';

function completeProtection() {
  return {
    required_status_checks: {
      strict: true,
      contexts: ['source-guard', 'Build, validate, and smoke-test']
    },
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true
    },
    required_conversation_resolution: { enabled: true },
    required_linear_history: { enabled: true },
    enforce_admins: { enabled: true },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false }
  };
}

const complete = evaluateMainBranchProtection(completeProtection());
assert.equal(complete.passed, true, 'complete protection configuration should pass');
assert.equal(complete.checks.requiredApprovingReviewCount, 1);

const failures = [
  ['required_status_checks', (value) => { value.required_status_checks = null; }],
  ['source_guard', (value) => { value.required_status_checks.contexts = ['build']; }],
  ['release_evidence_check', (value) => { value.required_status_checks.contexts = ['source-guard']; }],
  ['strict_status_checks', (value) => { value.required_status_checks.strict = false; }],
  ['pull_request_review', (value) => { value.required_pull_request_reviews.required_approving_review_count = 0; }],
  ['stale_review_dismissal', (value) => { value.required_pull_request_reviews.dismiss_stale_reviews = false; }],
  ['conversation_resolution', (value) => { value.required_conversation_resolution.enabled = false; }],
  ['linear_history', (value) => { value.required_linear_history.enabled = false; }],
  ['admin_enforcement', (value) => { value.enforce_admins.enabled = false; }],
  ['force_push_block', (value) => { value.allow_force_pushes.enabled = true; }],
  ['deletion_block', (value) => { value.allow_deletions.enabled = true; }]
];

for (const [name, mutate] of failures) {
  const protection = structuredClone(completeProtection());
  mutate(protection);
  const result = evaluateMainBranchProtection(protection);
  assert.equal(result.passed, false, `missing ${name} requirement must block`);
}

const unavailable = evaluateMainBranchProtection(null);
assert.equal(unavailable.passed, false, 'missing protection response must block');
console.log(JSON.stringify({
  status: 'MAIN_BRANCH_PROTECTION_POLICY_TESTS_PASSED',
  passedConfiguration: true,
  negativeCases: failures.length,
  unavailableResponseBlocked: true
}, null, 2));
