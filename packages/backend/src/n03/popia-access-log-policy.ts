export function buildN03PopiaAccessLog(input: {
  accessLogId: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  candidateId?: string;
  entityType: string;
  entityId: string;
  purpose: string;
  reason: string;
}) {
  if (!input.accessLogId || !input.actorId || !input.entityType || !input.entityId || !input.purpose || !input.reason) {
    throw new Error("POPIA access log requires accessLogId, actorId, entity, purpose, and reason");
  }

  return {
    ...input,
    appendOnly: true,
    createdAt: new Date().toISOString()
  } as const;
}