export type N06ChoiceOptimizerInput = {
  candidateId: string;
  routeId: string;
  gate: string;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  documentReady: boolean;
  paymentReady: boolean;
  deadlineRisk: boolean;
  candidatePreferenceRank?: number;
  fitScore?: number;
  riskScore?: number;
};

export type N06ChoiceOptimizerDecision = {
  candidateId: string;
  routeId: string;
  recommendedRank: number;
  readinessScore: number;
  safeToProceed: boolean;
  blockers: string[];
  noGuaranteeLanguageRequired: true;
  productionReady: false;
};