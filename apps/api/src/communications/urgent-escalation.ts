import type { NotificationDraft } from "./communication-types";

export interface UrgentWhatsAppEscalationRequest {
  candidateRef?: string;
  applicationRef?: string;
  threadRef?: string;
  reason: string;
  approvedByOperatorRef?: string;
  approvalRef?: string;
  evidenceRef?: string;
}

export function createUrgentWhatsAppEscalation(input: UrgentWhatsAppEscalationRequest) {
  if (!input.approvalRef || !input.approvedByOperatorRef) {
    return {
      escalationRef: `wa_urgent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      status: "PENDING_APPROVAL",
      reason: input.reason,
      ...input
    };
  }

  return {
    escalationRef: `wa_urgent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    status: "APPROVED",
    urgency: "URGENT",
    ...input
  };
}

export function buildWhatsAppDraftFromEscalation(input: UrgentWhatsAppEscalationRequest & { recipient: string }): NotificationDraft {
  if (!input.approvalRef || !input.approvedByOperatorRef) {
    throw new Error("WHATSAPP_URGENT_ONLY requires approvalRef and approvedByOperatorRef.");
  }
  return {
    candidateRef: input.candidateRef,
    applicationRef: input.applicationRef,
    threadRef: input.threadRef,
    channel: "WHATSAPP_URGENT_ONLY",
    recipient: input.recipient,
    body: `Urgent Kingsmen update: ${input.reason}. Please check your email/portal for full details.`,
    purpose: "URGENT_ESCALATION",
    urgency: "URGENT",
    idempotencyKey: ["urgent-whatsapp", input.candidateRef ?? "unknown", input.applicationRef ?? "none", input.approvalRef].join(":"),
    evidenceRef: input.evidenceRef
  };
}