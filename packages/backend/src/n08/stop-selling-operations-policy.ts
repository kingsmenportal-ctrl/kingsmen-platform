export function buildN08StopSellingOperation(input: {
  operationId: string;
  activeCandidates: number;
  activeCandidateCap: number;
  queueUnsafe: boolean;
  providerUnsafe: boolean;
  candidateHarmRisk: boolean;
  evidenceId: string;
  auditId: string;
}) {
  if (!input.operationId || !input.evidenceId || !input.auditId) {
    throw new Error("N08 stop-selling operation requires operationId, evidenceId, and auditId");
  }

  const stopSellingRecommended =
    input.activeCandidates >= input.activeCandidateCap ||
    input.queueUnsafe ||
    input.providerUnsafe ||
    input.candidateHarmRisk;

  return {
    operationId: input.operationId,
    activeCandidates: input.activeCandidates,
    activeCandidateCap: input.activeCandidateCap,
    queueUnsafe: input.queueUnsafe,
    providerUnsafe: input.providerUnsafe,
    candidateHarmRisk: input.candidateHarmRisk,
    stopSellingRecommended,
    founderApprovalRequired: stopSellingRecommended,
    capLimitsVolumeNotCapability: true,
    gatesRemainVisibleAndAssessable: true,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    productionReady: false
  } as const;
}