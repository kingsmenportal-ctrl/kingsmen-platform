import type { AirtableMirrorPayload } from "./airtable-types";

export interface AirtableOutboxEntry {
  idempotencyKey: string;
  payload: AirtableMirrorPayload;
  status: "PENDING" | "LOCKED" | "COMPLETED" | "FAILED" | "DEAD_LETTER";
  attempts: number;
  nextAttemptAt: string;
}

export function buildAirtableOutboxEntry(payload: AirtableMirrorPayload): AirtableOutboxEntry {
  if (!payload.idempotencyKey || payload.idempotencyKey.trim().length < 12) {
    throw new Error("Airtable outbox entry requires a stable idempotency key.");
  }

  return {
    idempotencyKey: payload.idempotencyKey,
    payload,
    status: "PENDING",
    attempts: 0,
    nextAttemptAt: new Date().toISOString()
  };
}

export function shouldRetryAirtableOutboxEntry(entry: AirtableOutboxEntry, now: Date = new Date()): boolean {
  if (entry.status !== "PENDING" && entry.status !== "FAILED") return false;
  if (entry.attempts >= 5) return false;
  return new Date(entry.nextAttemptAt).getTime() <= now.getTime();
}

export function markAirtableOutboxFailure(entry: AirtableOutboxEntry, error: string): AirtableOutboxEntry {
  const attempts = entry.attempts + 1;
  const delayMs = Math.min(60_000, 750 * Math.pow(2, attempts));
  return {
    ...entry,
    status: attempts >= 5 ? "DEAD_LETTER" : "FAILED",
    attempts,
    nextAttemptAt: new Date(Date.now() + delayMs).toISOString()
  };
}