import type { CommunicationEvidence, NotificationDraft, NotificationStatus } from "./communication-types";
import { assertEvidenceReady, assertNotificationDoesNotMutateState, assertValidChannelUse } from "./communication-policy";

export interface QueuedNotification extends NotificationDraft {
  notificationRef: string;
  status: NotificationStatus;
  createdAt: string;
}

export function createMessageEvidence(input: Omit<CommunicationEvidence, "evidenceRef">): CommunicationEvidence {
  return {
    evidenceRef: `msg_ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    ...input
  };
}

export function queueNotification(
  draft: NotificationDraft,
  payload: Record<string, unknown> = {}
): QueuedNotification {
  assertNotificationDoesNotMutateState(payload);

  const policy = assertValidChannelUse(draft);
  if (!policy.allowed) throw new Error(policy.reason);

  assertEvidenceReady(draft);

  return {
    ...draft,
    notificationRef: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    status: policy.requiresHumanReview ? "HELD_FOR_APPROVAL" : "QUEUED",
    createdAt: new Date().toISOString()
  };
}

export function markDeliveryAttempt(input: {
  notificationRef: string;
  channel: string;
  provider: string;
  providerMessageId?: string;
  ok: boolean;
  responseCode?: string;
  responseBody?: Record<string, unknown>;
  evidenceRef?: string;
}) {
  return {
    attemptRef: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    status: input.ok ? "SENT" : "FAILED",
    attemptedAt: new Date().toISOString(),
    responseBody: input.responseBody ?? {},
    ...input
  };
}

export function lockForSending(notification: QueuedNotification): QueuedNotification {
  if (notification.status !== "QUEUED") {
    throw new Error(`Only QUEUED notifications can be locked for sending. Current status: ${notification.status}`);
  }
  return { ...notification, status: "LOCKED" };
}