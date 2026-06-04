export function buildAuditContext(input: {
  auditId: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  correlationId: string;
  commandId: string;
  reason: string;
  risk: "low" | "medium" | "high" | "critical";
}) {
  if (!input.auditId || !input.actorId || !input.correlationId || !input.commandId || !input.reason) {
    throw new Error("audit context requires auditId, actorId, correlationId, commandId, and reason");
  }

  return {
    ...input,
    appendOnly: true,
    createdAt: new Date().toISOString()
  } as const;
}