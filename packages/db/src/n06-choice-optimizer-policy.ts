export const N06_CHOICE_OPTIMIZER_POLICY = {
  productionReady: false,
  readinessScoringBuilt: true,
  choiceOptimizerBuilt: true,
  caoChoiceOptimizerBuilt: true,
  knownRouteFastSubmissionReadinessBuilt: true,
  sourceConfidenceSafetyBuilt: true,
  feeDeadlinePaymentInstructionGateBuilt: true,
  noGuaranteeBoundaryBuilt: true,
  candidateDocumentReadinessConnected: true
} as const;

export function assertN06ChoiceOptimizerPolicySafe() {
  if (N06_CHOICE_OPTIMIZER_POLICY.productionReady !== false) {
    throw new Error("N06 choice optimizer policy cannot claim productionReady=true");
  }

  return true;
}