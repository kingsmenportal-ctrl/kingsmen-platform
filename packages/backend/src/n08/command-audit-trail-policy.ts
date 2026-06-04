export type N08CommandAuditRecord = {
  auditId: string;
  commandId: string;
  commandName: string;
  actorType: "founder" | "operator" | "system" | "worker";
  approvalId?: string;
  evidenceId: string;
  proofId?: string;
  decision: "requested" | "approved" | "rejected" | "executed" | "blocked" | "rolled_back";
  reason: string;
  createdAt: string;
  productionReady: false;
};

export function buildN08CommandAuditRecord(input: Omit<N08CommandAuditRecord, "createdAt" | "productionReady">) {
  if (!input.auditId || !input.commandId || !input.commandName || !input.evidenceId || !input.reason) {
    throw new Error("N08 command audit requires auditId, commandId, commandName, evidenceId, and reason");
  }

  return {
    ...input,
    createdAt: new Date().toISOString(),
    productionReady: false
  } as const;
}