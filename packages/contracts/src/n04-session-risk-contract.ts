export type N04SessionRiskLevel = "low" | "medium" | "high" | "blocked";

export type N04SessionRisk = {
  sessionId: string;
  candidateId: string;
  riskLevel: N04SessionRiskLevel;
  deviceTrustLevel: "unknown" | "trusted" | "suspicious" | "blocked";
  requiresReview: boolean;
  browserAccess: "own_data_only";
  serviceRoleVisibleToBrowser: false;
  auditId: string;
  createdAt: string;
  productionReady: false;
};