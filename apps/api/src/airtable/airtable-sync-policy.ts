import type { AirtableMirrorPayload, AirtableSyncTarget, AirtableWebhookReceipt } from "./airtable-types";

export interface AirtableSyncPolicyDecision {
  allowed: boolean;
  reason: string;
  requiresOperatorReview: boolean;
  backendStateAuthoritative: true;
}

export function evaluateOutboundMirrorPolicy(
  target: AirtableSyncTarget,
  payload: AirtableMirrorPayload
): AirtableSyncPolicyDecision {
  if (target.backendStateAuthoritative !== true) {
    return {
      allowed: false,
      reason: "Backend state must remain authoritative for every Airtable sync target.",
      requiresOperatorReview: true,
      backendStateAuthoritative: true
    };
  }

  if (!payload.idempotencyKey || payload.idempotencyKey.trim().length < 12) {
    return {
      allowed: false,
      reason: "Airtable mirror payload requires a stable idempotency key.",
      requiresOperatorReview: true,
      backendStateAuthoritative: true
    };
  }

  if (payload.baseKey !== target.baseKey || payload.tableKey !== target.tableKey) {
    return {
      allowed: false,
      reason: "Payload target does not match sync target.",
      requiresOperatorReview: true,
      backendStateAuthoritative: true
    };
  }

  return {
    allowed: true,
    reason: "Mirror write allowed. PostgreSQL remains the truth source.",
    requiresOperatorReview: target.inboundRequiresOperatorReview,
    backendStateAuthoritative: true
  };
}

export function evaluateInboundWebhookPolicy(
  target: AirtableSyncTarget,
  receipt: AirtableWebhookReceipt
): AirtableSyncPolicyDecision {
  if (target.direction === "POSTGRES_TO_AIRTABLE") {
    return {
      allowed: false,
      reason: "Inbound Airtable edits are blocked for one-way Postgres-to-Airtable mirrors.",
      requiresOperatorReview: true,
      backendStateAuthoritative: true
    };
  }

  if (receipt.requiresOperatorReview !== true) {
    return {
      allowed: false,
      reason: "Inbound Airtable changes require operator review.",
      requiresOperatorReview: true,
      backendStateAuthoritative: true
    };
  }

  return {
    allowed: true,
    reason: "Inbound Airtable event accepted into review queue only; it cannot override backend state directly.",
    requiresOperatorReview: true,
    backendStateAuthoritative: true
  };
}