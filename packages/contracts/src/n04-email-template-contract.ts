export type N04EmailTemplateCode =
  | "welcome"
  | "intake_started"
  | "document_request"
  | "payment_pending"
  | "application_ready"
  | "map_manual_handoff"
  | "status_update"
  | "support_reply"
  | "outcome_update";

export type N04EmailTemplate = {
  templateCode: N04EmailTemplateCode;
  subject: string;
  bodySafeMarkdown: string;
  trackedLinkAllowed: true;
  noGuaranteeDisclaimerRequired: true;
  evidenceRequired: true;
  productionReady: false;
};