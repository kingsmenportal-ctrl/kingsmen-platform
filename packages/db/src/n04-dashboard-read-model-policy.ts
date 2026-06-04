export const N04_DASHBOARD_READ_MODEL_POLICY = {
  productionReady: false,
  candidateSafeReadModelOnly: true,
  allSixGatesVisibleToAllUsers: true,
  packageControlsIntensityNotGateAccess: true,
  serviceRoleNeverInBrowser: true,
  noTruthAuthorityActionsInBrowser: true
} as const;

export function assertN04DashboardReadModelPolicySafe() {
  if (N04_DASHBOARD_READ_MODEL_POLICY.productionReady !== false) {
    throw new Error("N04 dashboard read model cannot claim productionReady=true");
  }

  return true;
}