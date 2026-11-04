export function evaluateMainBranchProtection(ruleset) {
  const rules = Array.isArray(ruleset?.rules) ? ruleset.rules : [];
  const branchIncludes = ruleset?.conditions?.ref_name?.include;
  const requiredStatusRule = rules.find((rule) => rule?.type === 'required_status_checks');
  const requiredStatusParameters = requiredStatusRule?.parameters ?? null;
  const requiredContexts = Array.isArray(requiredStatusParameters?.required_status_checks)
    ? requiredStatusParameters.required_status_checks
      .map((item) => item?.context)
      .filter((name) => typeof name === 'string' && name.length > 0)
    : [];
  const pullRequestRule = rules.find((rule) => rule?.type === 'pull_request');
  const reviewCount = Number.isInteger(pullRequestRule?.parameters?.required_approving_review_count)
    ? pullRequestRule.parameters.required_approving_review_count
    : 0;
  const bypassActors = Array.isArray(ruleset?.bypass_actors) ? ruleset.bypass_actors : null;

  const checks = {
    mainBranchTargeted: ruleset?.target === 'branch'
      && Array.isArray(branchIncludes)
      && branchIncludes.includes('refs/heads/main'),
    rulesetEnforced: ruleset?.enforcement === 'active',
    requiredStatusChecksEnabled: requiredStatusRule !== undefined,
    testAndBuildRequired: requiredContexts.includes('test-and-build'),
    validateRequired: requiredContexts.includes('validate'),
    strictStatusChecksEnabled: requiredStatusParameters?.strict_required_status_checks_policy === true,
    pullRequestReviewRequired: reviewCount >= 1,
    requiredApprovingReviewCount: reviewCount,
    noBypassActors: bypassActors !== null && bypassActors.length === 0,
    forcePushDisabled: rules.some((rule) => rule?.type === 'non_fast_forward'),
    branchDeletionDisabled: rules.some((rule) => rule?.type === 'deletion')
  };

  const requiredBooleanChecks = [
    'mainBranchTargeted',
    'rulesetEnforced',
    'requiredStatusChecksEnabled',
    'testAndBuildRequired',
    'validateRequired',
    'strictStatusChecksEnabled',
    'pullRequestReviewRequired',
    'noBypassActors',
    'forcePushDisabled',
    'branchDeletionDisabled'
  ];
  const passed = requiredBooleanChecks.every((name) => checks[name] === true);

  return { passed, checks };
}
