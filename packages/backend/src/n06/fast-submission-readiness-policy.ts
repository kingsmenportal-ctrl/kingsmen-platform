export function assertN06FastSubmissionReady(input: {
  knownRoute: boolean;
  documentReady: boolean;
  sourceVerified: boolean;
  paymentReady: boolean;
  noOtpCaptchaPortalBlocker: boolean;
  noLegalOrPolicyBlocker: boolean;
}) {
  const blockers: string[] = [];

  if (!input.knownRoute) blockers.push("not_known_route");
  if (!input.documentReady) blockers.push("documents_not_ready");
  if (!input.sourceVerified) blockers.push("source_not_verified");
  if (!input.paymentReady) blockers.push("payment_not_ready");
  if (!input.noOtpCaptchaPortalBlocker) blockers.push("otp_captcha_or_portal_blocker");
  if (!input.noLegalOrPolicyBlocker) blockers.push("legal_or_policy_blocker");

  return {
    readyForFastSubmission: blockers.length === 0,
    blockers,
    targetSessionMinutes: blockers.length === 0 ? "30-60" : "blocked_until_resolved",
    productionReady: false
  } as const;
}