import assert from 'node:assert/strict';
import { evaluateMainBranchProtection } from './main-branch-protection-policy.mjs';

function completeRuleset() {
  return {
    id: 26323884,
    name: 'main-branch-protection',
    target: 'branch',
    source_type: 'Repository',
    source: 'kingsmenportal-ctrl/kingsmen-platform',
    enforcement: 'active',
    conditions: {
      ref_name: {
        exclude: [],
        include: ['refs/heads/main']
      }
    },
    rules: [
      { type: 'deletion' },
      { type: 'creation' },
      { type: 'update' },
      {
        type: 'pull_request',
        parameters: { required_approving_review_count: 1 }
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [
            { context: 'test-and-build', integration_id: 15368 },
            { context: 'validate', integration_id: 15368 }
          ]
        }
      },
      { type: 'non_fast_forward' }
    ],
    bypass_actors: []
  };
}

const complete = evaluateMainBranchProtection(completeRuleset());
assert.equal(complete.passed, true, 'the active main ruleset should pass');
assert.equal(complete.checks.mainBranchTargeted, true);
assert.equal(complete.checks.testAndBuildRequired, true);
assert.equal(complete.checks.validateRequired, true);
assert.equal(complete.checks.strictStatusChecksEnabled, true);
assert.equal(complete.checks.requiredApprovingReviewCount, 1);
assert.equal(complete.checks.noBypassActors, true);
assert.equal(complete.checks.forcePushDisabled, true);
assert.equal(complete.checks.branchDeletionDisabled, true);

const failures = [
  ['inactive_enforcement', (value) => { value.enforcement = 'disabled'; }],
  ['wrong_branch_scope', (value) => { value.conditions.ref_name.include = ['refs/heads/develop']; }],
  ['wrong_target', (value) => { value.target = 'tag'; }],
  ['required_status_checks', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'required_status_checks'); }],
  ['test_and_build_check', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.required_status_checks = [{ context: 'validate' }]; }],
  ['validate_check', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.required_status_checks = [{ context: 'test-and-build' }]; }],
  ['strict_status_checks', (value) => { value.rules.find((rule) => rule.type === 'required_status_checks').parameters.strict_required_status_checks_policy = false; }],
  ['pull_request_review', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'pull_request'); }],
  ['approval_count', (value) => { value.rules.find((rule) => rule.type === 'pull_request').parameters.required_approving_review_count = 0; }],
  ['bypass_actor', (value) => { value.bypass_actors = [{ actor_id: 1, actor_type: 'User', bypass_mode: 'always' }]; }],
  ['force_push_block', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'non_fast_forward'); }],
  ['deletion_block', (value) => { value.rules = value.rules.filter((rule) => rule.type !== 'deletion'); }]
];

for (const [name, mutate] of failures) {
  const ruleset = structuredClone(completeRuleset());
  mutate(ruleset);
  const result = evaluateMainBranchProtection(ruleset);
  assert.equal(result.passed, false, 'missing ' + name + ' requirement must block');
}

const unavailable = evaluateMainBranchProtection(null);
assert.equal(unavailable.passed, false, 'missing ruleset response must block');

console.log(JSON.stringify({
  status: 'MAIN_BRANCH_RULESET_POLICY_TESTS_PASSED',
  passedConfiguration: true,
  negativeCases: failures.length,
  unavailableResponseBlocked: true
}, null, 2));
