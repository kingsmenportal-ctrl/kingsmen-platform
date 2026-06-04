export type KingsmenAuditContext = {
  auditId: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  correlationId: string;
  commandId: string;
  reason: string;
  risk: "low" | "medium" | "high" | "critical";
  appendOnly: true;
  createdAt: string;
};