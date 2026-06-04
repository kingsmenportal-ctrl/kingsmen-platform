export const N04_CANDIDATE_CORE_POLICY = {
  productionReady: false,
  allSixGatesVisibleToAllUsers: true,
  packageControlsIntensityNotGateAccess: true,
  knownRouteFastLaneSupported: true,
  candidateCannotSelfVerifyPaidSubmittedOutcome: true,
  popiaSafeCandidateBoundary: true
} as const;

export function assertN04CandidateCorePolicySafe() {
  if (N04_CANDIDATE_CORE_POLICY.productionReady !== false) {
    throw new Error("N04 candidate core cannot claim productionReady=true");
  }

  return true;
}