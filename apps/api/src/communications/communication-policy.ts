import type { CommunicationChannel, CommunicationUrgency, NotificationDraft } from "./communication-types";

export const COMMUNICATION_DOCTRINE = {
  EMAIL_PRIMARY: "Email is the enabled external candidate notification channel.",
  WHATSAPP_DISABLED: "WhatsApp notifications are disabled until separately approved and released.",
  SMS_DISABLED: "SMS notifications are disabled until separately approved and released.",
  PORTAL_INBOX: "Candidate portal carries visible status, messages and required actions.",
  NO_BULK_WHATSAPP: "WhatsApp is disabled; no bulk or urgent WhatsApp messages are permitted.",
  EVIDENCE_REQUIRED: "Every message must have evidence.",
  NO_STATE_MUTATION: "Notifications may inform but must not silently change application state."
} as const;

export interface CommunicationPolicyDecision {
  allowed: boolean;
  requiresHumanReview: boolean;
  reason: string;
}

export function isUrgent(urgency: CommunicationUrgency): boolean {
  return urgency === "URGENT" || urgency === "EMERGENCY";
}

export function assertValidChannelUse(draft: NotificationDraft): CommunicationPolicyDecision {
  if (draft.channel === "EMAIL_PRIMARY") {
    return { allowed: true, requiresHumanReview: false, reason: COMMUNICATION_DOCTRINE.EMAIL_PRIMARY };
  }

  if (draft.channel === "PORTAL_INBOX") {
    return { allowed: true, requiresHumanReview: false, reason: COMMUNICATION_DOCTRINE.PORTAL_INBOX };
  }

  if (draft.channel === "WHATSAPP_URGENT_ONLY") {
    return {
      allowed: false,
      requiresHumanReview: true,
      reason: "WHATSAPP_DISABLED: WhatsApp is not an enabled candidate communication channel."
    };
  }

  if (draft.channel === "SMS_BACKUP_ONLY") {
    return {
      allowed: false,
      requiresHumanReview: true,
      reason: "SMS_DISABLED: SMS is not an enabled candidate communication channel."
    };
  }

  return { allowed: false, requiresHumanReview: true, reason: `Unknown channel ${(draft.channel as CommunicationChannel)}` };
}

export function assertEvidenceReady(draft: NotificationDraft): void {
  if (!draft.evidenceRef) throw new Error("MESSAGE_EVIDENCE_LEDGER_REQUIRED: notification cannot leave without evidence_ref.");
}

export function assertNotificationDoesNotMutateState(payload: Record<string, unknown>): void {
  const forbidden = ["nextState", "finalDecision", "refundDecision", "fraudDecision", "officialSubmission"];
  for (const key of forbidden) {
    if (key in payload) {
      throw new Error(`COMMUNICATION_NO_STATE_MUTATION: ${key} belongs to backend policy/state boundary, not notification runtime.`);
    }
  }
}

export function chooseDefaultChannel(input: { urgent?: boolean; email?: string; portalOnly?: boolean }): CommunicationChannel {
  if (input.portalOnly) return "PORTAL_INBOX";
  if (input.urgent) return "EMAIL_PRIMARY";
  if (input.email) return "EMAIL_PRIMARY";
  return "PORTAL_INBOX";
}