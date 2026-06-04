export function buildN08StopSellingSignal(input: {
  activeCandidates: number;
  activeCandidateCap: number;
  queueUnsafe: boolean;
  providerUnsafe: boolean;
  candidateHarmRisk: boolean;
}) {
  const stopSellingRecommended =
    input.activeCandidates >= input.activeCandidateCap ||
    input.queueUnsafe ||
    input.providerUnsafe ||
    input.candidateHarmRisk;

  return {
    activeCandidates: input.activeCandidates,
    activeCandidateCap: input.activeCandidateCap,
    queueUnsafe: input.queueUnsafe,
    providerUnsafe: input.providerUnsafe,
    candidateHarmRisk: input.candidateHarmRisk,
    stopSellingRecommended,
    founderApprovalRequired: stopSellingRecommended,
    capLimitsVolumeNotCapability: true,
    productionReady: false
  } as const;
}