export type OperatorRole = "founder" | "operator" | "reviewer" | "finance" | "support" | "readonly";
export type CapacityStatus = "NORMAL" | "WATCH" | "THROTTLE" | "STOP";

export interface OperatorProfile {
  operatorRef: string;
  role: OperatorRole;
  allowedCommandScopes: string[];
  canUseDangerousActions: boolean;
}

export interface ControlPlaneCommandDefinition {
  commandKey: string;
  commandScope: string;
  requiresApproval: boolean;
  dangerous: boolean;
  allowedRoles: OperatorRole[];
  isActive: boolean;
}

export interface ControlPlaneCommandRequest {
  commandRef: string;
  commandKey: string;
  requestedByOperatorRef: string;
  status: "REQUESTED" | "APPROVAL_REQUIRED" | "APPROVED" | "REJECTED" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELLED";
  targetType: string;
  targetRef?: string;
  reason: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

export interface ApprovalQueueItem {
  approvalRef: string;
  commandRef?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  decision: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
}

export interface CapacityLimit {
  limitKey: string;
  currentValue: number;
  warnAt: number;
  throttleAt: number;
  stopAt: number;
  status: CapacityStatus;
}

export interface KillSwitch {
  switchKey: string;
  scope: "global" | "worker" | "route" | "portal" | "payment" | "communication" | "playwright" | "airtable";
  enabled: boolean;
  reason?: string;
}

export const CONTROL_PLANE_LAWS = [
  "Control Plane is not the Data Plane",
  "No direct candidate state mutation from UI",
  "Backend command bus only",
  "Dangerous actions require human approval",
  "Every operator action requires audit trail",
  "PostgreSQL remains truth",
  "Airtable remains mirror only",
  "Email primary, WhatsApp urgent-only"
] as const;

export function evaluateOperatorCommandPolicy(
  operator: OperatorProfile,
  command: ControlPlaneCommandDefinition
) {
  if (!command.isActive) return { allowed: false, requiresApproval: true, reason: "Command inactive" };
  if (!command.allowedRoles.includes(operator.role)) return { allowed: false, requiresApproval: true, reason: "Role not allowed" };
  if (!operator.allowedCommandScopes.includes(command.commandScope)) return { allowed: false, requiresApproval: true, reason: "Scope not allowed" };
  if (command.dangerous && !operator.canUseDangerousActions) {
    return { allowed: false, requiresApproval: true, reason: "Dangerous command requires dangerous-action permission" };
  }
  return { allowed: true, requiresApproval: command.requiresApproval, reason: "Accepted into backend command boundary" };
}

export function createControlPlaneCommand(input: {
  operator: OperatorProfile;
  command: ControlPlaneCommandDefinition;
  targetType: string;
  targetRef?: string;
  reason: string;
  payload?: Record<string, unknown>;
}): ControlPlaneCommandRequest {
  const decision = evaluateOperatorCommandPolicy(input.operator, input.command);
  return {
    commandRef: `cp_cmd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    commandKey: input.command.commandKey,
    requestedByOperatorRef: input.operator.operatorRef,
    status: decision.allowed ? (decision.requiresApproval ? "APPROVAL_REQUIRED" : "APPROVED") : "REJECTED",
    targetType: input.targetType,
    targetRef: input.targetRef,
    reason: input.reason,
    payload: input.payload ?? {},
    idempotencyKey: ["control-plane", input.command.commandKey, input.operator.operatorRef, input.targetType, input.targetRef ?? "system"].join(":")
  };
}

export function buildApprovalQueueItem(command: ControlPlaneCommandRequest, summary: string, riskLevel: ApprovalQueueItem["riskLevel"]): ApprovalQueueItem {
  if (command.status !== "APPROVAL_REQUIRED") throw new Error("Only commands in APPROVAL_REQUIRED state can create approval items.");
  return {
    approvalRef: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    commandRef: command.commandRef,
    riskLevel,
    summary,
    decision: "PENDING"
  };
}

export function evaluateCapacityStatus(limit: CapacityLimit): CapacityStatus {
  if (limit.currentValue >= limit.stopAt) return "STOP";
  if (limit.currentValue >= limit.throttleAt) return "THROTTLE";
  if (limit.currentValue >= limit.warnAt) return "WATCH";
  return "NORMAL";
}

export function assertCapacityAllowsWork(limit: CapacityLimit): void {
  if (limit.status === "STOP") throw new Error(`Capacity limit ${limit.limitKey} is STOP. Do not dispatch more work.`);
}

export function isKillSwitchBlocking(switches: readonly KillSwitch[], scope: KillSwitch["scope"]) {
  const global = switches.find((item) => item.switchKey === "global.stop_all_execution" && item.enabled);
  if (global) return { allowed: false, reason: global.reason ?? "Global stop is enabled." };
  const scoped = switches.find((item) => item.scope === scope && item.enabled);
  if (scoped) return { allowed: false, reason: scoped.reason ?? `Kill switch for ${scope} is enabled.` };
  return { allowed: true, reason: "No kill switch blocks this scope." };
}

export function buildOperatorAuditEvent(input: {
  operatorRef: string;
  action: string;
  targetType: string;
  targetRef?: string;
  commandRef?: string;
  approvalRef?: string;
  evidenceRefs?: string[];
  payload?: Record<string, unknown>;
}) {
  return {
    auditRef: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    evidenceRefs: input.evidenceRefs ?? [],
    payload: input.payload ?? {},
    ...input
  };
}

export function buildFounderActionsRequired(input: {
  approvals: ApprovalQueueItem[];
  capacityLimits: CapacityLimit[];
  killSwitches: KillSwitch[];
}) {
  const actions: string[] = [];
  for (const approval of input.approvals) {
    if (approval.decision === "PENDING" && (approval.riskLevel === "HIGH" || approval.riskLevel === "CRITICAL")) {
      actions.push(`Review ${approval.riskLevel} approval ${approval.approvalRef}`);
    }
  }
  for (const limit of input.capacityLimits) {
    if (limit.status === "THROTTLE" || limit.status === "STOP") actions.push(`Capacity guard ${limit.limitKey} is ${limit.status}`);
  }
  for (const sw of input.killSwitches) {
    if (sw.enabled) actions.push(`Kill switch enabled: ${sw.switchKey}`);
  }
  return actions;
}