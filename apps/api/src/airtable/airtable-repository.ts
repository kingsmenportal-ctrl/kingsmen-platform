import type { AirtableMirrorPayload, AirtableSyncTarget } from "./airtable-types";
import { evaluateOutboundMirrorPolicy } from "./airtable-sync-policy";
import { buildAirtableOutboxEntry } from "./airtable-outbox";

export interface AirtableRepositoryWriteResult {
  accepted: boolean;
  reason: string;
  idempotencyKey: string;
}

export function prepareAirtableMirrorWrite(
  target: AirtableSyncTarget,
  payload: AirtableMirrorPayload
): AirtableRepositoryWriteResult {
  const decision = evaluateOutboundMirrorPolicy(target, payload);
  if (!decision.allowed) {
    return {
      accepted: false,
      reason: decision.reason,
      idempotencyKey: payload.idempotencyKey
    };
  }

  buildAirtableOutboxEntry(payload);

  return {
    accepted: true,
    reason: "Accepted into Airtable sync outbox. Mirror worker will push without changing backend state.",
    idempotencyKey: payload.idempotencyKey
  };
}