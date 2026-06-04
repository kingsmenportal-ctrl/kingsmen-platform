export const N04_SUPPORT_TRIBUNAL_POLICY = {
  productionReady: false,
  emailFirstSupport: true,
  evidenceRequiredForSupport: true,
  candidateHarmPriorityBuilt: true,
  manualAssistanceRequiresEvidence: true,
  mapFallbackRequiredForPortalBlockers: true,
  tribunalRequiresEvidence: true,
  tribunalRequiresReview: true,
  founderOperatorReviewRequired: true
} as const;

export function assertN04SupportTribunalPolicySafe() {
  if (N04_SUPPORT_TRIBUNAL_POLICY.productionReady !== false) {
    throw new Error("N04 support/tribunal policy cannot claim productionReady=true");
  }

  return true;
}