export function calculateN06ReadinessScore(input: {
  documentReady: boolean;
  sourceVerified: boolean;
  paymentReady: boolean;
  deadlineRisk: boolean;
  fitScore?: number;
  riskScore?: number;
}) {
  let score = 0;
  const blockers: string[] = [];

  if (input.documentReady) score += 25;
  else blockers.push("needs_documents");

  if (input.sourceVerified) score += 30;
  else blockers.push("needs_source_verification");

  if (input.paymentReady) score += 15;
  else blockers.push("needs_payment_or_fee_review");

  if (!input.deadlineRisk) score += 10;
  else blockers.push("deadline_risk");

  score += Math.max(0, Math.min(20, input.fitScore ?? 0));
  score -= Math.max(0, Math.min(20, input.riskScore ?? 0));

  const readinessScore = Math.max(0, Math.min(100, score));

  return {
    readinessScore,
    blockers,
    safeToProceed: readinessScore >= 70 && blockers.length === 0,
    noGuaranteeLanguageRequired: true,
    productionReady: false
  } as const;
}