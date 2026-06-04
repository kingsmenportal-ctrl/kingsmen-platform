export const N03_STATUS_TRANSITION_POLICY = {
  productionReady: false,
  paymentRequiresWebhookOrManualFinanceProof: true,
  returnUrlCannotMarkPaid: true,
  applicationSubmittedRequiresProof: true,
  outcomeVerifiedRequiresProof: true,
  successStoryRequiresProofConsent: true,
  partnerSharingRequiresConsent: true,
  sourceConfidenceCandidateBlocked: true,
  auditRequiredForStatusTransition: true
} as const;

export function assertN03StatusTransitionPolicySafe() {
  if (N03_STATUS_TRANSITION_POLICY.productionReady !== false) {
    throw new Error("N03 status transition policy cannot claim productionReady=true");
  }
  return true;
}