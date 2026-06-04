export const N04_SUCCESS_LEARNING_POLICY = {
  productionReady: false,
  outcomeRequiresProof: true,
  successStoryRequiresProofAndConsent: true,
  aiMaySuggestNotGovern: true,
  noGuaranteeLanguageRequired: true,
  candidateNotExperiment: true,
  harmSignalRequiresFounderReview: true,
  confusionSignalRequiresReview: true
} as const;

export function assertN04SuccessLearningPolicySafe() {
  if (N04_SUCCESS_LEARNING_POLICY.productionReady !== false) {
    throw new Error("N04 success learning policy cannot claim productionReady=true");
  }

  return true;
}