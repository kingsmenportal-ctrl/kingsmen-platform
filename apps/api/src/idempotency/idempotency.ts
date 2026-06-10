export type IdempotencyStatus = "CLAIMED" | "COMPLETED" | "FAILED" | "EXPIRED";

export interface IdempotencyClaim {
  idempotencyKey: string;
  commandId?: string;
  correlationId: string;
  status: IdempotencyStatus;
  lockedAt: string;
  expiresAt: string;
}

export function createIdempotencyKey(parts: string[]): string {
  const clean = parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(":");

  if (!clean) {
    throw new Error("Cannot create empty idempotency key.");
  }

  return clean.toLowerCase();
}

export function createClaim(input: {
  idempotencyKey: string;
  commandId?: string;
  correlationId: string;
  ttlHours?: number;
}): IdempotencyClaim {
  const now = new Date();
  const expires = new Date(now.getTime() + (input.ttlHours ?? 24) * 60 * 60 * 1000);

  return {
    idempotencyKey: input.idempotencyKey,
    commandId: input.commandId,
    correlationId: input.correlationId,
    status: "CLAIMED",
    lockedAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };
}