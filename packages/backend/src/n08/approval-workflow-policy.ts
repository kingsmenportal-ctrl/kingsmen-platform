export function assertN08ApprovalWorkflowSafe(input: {
  approvalId?: string;
  actionPacketId?: string;
  commandId?: string;
  highRisk: boolean;
  founderApprovalRequired: boolean;
  founderApproved?: boolean;
  evidenceId?: string;
  auditId?: string;
  proofId?: string;
  truthChangeRequested?: boolean;
  productionReady?: boolean;
}) {
  if (!input.approvalId || !input.actionPacketId || !input.commandId || !input.evidenceId || !input.auditId) {
    throw new Error("N08 approval workflow requires approvalId, actionPacketId, commandId, evidenceId, and auditId");
  }

  if (input.highRisk === true && input.founderApprovalRequired !== true) {
    throw new Error("N08 high-risk approval workflow requires founder approval");
  }

  if (input.highRisk === true && input.founderApproved !== true) {
    throw new Error("N08 high-risk command blocked until founder approves");
  }

  if (input.truthChangeRequested === true && !input.proofId) {
    throw new Error("N08 truth-changing approval requires proofId");
  }

  if (input.productionReady === true) {
    throw new Error("N08 approval workflow cannot claim productionReady=true");
  }

  return true;
}