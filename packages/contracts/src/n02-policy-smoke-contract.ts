export type KingsmenPolicySmokeResult = {
  schema: "kingsmen.n02-policy-smoke.v1";
  passed: boolean;
  productionReady: false;
  blocksLivePaymentsWithoutProof: boolean;
  blocksLiveEmailWithoutProof: boolean;
  blocksOfficialSubmissionsWithoutProof: boolean;
  blocksProductionClaimWithoutProof: boolean;
  blocksRawShell: boolean;
  requiresFounderApprovalForHighRisk: boolean;
  failures: string[];
  checkedAt: string;
};