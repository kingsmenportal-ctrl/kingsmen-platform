export const N03_CAO_SIX_GATE_POLICY = {
  productionReady: false,
  caoIsOneParentApplication: true,
  caoProgrammeChoicesAreChildren: true,
  packageCountsParentApplicationsNotCaoChoices: true,
  allSixGatesVisibleToAllUsers: true,
  packageControlsIntensityNotGateAccess: true,
  capLimitsVolumeNotCapability: true,
  activeCandidateStartingCap: 500
} as const;

export function assertN03CaoSixGatePolicySafe() {
  if (N03_CAO_SIX_GATE_POLICY.productionReady !== false) {
    throw new Error("N03 CAO/six-gate policy cannot claim productionReady=true");
  }

  if (N03_CAO_SIX_GATE_POLICY.activeCandidateStartingCap !== 500) {
    throw new Error("Starting cap must remain 500");
  }

  return true;
}