export const N04_AUTH_SESSION_POLICY = {
  productionReady: false,
  sessionAuditRequired: true,
  serviceRoleBackendOnly: true,
  anonBrowserOwnDataOnly: true,
  accountRecoveryRequiresPopiaLog: true,
  accountRecoveryAutoApproveBlocked: true,
  candidateCannotBypassTruthAuthority: true
} as const;

export function assertN04AuthSessionPolicySafe() {
  if (N04_AUTH_SESSION_POLICY.productionReady !== false) {
    throw new Error("N04 auth/session policy cannot claim productionReady=true");
  }

  return true;
}