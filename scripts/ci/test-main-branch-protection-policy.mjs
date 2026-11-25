import assert from 'node:assert/strict';
import { evaluateMainBranchProtection, protectionActiveFromEvidence } from './main-branch-protection-policy.mjs';

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

function completeRuleset() {
  return {
    id: 1,
    name: 'main-branch-protection',
    target: 'branch',
    source_type: 'Repository',
    enforcement: 'active',
    current_user_can_bypass: 'never',
    bypass_actors: [],
    conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
    rules: [
      { type: 'creation' },
      { type: 'deletion' },
      { type: 'update' },
      { type: 'non_fast_forward' },
      { type: 'required_linear_history' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 1,
          dismiss_stale_reviews_on_push: true,
          required_review_thread_resolution: true
        }
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [
            { context: 'source-guard', integration_id: 15368 },
            { context: 'Build, validate, and smoke-test', integration_id: 15368 }
          ]
        }
      }
    ]
  };
}

const complete = evaluateMainBranchProtection(completeProtection());
assert.equal(complete.passed, true, 'complete classic protection configuration should pass');
assert.equal(complete.checks.sourceGuardRequired, true);
assert.equal(complete.checks.releaseEvidenceRequired, true, 'the full release evidence check must be required');
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
  assert.equal(result.passed, false, `missing classic ${name} requirement must block`);
}

const completeRulesetResult = evaluateMainBranchProtection(completeRuleset());
assert.equal(completeRulesetResult.passed, true, 'complete active repository ruleset should pass');
assert.equal(completeRulesetResult.checks.protectionSource, 'repository_ruleset');
assert.equal(completeRulesetResult.checks.rulesetActiveForMain, true);
assert.equal(completeRulesetResult.checks.requiredApprovingReviewCount, 1);
assert.equal(completeRulesetResult.checks.adminEnforcementEnabled, true);

const rulesetFailures = [
  ['source_guard', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.required_status_checks = [{ context: 'validate' }]; }],
  ['release_evidence', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.required_status_checks = [{ context: 'source-guard' }]; }],
  ['strict_status_checks', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.strict_required_status_checks_policy = false; }],
  ['review_approval', (value) => { value.rules.find((rule) => rule.type === 'pull_request').parameters.required_approving_review_count = 0; }],
  ['stale_review_dismissal', (value) => { value.rules.find((rule) => rule.type === 'pull_request').parameters.dismiss_stale_reviews_on_push = false; }],
  ['conversation_resolution', (value) => { value.rules.find((rule) => rule.type === 'pull_request').parameters.required_review_thread_resolution = false; }],
  ['linear_history', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'required_linear_history'); }],
  ['bypass_actors', (value) => { value.bypass_actors = [{ actor_type: 'RepositoryRole', actor_id: 5, bypass_mode: 'always' }]; }],
  ['force_push_block', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'non_fast_forward'); }],
  ['deletion_block', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'deletion'); }]
];

for (const [name, mutate] of rulesetFailures) {
  const ruleset = structuredClone(completeRuleset());
  mutate(ruleset);
  const result = evaluateMainBranchProtection(ruleset);
  assert.equal(result.passed, false, `missing ruleset ${name} requirement must block`);
}

const observedActiveButIncompleteRuleset = {
  id: 26323884,
  name: 'main-branch-protection',
  target: 'branch',
  source_type: 'Repository',
  enforcement: 'active',
  current_user_can_bypass: 'never',
  conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
  rules: [
    { type: 'creation' },
    { type: 'deletion' },
    { type: 'update' },
    { type: 'non_fast_forward' },
    {
      type: 'pull_request',
      parameters: {
        required_approving_review_count: 1,
        dismiss_stale_reviews_on_push: false,
        required_review_thread_resolution: false,
        require_code_owner_review: false,
        require_last_push_approval: false
      }
    },
    {
      type: 'required_status_checks',
      parameters: {
        strict_required_status_checks_policy: true,
        do_not_enforce_on_create: true,
        required_status_checks: [
          { context: 'test-and-build', integration_id: 15368 },
          { context: 'validate', integration_id: 15368 }
        ]
      }
    }
  ]
};
const observed = evaluateMainBranchProtection(observedActiveButIncompleteRuleset);
assert.equal(observed.passed, false, 'the observed active ruleset does not meet every release policy requirement');
assert.equal(observed.checks.rulesetActiveForMain, true, 'the observation must still record active protection');
assert.equal(observed.checks.requiredStatusChecksEnabled, true);
assert.equal(observed.checks.strictStatusChecksEnabled, true);
assert.equal(observed.checks.pullRequestReviewRequired, true);
assert.equal(observed.checks.forcePushDisabled, true);
assert.equal(observed.checks.branchDeletionDisabled, true);
assert.equal(observed.checks.sourceGuardRequired, false);
assert.equal(observed.checks.releaseEvidenceRequired, false);
assert.equal(observed.checks.staleReviewsDismissed, false);
assert.equal(observed.checks.conversationResolutionRequired, false);
assert.equal(observed.checks.linearHistoryRequired, false);
assert.equal(observed.checks.adminEnforcementEnabled, false);


assert.equal(protectionActiveFromEvidence(complete.checks, 200, 'classic_branch_protection'), true,
  'verified classic protection object should be considered active');
assert.equal(protectionActiveFromEvidence(completeRulesetResult.checks, 200, 'repository_rulesets'), true,
  'active ruleset applying to main should be considered active');
assert.equal(protectionActiveFromEvidence(observed.checks, 200, 'repository_rulesets'), true,
  'an active but incomplete ruleset is active but does not pass the policy gate');
assert.equal(protectionActiveFromEvidence({ failure: 'no visible ruleset' }, 200, 'repository_rulesets'), false,
  'HTTP 200 from an empty ruleset list must not imply active protection');
assert.equal(protectionActiveFromEvidence({ rulesetActiveForMain: false }, 200, 'repository_rulesets'), false);
assert.equal(protectionActiveFromEvidence(complete.checks, 404, 'classic_branch_protection'), false);

const unavailable = evaluateMainBranchProtection(null);
assert.equal(unavailable.passed, false, 'missing protection response must block');
console.log(JSON.stringify({
  status: 'MAIN_BRANCH_PROTECTION_POLICY_TESTS_PASSED',
  classicConfigurationPassed: true,
  classicNegativeCases: failures.length,
  rulesetConfigurationPassed: true,
  rulesetNegativeCases: rulesetFailures.length,
  observedActiveButIncompleteRulesetDetected: true,
  protectionActiveEvidenceCasesPassed: true,
  unavailableResponseBlocked: true
}, null, 2));
