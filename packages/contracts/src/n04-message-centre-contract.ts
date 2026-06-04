export type N04MessageChannel = "email" | "portal" | "whatsapp" | "sms";

export type N04CandidateMessage = {
  messageId: string;
  candidateId: string;
  channel: N04MessageChannel;
  direction: "inbound" | "outbound";
  purpose: "routine" | "urgent" | "backup" | "ceremonial" | "support" | "evidence_request";
  subject: string;
  safeSummary: string;
  evidenceId: string;
  createdAt: string;
  productionReady: false;
};