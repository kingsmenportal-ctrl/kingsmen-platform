export function buildN08EmergencyPauseDecision(input: {
  reason: string;
  evidenceId: string;
  auditId: string;
  founderApproved: boolean;
}) {
  if (!input.reason || !input.evidenceId || !input.auditId) {
    throw new Error("N08 emergency pause requires reason, evidenceId, and auditId");
  }

  if (input.founderApproved !== true) {
    throw new Error("N08 emergency pause requires founder approval");
  }

  return {
    commandName: "emergency_pause",
    paused: true,
    reason: input.reason,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    rollbackAvailable: true,
    productionReady: false
  } as const;
}

export function buildN08RollbackDecision(input: {
  commandId: string;
  reason: string;
  evidenceId: string;
  auditId: string;
  founderApproved: boolean;
}) {
  if (!input.commandId || !input.reason || !input.evidenceId || !input.auditId) {
    throw new Error("N08 rollback requires commandId, reason, evidenceId, and auditId");
  }

  if (input.founderApproved !== true) {
    throw new Error("N08 rollback requires founder approval");
  }

  return {
    commandId: input.commandId,
    rolledBack: true,
    reason: input.reason,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    productionReady: false
  } as const;
}