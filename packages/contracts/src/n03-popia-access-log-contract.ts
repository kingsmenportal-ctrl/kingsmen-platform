export type N03PopiaAccessPurpose =
  | "candidate_self_view"
  | "founder_review"
  | "operator_support"
  | "document_review"
  | "payment_review"
  | "partner_consent_review"
  | "security_audit"
  | "data_subject_request";

export type N03PopiaAccessLog = {
  accessLogId: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  candidateId?: string;
  entityType: string;
  entityId: string;
  purpose: N03PopiaAccessPurpose;
  reason: string;
  appendOnly: true;
  createdAt: string;
};