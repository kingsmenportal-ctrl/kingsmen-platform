export interface PortalMessageInput {
  candidateRef: string;
  threadRef?: string;
  title: string;
  body: string;
  messageType?: "STATUS_UPDATE" | "DOCUMENT_REQUEST" | "PAYMENT_NOTICE" | "MAP_READY" | "SUPPORT_REPLY" | "SUCCESS_OUTCOME";
  evidenceRef?: string;
}

export function createPortalMessage(input: PortalMessageInput) {
  if (!input.evidenceRef) throw new Error("PORTAL_MESSAGE_EVIDENCE_REQUIRED");
  return {
    portalMessageRef: `portal_msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    visibleToCandidate: true,
    createdAt: new Date().toISOString(),
    messageType: input.messageType ?? "STATUS_UPDATE",
    ...input
  };
}

export function summarizePortalInbox(messages: Array<{ readAt?: string | null; messageType: string }>) {
  return {
    total: messages.length,
    unread: messages.filter((message) => !message.readAt).length,
    byType: messages.reduce<Record<string, number>>((acc, message) => {
      acc[message.messageType] = (acc[message.messageType] ?? 0) + 1;
      return acc;
    }, {})
  };
}