function evaluateClassicProtection(protection) {
  const requiredStatusChecks = protection?.required_status_checks ?? null;
  const requiredContexts = Array.isArray(requiredStatusChecks?.contexts)
    ? requiredStatusChecks.contexts.filter((name) => typeof name === 'string' && name.length > 0)
    : [];
  const requiredCheckObjects = Array.isArray(requiredStatusChecks?.checks) ? requiredStatusChecks.checks : [];
  const requiredCheckNames = requiredCheckObjects.map((item) => item?.context)
    .filter((name) => typeof name === 'string' && name.length > 0);
  const allRequiredCheckNames = [...new Set([...requiredContexts, ...requiredCheckNames])];
  const reviewPolicy = protection?.required_pull_request_reviews ?? null;
  const reviewCount = Number.isInteger(reviewPolicy?.required_approving_review_count)
    ? reviewPolicy.required_approving_review_count
    : 0;
  const checks = {
    activeProtectionPresent: true,
    activeRulesPresent: true,
    activeRulesetPresent: false,
    requiredStatusChecksEnabled: allRequiredCheckNames.length > 0,
    sourceGuardRequired: allRequiredCheckNames.some((name) => name === 'source-guard' || name.endsWith('/source-guard')),
    releaseEvidenceRequired: allRequiredCheckNames.includes('Build, validate, and smoke-test'),
    strictStatusChecksEnabled: requiredStatusChecks?.strict === true,
    pullRequestReviewRequired: reviewCount >= 1,
    staleReviewsDismissed: reviewPolicy?.dismiss_stale_reviews === true,
    conversationResolutionRequired: protection?.required_conversation_resolution?.enabled === true,
    linearHistoryRequired: protection?.required_linear_history?.enabled === true,
    adminEnforcementEnabled: protection?.enforce_admins?.enabled === true,
    forcePushDisabled: protection?.allow_force_pushes?.enabled === false,
    branchDeletionDisabled: protection?.allow_deletions?.enabled === false,
    requiredApprovingReviewCount: reviewCount,
    activeRuleCount: 0,
    matchingRulesetCount: 0,
    unrestrictedBypassActorCount: 0,
    requiredDeploymentEnvironments: []
  };
  return finalize(checks);
}

function finalize(checks) {
  const requiredBooleanChecks = [
    'activeProtectionPresent',
    'activeRulesPresent',
    'activeRulesetPresent',
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
  const passed = requiredBooleanChecks.every((name) => checks[name] === true);
  return { passed, checks };
}

/**
 * Evaluate the effective rules returned by GET /repos/{owner}/{repo}/rules/branches/{branch}
 * together with GET /repos/{owner}/{repo}/rulesets?includes_parents=true.
 * The rules endpoint is authoritative for which active rules affect the named branch;
 * the ruleset list supplies the bypass configuration that the branch rules response omits.
 */
function evaluateRulesetProtection(branchRules, rulesets) {
  const rules = Array.isArray(branchRules) ? branchRules : [];
  const ids = new Set(rules.map((rule) => rule?.ruleset_id).filter((id) => Number.isInteger(id)));
  const applicableRulesets = (Array.isArray(rulesets) ? rulesets : []).filter((set) =>
    set?.enforcement === 'active' && ids.has(set.id)
  );
  const rule = (type) => rules.find((item) => item?.type === type);
  const statusRule = rule('required_status_checks');
  const statusParameters = statusRule?.parameters ?? {};
  const checkEntries = Array.isArray(statusParameters.required_status_checks)
    ? statusParameters.required_status_checks
    : [];
  const checkNames = checkEntries.map((item) => item?.context)
    .filter((name) => typeof name === 'string' && name.length > 0);
  const pullRequestParameters = rule('pull_request')?.parameters ?? {};
  const reviewCount = Number.isInteger(pullRequestParameters.required_approving_review_count)
    ? pullRequestParameters.required_approving_review_count
    : 0;
  const deploymentEnvironments = rule('required_deployments')?.parameters?.required_deployment_environments;
  const requiredDeploymentEnvironments = Array.isArray(deploymentEnvironments)
    ? deploymentEnvironments.filter((value) => typeof value === 'string')
    : [];
  const bypassActorsVisible = applicableRulesets.length > 0 &&
    applicableRulesets.every((set) => Array.isArray(set.bypass_actors));
  const unrestrictedBypassActorCount = bypassActorsVisible
    ? applicableRulesets.reduce((count, set) =>
        count + set.bypass_actors.filter((actor) => actor?.bypass_mode === 'always').length, 0)
    : null;
  const checks = {
    activeProtectionPresent: rules.length > 0 && applicableRulesets.length > 0,
    activeRulesPresent: rules.length > 0,
    activeRulesetPresent: applicableRulesets.length > 0,
    requiredStatusChecksEnabled: checkNames.length > 0,
    sourceGuardRequired: checkNames.some((name) => name === 'source-guard' || name.endsWith('/source-guard')),
    releaseEvidenceRequired: checkNames.includes('Build, validate, and smoke-test'),
    strictStatusChecksEnabled: statusParameters.strict_required_status_checks_policy === true,
    pullRequestReviewRequired: reviewCount >= 1,
    staleReviewsDismissed: pullRequestParameters.dismiss_stale_reviews_on_push === true,
    conversationResolutionRequired: pullRequestParameters.required_review_thread_resolution === true,
    linearHistoryRequired: Boolean(rule('required_linear_history')),
    bypassActorsVisible,
    adminEnforcementEnabled: bypassActorsVisible && unrestrictedBypassActorCount === 0,
    forcePushDisabled: Boolean(rule('non_fast_forward')),
    branchDeletionDisabled: Boolean(rule('deletion')),
    requiredApprovingReviewCount: reviewCount,
    activeRuleCount: rules.length,
    matchingRulesetCount: applicableRulesets.length,
    unrestrictedBypassActorCount,
    requiredDeploymentEnvironments
  };
  return finalize(checks);
}

export function evaluateMainBranchProtection(protection, rulesets = []) {
  if (Array.isArray(protection)) return evaluateRulesetProtection(protection, rulesets);
  if (protection && typeof protection === 'object') return evaluateClassicProtection(protection);
  return finalize({
    activeProtectionPresent: false,
    activeRulesPresent: false,
    activeRulesetPresent: false,
    requiredStatusChecksEnabled: false,
    sourceGuardRequired: false,
    releaseEvidenceRequired: false,
    strictStatusChecksEnabled: false,
    pullRequestReviewRequired: false,
    staleReviewsDismissed: false,
    conversationResolutionRequired: false,
    linearHistoryRequired: false,
    adminEnforcementEnabled: false,
    forcePushDisabled: false,
    branchDeletionDisabled: false,
    requiredApprovingReviewCount: 0,
    activeRuleCount: 0,
    matchingRulesetCount: 0,
    unrestrictedBypassActorCount: 0,
    requiredDeploymentEnvironments: []
  });
}
