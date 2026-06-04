const seen = new Map<string, { commandId: string; firstSeenAt: string }>();

export function assertIdempotentCommand(input: { commandId: string; idempotencyKey: string }) {
  if (!input.idempotencyKey || input.idempotencyKey.trim().length < 8) {
    throw new Error("idempotencyKey is required and must be stable");
  }

  const existing = seen.get(input.idempotencyKey);
  if (existing && existing.commandId !== input.commandId) {
    return {
      duplicate: true,
      firstCommandId: existing.commandId,
      idempotencyKey: input.idempotencyKey
    };
  }

  if (!existing) {
    seen.set(input.idempotencyKey, {
      commandId: input.commandId,
      firstSeenAt: new Date().toISOString()
    });
  }

  return {
    duplicate: false,
    commandId: input.commandId,
    idempotencyKey: input.idempotencyKey
  };
}