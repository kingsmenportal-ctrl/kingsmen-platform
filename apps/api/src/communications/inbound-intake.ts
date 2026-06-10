import type { CommunicationChannel, InboundMessage } from "./communication-types";

export function detectInboundUrgency(body: string): InboundMessage["urgency"] {
  const text = body.toLowerCase();
  if (text.includes("otp") || text.includes("deadline") || text.includes("payment") || text.includes("locked") || text.includes("urgent")) return "URGENT";
  return "NORMAL";
}

export function detectInboundIntent(body: string): string {
  const text = body.toLowerCase();
  if (text.includes("document")) return "DOCUMENT_QUERY";
  if (text.includes("payment") || text.includes("refund")) return "FINANCE_QUERY";
  if (text.includes("status")) return "STATUS_QUERY";
  if (text.includes("otp") || text.includes("captcha")) return "PORTAL_ACCESS_BLOCKER";
  return "GENERAL_SUPPORT";
}

export function normalizeInboundMessage(input: {
  channel: CommunicationChannel;
  sender: string;
  body: string;
  subject?: string;
  candidateRef?: string;
  threadRef?: string;
  evidenceRef?: string;
}): InboundMessage {
  const urgency = detectInboundUrgency(input.body);
  const intent = detectInboundIntent(input.body);
  return {
    inboundRef: `inbound_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    channel: input.channel,
    sender: input.sender,
    subject: input.subject,
    body: input.body,
    candidateRef: input.candidateRef,
    threadRef: input.threadRef,
    evidenceRef: input.evidenceRef,
    urgency,
    detectedIntent: intent,
    needsHumanReview: urgency === "URGENT" || intent === "FINANCE_QUERY" || intent === "PORTAL_ACCESS_BLOCKER"
  };
}