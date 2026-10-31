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

export function createUrgentWhatsAppEscalation(_input: UrgentWhatsAppEscalationRequest): never {
  throw new Error("WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY");
}

export function buildWhatsAppDraftFromEscalation(
  _input: UrgentWhatsAppEscalationRequest & { recipient: string }
): NotificationDraft {
  throw new Error("WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY");
}
