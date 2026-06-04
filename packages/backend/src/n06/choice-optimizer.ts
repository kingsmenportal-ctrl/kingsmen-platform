import { calculateN06ReadinessScore } from "./readiness-scoring-policy";

export function optimizeN06RouteChoice(input: {
  candidateId: string;
  routeId: string;
  gate: string;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  documentReady: boolean;
  paymentReady: boolean;
  deadlineRisk: boolean;
  fitScore?: number;
  riskScore?: number;
  candidatePreferenceRank?: number;
}) {
  const sourceVerified = input.sourceConfidence === "high" || input.sourceConfidence === "official_verified";
  const readiness = calculateN06ReadinessScore({
    documentReady: input.documentReady,
    sourceVerified,
    paymentReady: input.paymentReady,
    deadlineRisk: input.deadlineRisk,
    fitScore: input.fitScore,
    riskScore: input.riskScore
  });

  return {
    candidateId: input.candidateId,
    routeId: input.routeId,
    gate: input.gate,
    recommendedRank: input.candidatePreferenceRank ?? 999,
    readinessScore: readiness.readinessScore,
    safeToProceed: readiness.safeToProceed,
    blockers: readiness.blockers,
    noGuaranteeLanguageRequired: true,
    productionReady: false
  } as const;
}