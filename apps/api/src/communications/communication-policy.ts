import type { CommunicationChannel, CommunicationUrgency, NotificationDraft } from "./communication-types";

export const COMMUNICATION_DOCTRINE = {
  EMAIL_PRIMARY: "Email is primary.",
  WHATSAPP_URGENT_ONLY: "WhatsApp is urgent-only.",
  SMS_BACKUP_ONLY: "SMS is backup-only.",
  PORTAL_INBOX: "Candidate portal carries visible status and message history.",
  NO_BULK_WHATSAPP: "No bulk WhatsApp reminders.",
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
    if (!isUrgent(draft.urgency)) {
      return {
        allowed: false,
        requiresHumanReview: true,
        reason: "WHATSAPP_URGENT_ONLY blocked because urgency is not URGENT or EMERGENCY. No bulk WhatsApp reminders."
      };
    }
    return {
      allowed: true,
      requiresHumanReview: true,
      reason: "WHATSAPP_URGENT_ONLY allowed only after urgent human-approved escalation."
    };
  }

  if (draft.channel === "SMS_BACKUP_ONLY") {
    if (draft.purpose !== "BACKUP_NOTICE" && !isUrgent(draft.urgency)) {
      return {
        allowed: false,
        requiresHumanReview: true,
        reason: "SMS_BACKUP_ONLY blocked because SMS is backup-only."
      };
    }
    return {
      allowed: true,
      requiresHumanReview: true,
      reason: "SMS_BACKUP_ONLY allowed as backup or urgent fallback."
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