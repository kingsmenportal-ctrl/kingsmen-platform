export const N04_RLS_SECURITY_POLICY = {
  productionReady: false,
  candidateOwnDataRlsRequired: true,
  serviceRoleBackendOnly: true,
  browserCannotAccessOtherCandidateData: true,
  publicAccessAllowed: false,
  suspiciousSessionRequiresReview: true,
  popiaAccessLogRequired: true
} as const;

export function assertN04RlsSecurityPolicySafe() {
  if (N04_RLS_SECURITY_POLICY.productionReady !== false) {
    throw new Error("N04 RLS security policy cannot claim productionReady=true");
  }

  if (N04_RLS_SECURITY_POLICY.publicAccessAllowed !== false) {
    throw new Error("N04 public candidate data access must be false");
  }

  return true;
}