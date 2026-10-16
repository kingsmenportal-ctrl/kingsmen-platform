import { createHash } from "node:crypto";

/** Stable payload fingerprint; keys reused for different payloads must be rejected. */
export function payloadFingerprint(payload: unknown): string {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

/**
 * Decide whether a previously stored idempotency key is a safe replay.
 * Callers must compare this against a fingerprint stored durably with the result.
 */
export function assertIdempotencyReplayMatches(
  storedFingerprint: string,
  incomingPayload: unknown
): void {
  if (!/^[a-f0-9]{64}$/i.test(storedFingerprint)) {
    throw new Error("IDEMPOTENCY_RECORD_INVALID");
  }
  const incoming = payloadFingerprint(incomingPayload);
  const storedBytes = Buffer.from(storedFingerprint.toLowerCase(), "hex");
  const incomingBytes = Buffer.from(incoming, "hex");
  if (storedBytes.length !== incomingBytes.length || !storedBytes.equals(incomingBytes)) {
    throw new Error("IDEMPOTENCY_KEY_PAYLOAD_MISMATCH");
  }
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
}
