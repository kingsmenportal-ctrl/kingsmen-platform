import assert from 'node:assert/strict';
import { evaluateMainBranchProtection } from './main-branch-protection-policy.mjs';

function completeClassicProtection() {
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

const completeClassic = evaluateMainBranchProtection(completeClassicProtection());
assert.equal(completeClassic.passed, true, 'complete classic protection configuration should pass');
assert.equal(completeClassic.checks.sourceGuardRequired, true);
assert.equal(completeClassic.checks.releaseEvidenceRequired, true);
assert.equal(completeClassic.checks.requiredApprovingReviewCount, 1);

const classicFailures = [
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

for (const [name, mutate] of classicFailures) {
  const protection = structuredClone(completeClassicProtection());
  mutate(protection);
  assert.equal(evaluateMainBranchProtection(protection).passed, false, `missing classic ${name} requirement must block`);
}

function completeRuleset() {
  const rulesetId = 26323884;
  const rules = [
    'required_status_checks', 'pull_request', 'required_linear_history',
    'non_fast_forward', 'deletion', 'required_deployments'
  ].map((type) => ({
    type,
    ruleset_id: rulesetId,
    ruleset_source_type: 'Repository',
    ruleset_source: 'kingsmenportal-ctrl/kingsmen-platform',
    parameters: {}
  }));
  rules.find((item) => item.type === 'required_status_checks').parameters = {
    strict_required_status_checks_policy: true,
    required_status_checks: [
      { context: 'source-guard' },
      { context: 'Build, validate, and smoke-test' }
    ]
  };
  rules.find((item) => item.type === 'pull_request').parameters = {
    required_approving_review_count: 1,
    dismiss_stale_reviews_on_push: true,
    required_review_thread_resolution: true
  };
  rules.find((item) => item.type === 'required_deployments').parameters = {
    required_deployment_environments: ['copilot', 'github-pages', 'ndabenhlemvelo-arch', 'staging']
  };
  const rulesets = [{
    id: rulesetId,
    enforcement: 'active',
    conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
    bypass_actors: [],
    current_user_can_bypass: 'never'
  }];
  return { rules, rulesets };
}

const { rules: completeRules, rulesets: completeRulesets } = completeRuleset();
const completeEffective = evaluateMainBranchProtection(completeRules, completeRulesets);
assert.equal(completeEffective.passed, true, 'complete effective ruleset configuration should pass');
assert.equal(completeEffective.checks.requiredDeploymentEnvironments.length, 4);
assert.equal(completeEffective.checks.unrestrictedBypassActorCount, 0);
assert.equal(completeEffective.checks.bypassActorsVisible, true);
assert.equal(completeEffective.checks.currentUserCanAlwaysBypass, false);
assert.equal(completeEffective.checks.adminEnforcementEnabled, true);

const currentMainRules = [
  'deletion', 'creation', 'update', 'required_deployments', 'pull_request', 'required_status_checks'
].map((type) => ({ type, ruleset_id: 26323884, parameters: {} }));
currentMainRules.find((item) => item.type === 'required_status_checks').parameters = {
  strict_required_status_checks_policy: true,
  required_status_checks: []
};
currentMainRules.find((item) => item.type === 'pull_request').parameters = {
  required_approving_review_count: 0,
  dismiss_stale_reviews_on_push: false,
  required_review_thread_resolution: false
};
currentMainRules.find((item) => item.type === 'required_deployments').parameters = {
  required_deployment_environments: ['copilot', 'github-pages', 'ndabenhlemvelo-arch', 'staging']
};
const currentMainRulesets = [{
  id: 26323884,
  enforcement: 'active',
  conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
  bypass_actors: [{ actor_type: 'RepositoryRole', bypass_mode: 'always' }],
  current_user_can_bypass: 'always'
}];
const current = evaluateMainBranchProtection(currentMainRules, currentMainRulesets);
assert.equal(current.checks.activeProtectionPresent, true, 'current branch has an active ruleset');
assert.equal(current.checks.requiredDeploymentEnvironments.length, 4, 'current ruleset requires the four declared deployment environments');
assert.equal(current.checks.requiredStatusChecksEnabled, false, 'empty required status checks must be reported accurately');
assert.equal(current.checks.pullRequestReviewRequired, false, 'zero required approvals must be reported accurately');
assert.equal(current.checks.adminEnforcementEnabled, false, 'always-bypass actors must be reported accurately');
assert.equal(current.checks.unrestrictedBypassActorCount, 1);
assert.equal(current.checks.currentUserCanAlwaysBypass, true, 'the GitHub API current_user_can_bypass field must be evaluated');
const hiddenBypass = evaluateMainBranchProtection(completeRules, [{ id: 26323884, enforcement: 'active', current_user_can_bypass: 'always' }]);
assert.equal(hiddenBypass.checks.bypassActorsVisible, false, 'redacted bypass metadata must be reported as unknown');
assert.equal(hiddenBypass.checks.unrestrictedBypassActorCount, null, 'unknown bypass count must never be represented as zero');
assert.equal(hiddenBypass.checks.adminEnforcementEnabled, false, 'hidden bypass metadata must fail closed');
assert.equal(hiddenBypass.checks.currentUserCanAlwaysBypass, true, 'current-user bypass must remain visible even when actor details are redacted');
assert.equal(current.passed, false, 'active but incomplete ruleset must not be reported as fully protected');

const unavailable = evaluateMainBranchProtection(null);
assert.equal(unavailable.passed, false, 'missing protection response must block');

console.log(JSON.stringify({
  status: 'MAIN_BRANCH_PROTECTION_POLICY_TESTS_PASSED',
  classicNegativeCases: classicFailures.length,
  effectiveRuleset: completeEffective.passed,
  activeButIncompleteRulesetDetected: !current.passed,
  hiddenBypassMetadataFailsClosed: !hiddenBypass.passed,
  currentUserAlwaysBypassDetected: current.checks.currentUserCanAlwaysBypass && hiddenBypass.checks.currentUserCanAlwaysBypass,
  unavailableResponseBlocked: true
}, null, 2));
