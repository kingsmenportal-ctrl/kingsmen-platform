function rulesOfType(rules, type) {
  return rules.filter((rule) => rule && rule.type === type);
}

function requiredContexts(rules) {
  const contexts = [];
  for (const rule of rulesOfType(rules, "required_status_checks")) {
    const required = Array.isArray(rule.parameters?.required_status_checks)
      ? rule.parameters.required_status_checks
      : [];
    for (const entry of required) {
      if (typeof entry?.context === "string" && entry.context.trim()) {
        contexts.push(entry.context.trim());
      }
    }
  }
  return [...new Set(contexts)];
}

/**
 * Evaluate GitHub's effective rules for main. The regular stream gate is
 * intentionally limited to the routine build and validation checks, one
 * approving review, and protection against force-push and branch deletion.
 * Deep specialist proofs and deployment evidence remain separate release
 * work rather than global prerequisites for every feature PR.
 */
export function evaluateMainBranchProtection(effectiveRules) {
  const rules = Array.isArray(effectiveRules) ? effectiveRules : [];
  const contexts = requiredContexts(rules);
  const statusRules = rulesOfType(rules, "required_status_checks");
  const pullRules = rulesOfType(rules, "pull_request");

  const reviewCount = pullRules.reduce((max, rule) => {
    const count = Number(rule.parameters?.required_approving_review_count ?? 0);
    return Number.isInteger(count) ? Math.max(max, count) : max;
  }, 0);

  const deploymentEnvironments = [...new Set(
    rulesOfType(rules, "required_deployments")
      .flatMap((rule) => Array.isArray(rule.parameters?.required_deployment_environments)
        ? rule.parameters.required_deployment_environments
        : [])
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim())
  )];

  const checks = {
    effectiveRulesPresent: rules.length > 0,
    requiredStatusChecksEnabled: statusRules.length > 0 && contexts.length > 0,
    candidateBuildRequired: contexts.includes("test-and-build"),
    validationRequired: contexts.includes("validate"),
    strictStatusChecksEnabled: statusRules.length > 0 &&
      statusRules.every((rule) => rule.parameters?.strict_required_status_checks_policy === true),
    pullRequestRulePresent: pullRules.length > 0,
    pullRequestReviewRequired: reviewCount >= 1,
    requiredApprovingReviewCount: reviewCount,
    forcePushDisabled: rulesOfType(rules, "non_fast_forward").length > 0,
    branchDeletionDisabled: rulesOfType(rules, "deletion").length > 0,
    requiredDeploymentEnvironments: deploymentEnvironments,
    noUnrelatedDeploymentPrerequisites: deploymentEnvironments.length === 0
  };

  const required = [
    "effectiveRulesPresent",
    "requiredStatusChecksEnabled",
    "candidateBuildRequired",
    "validationRequired",
    "strictStatusChecksEnabled",
    "pullRequestRulePresent",
    "pullRequestReviewRequired",
    "forcePushDisabled",
    "branchDeletionDisabled",
    "noUnrelatedDeploymentPrerequisites"
  ];

  return {
    passed: required.every((key) => checks[key] === true),
    checks
  };
}
