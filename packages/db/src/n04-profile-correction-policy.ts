export const N04_PROFILE_CORRECTION_POLICY = {
  productionReady: false,
  sensitiveChangeReviewRequired: true,
  auditRequiredForCorrection: true,
  popiaLogRequiredForCorrection: true,
  oldValuePreserved: true,
  silentOverwriteBlocked: true,
  candidateCannotBypassTruthAuthority: true,
  candidateCannotChangePaymentSubmissionOutcomeSource: true
} as const;

export function assertN04ProfileCorrectionPolicySafe() {
  if (N04_PROFILE_CORRECTION_POLICY.productionReady !== false) {
    throw new Error("N04 profile correction policy cannot claim productionReady=true");
  }

  return true;
}