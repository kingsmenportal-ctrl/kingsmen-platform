export type N08CommandRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type N08CommandExecutionRequest = {
  commandId: string;
  commandName: string;
  riskLevel: N08CommandRiskLevel;
  requestedBy: "founder" | "operator" | "system" | "worker";
  requiresFounderApproval: boolean;
  approvalId?: string;
  evidenceId: string;
  auditId: string;
  dryRunAvailable: boolean;
  rollbackAvailable: boolean;
  productionReady: false;
};

export type N08CommandExecutionResult = {
  commandId: string;
  executed: boolean;
  blocked: boolean;
  reason: string;
  evidenceId: string;
  auditId: string;
  productionReady: false;
};