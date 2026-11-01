export function evaluateMainBranchProtection(protection) {
  const requiredStatusChecks = protection?.required_status_checks ?? null;
  const requiredContexts = Array.isArray(requiredStatusChecks?.contexts)
    ? requiredStatusChecks.contexts
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
    requiredStatusChecksEnabled: allRequiredCheckNames.length > 0,
    sourceGuardRequired: allRequiredCheckNames.some(
      (name) => name === 'source-guard' || name.endsWith('/source-guard')
    ),
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

  const requiredBooleanChecks = [
    'requiredStatusChecksEnabled',
    'sourceGuardRequired',
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
