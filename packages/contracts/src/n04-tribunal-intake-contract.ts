export type N04TribunalIssueType =
  | "refund_dispute"
  | "payment_exception"
  | "document_dispute"
  | "application_dispute"
  | "support_escalation"
  | "privacy_or_consent"
  | "partner_sharing_dispute"
  | "candidate_harm";

export type N04TribunalIntake = {
  tribunalId: string;
  candidateId: string;
  issueType: N04TribunalIssueType;
  safeSummary: string;
  evidenceIds: string[];
  auditId: string;
  status: "received" | "review_pending" | "investigating" | "resolved" | "rejected";
  candidateVisible: boolean;
  founderOperatorReviewRequired: true;
  createdAt: string;
  productionReady: false;
};