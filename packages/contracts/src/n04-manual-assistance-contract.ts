export type N04ManualAssistanceReason =
  | "captcha_or_otp"
  | "portal_down"
  | "selector_changed"
  | "source_uncertain"
  | "candidate_missing_info"
  | "document_review_needed"
  | "payment_review_needed"
  | "other";

export type N04ManualAssistanceRequest = {
  manualRequestId: string;
  candidateId: string;
  reason: N04ManualAssistanceReason;
  mapFallbackRequired: boolean;
  evidenceId: string;
  auditId: string;
  founderOperatorReviewRequired: true;
  createdAt: string;
  productionReady: false;
};