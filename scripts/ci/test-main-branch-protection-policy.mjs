import assert from "node:assert/strict";
import { evaluateMainBranchProtection } from "./main-branch-protection-policy.mjs";

function validRules() {
  return [
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [
          { context: "test-and-build" },
          { context: "validate" }
        ]
      }
    },
    {
      type: "pull_request",
      parameters: { required_approving_review_count: 1 }
    },
    { type: "non_fast_forward", parameters: {} },
    { type: "deletion", parameters: {} }
  ];
}

const valid = evaluateMainBranchProtection(validRules());
assert.equal(valid.passed, true);
assert.equal(valid.checks.candidateBuildRequired, true);
assert.equal(valid.checks.validationRequired, true);
assert.equal(valid.checks.requiredApprovingReviewCount, 1);

const failures = [
  ["no_effective_rules", (rules) => rules.splice(0, rules.length)],
  ["no_required_status_checks", (rules) => { rules[0].parameters.required_status_checks = []; }],
  ["missing_build", (rules) => { rules[0].parameters.required_status_checks = [{ context: "validate" }]; }],
  ["missing_validation", (rules) => { rules[0].parameters.required_status_checks = [{ context: "test-and-build" }]; }],
  ["non_strict_checks", (rules) => { rules[0].parameters.strict_required_status_checks_policy = false; }],
  ["no_review_rule", (rules) => { rules.splice(1, 1); }],
  ["zero_approvals", (rules) => { rules[1].parameters.required_approving_review_count = 0; }],
  ["force_push_not_blocked", (rules) => { rules.splice(2, 1); }],
  ["deletion_not_blocked", (rules) => { rules.splice(3, 1); }],
  ["unrelated_deployments", (rules) => { rules.push({ type: "required_deployments", parameters: { required_deployment_environments: ["copilot", "github-pages", "staging"] } }); }]
];

for (const [name, mutate] of failures) {
  const rules = structuredClone(validRules());
  mutate(rules);
  assert.equal(evaluateMainBranchProtection(rules).passed, false, name + " must block");
}

assert.equal(evaluateMainBranchProtection(null).passed, false);
console.log(JSON.stringify({
  status: "MAIN_BRANCH_PROTECTION_POLICY_TESTS_PASSED",
  positiveCases: 1,
  negativeCases: failures.length,
  unavailableResponseBlocked: true
}, null, 2));
