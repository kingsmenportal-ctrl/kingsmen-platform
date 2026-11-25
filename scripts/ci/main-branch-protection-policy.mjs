function requiredPolicyChecks(checks) {
  const requiredBooleanChecks = [
    'requiredStatusChecksEnabled',
    'sourceGuardRequired',
    'releaseEvidenceRequired',
    'strictStatusChecksEnabled',
    'pullRequestReviewRequired',
    'staleReviewsDismissed',
    'conversationResolutionRequired',
    'linearHistoryRequired',
    'adminEnforcementEnabled',
    'forcePushDisabled',
    'branchDeletionDisabled'
  ];
  return requiredBooleanChecks.every((name) => checks[name] === true);
}

function evaluateClassicProtection(protection) {
  const requiredStatusChecks = protection?.required_status_checks ?? null;
  const requiredContexts = Array.isArray(requiredStatusChecks?.contexts)
    ? requiredStatusChecks.contexts.filter((name) => typeof name === 'string' && name.length > 0)
    : [];
  const requiredCheckObjects = Array.isArray(requiredStatusChecks?.checks)
    ? requiredStatusChecks.checks
    : [];
  const requiredCheckNames = requiredCheckObjects
    .map((item) => item?.context)
    .filter((name) => typeof name === 'string' && name.length > 0);
  const allRequiredCheckNames = [...new Set([...requiredContexts, ...requiredCheckNames])];
  const reviewPolicy = protection?.required_pull_request_reviews ?? null;
  const reviewCount = Number.isInteger(reviewPolicy?.required_approving_review_count)
    ? reviewPolicy.required_approving_review_count
    : 0;

  const checks = {
    protectionSource: 'classic_branch_protection',
    requiredStatusChecksEnabled: allRequiredCheckNames.length > 0,
    requiredStatusCheckContexts: allRequiredCheckNames,
    sourceGuardRequired: allRequiredCheckNames.some(
      (name) => name === 'source-guard' || name.endsWith('/source-guard')
    ),
    releaseEvidenceRequired: allRequiredCheckNames.includes('Build, validate, and smoke-test'),
    strictStatusChecksEnabled: requiredStatusChecks?.strict === true,
    pullRequestReviewRequired: reviewCount >= 1,
    staleReviewsDismissed: reviewPolicy?.dismiss_stale_reviews === true,
    conversationResolutionRequired: protection?.required_conversation_resolution?.enabled === true,
    linearHistoryRequired: protection?.required_linear_history?.enabled === true,
    adminEnforcementEnabled: protection?.enforce_admins?.enabled === true,
    forcePushDisabled: protection?.allow_force_pushes?.enabled === false,
    branchDeletionDisabled: protection?.allow_deletions?.enabled === false,
    requiredApprovingReviewCount: reviewCount
  };
  return { passed: requiredPolicyChecks(checks), checks };
}

function evaluateRepositoryRuleset(ruleset) {
  const rules = Array.isArray(ruleset?.rules) ? ruleset.rules : [];
  const conditions = ruleset?.conditions?.ref_name;
  const includesMain = Array.isArray(conditions?.include) && conditions.include.includes('refs/heads/main');
  const excludesMain = Array.isArray(conditions?.exclude) && conditions.exclude.includes('refs/heads/main');
  const appliesToMain = ruleset?.target === 'branch' && includesMain && !excludesMain;
  const active = ruleset?.enforcement === 'active' && appliesToMain;
  const statusRule = rules.find((rule) => rule?.type === 'required_status_checks');
  const statusParameters = statusRule?.parameters ?? {};
  const requiredStatusChecks = Array.isArray(statusParameters.required_status_checks)
    ? statusParameters.required_status_checks
    : [];
  const requiredContexts = requiredStatusChecks
    .map((item) => item?.context)
    .filter((name) => typeof name === 'string' && name.length > 0);
  const pullRequestRule = rules.find((rule) => rule?.type === 'pull_request');
  const pullRequestParameters = pullRequestRule?.parameters ?? {};
  const reviewCount = Number.isInteger(pullRequestParameters.required_approving_review_count)
    ? pullRequestParameters.required_approving_review_count
    : 0;
  const bypassActors = Array.isArray(ruleset?.bypass_actors) ? ruleset.bypass_actors : null;

  const checks = {
    protectionSource: 'repository_ruleset',
    rulesetId: ruleset?.id ?? null,
    rulesetName: typeof ruleset?.name === 'string' ? ruleset.name : null,
    rulesetEnforcement: ruleset?.enforcement ?? null,
    rulesetActiveForMain: active,
    currentUserCanBypass: ruleset?.current_user_can_bypass ?? null,
    requiredStatusCheckContexts: requiredContexts,
    requiredStatusChecksEnabled: active && requiredContexts.length > 0,
    sourceGuardRequired: requiredContexts.some(
      (name) => name === 'source-guard' || name.endsWith('/source-guard')
    ),
    releaseEvidenceRequired: requiredContexts.includes('Build, validate, and smoke-test'),
    strictStatusChecksEnabled: active && statusParameters.strict_required_status_checks_policy === true,
    pullRequestReviewRequired: active && reviewCount >= 1,
    staleReviewsDismissed: active && pullRequestParameters.dismiss_stale_reviews_on_push === true,
    conversationResolutionRequired: active && pullRequestParameters.required_review_thread_resolution === true,
    linearHistoryRequired: active && rules.some((rule) => rule?.type === 'required_linear_history'),
    adminEnforcementEnabled: active && Array.isArray(bypassActors) && bypassActors.length === 0,
    forcePushDisabled: active && rules.some((rule) => rule?.type === 'non_fast_forward'),
    branchDeletionDisabled: active && rules.some((rule) => rule?.type === 'deletion'),
    directUpdatesRestricted: active && rules.some((rule) => rule?.type === 'update'),
    requiredApprovingReviewCount: reviewCount
  };
  return { passed: requiredPolicyChecks(checks), checks };
}

export function evaluateMainBranchProtection(protection) {
  if (Array.isArray(protection?.rules) && protection?.conditions?.ref_name) {
    return evaluateRepositoryRuleset(protection);
  }
  return evaluateClassicProtection(protection);
}


/**
 * Derive active protection only from an observed protection object.
 * A successful ruleset-list request alone is not proof a ruleset applies to main.
 */
export function protectionActiveFromEvidence(checks, httpStatus, verificationEndpoint) {
  if (verificationEndpoint === 'repository_rulesets' || verificationEndpoint === 'repository_ruleset') {
    return checks?.rulesetActiveForMain === true;
  }
  if (verificationEndpoint === 'classic_branch_protection') {
    return httpStatus === 200 && checks?.protectionSource === 'classic_branch_protection';
  }
  return false;
}
