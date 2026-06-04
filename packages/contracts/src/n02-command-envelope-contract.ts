export type KingsmenCommandRisk = "low" | "medium" | "high" | "critical";

export type KingsmenCommandEnvelope = {
  commandId: string;
  commandType: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
  risk: KingsmenCommandRisk;
  payload: Record<string, unknown>;
  requiresFounderApproval: boolean;
  productionReady: false;
  createdAt: string;
};