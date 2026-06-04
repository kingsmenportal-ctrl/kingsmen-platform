export type N08StopSellingOperation = {
  operationId: string;
  activeCandidates: number;
  activeCandidateCap: number;
  queueUnsafe: boolean;
  providerUnsafe: boolean;
  candidateHarmRisk: boolean;
  stopSellingRecommended: boolean;
  founderApprovalRequired: boolean;
  capLimitsVolumeNotCapability: true;
  gatesRemainVisibleAndAssessable: true;
  evidenceId: string;
  auditId: string;
  productionReady: false;
};