const HIGH_RISK_COMMANDS = new Set([
  "stop_selling",
  "resume_selling",
  "source_freeze",
  "source_unfreeze",
  "refund_approve",
  "document_verify",
  "document_reject",
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "partner_share_identity",
  "emergency_pause",
  "rollback"
]);

export function assertN08CommandExecutionSafe(input: {
  commandName: string;
  actorType: "founder" | "operator" | "system" | "worker" | "candidate";
  approvalId?: string;
  founderApproved?: boolean;
  evidenceId?: string;
  auditId?: string;
  proofId?: string;
  sourceVerified?: boolean;
  privacySafe?: boolean;
  candidateHarmChecked?: boolean;
  productionReady?: boolean;
}) {
  if (input.actorType === "candidate") {
    throw new Error("N08 command execution blocked: candidate cannot execute founder commands");
  }

  if (!input.evidenceId || !input.auditId) {
    throw new Error("N08 command execution requires evidenceId and auditId");
  }

  if (HIGH_RISK_COMMANDS.has(input.commandName)) {
    if (!input.approvalId || input.founderApproved !== true) {
      throw new Error(`N08 high-risk command blocked without founder approval: ${input.commandName}`);
    }

    if (!input.proofId) {
      throw new Error(`N08 high-risk command requires proofId: ${input.commandName}`);
    }
  }

  if (input.sourceVerified === false) {
    throw new Error(`N08 command blocked: source verification gate failed for ${input.commandName}`);
  }

  if (input.privacySafe === false) {
    throw new Error(`N08 command blocked: privacy gate failed for ${input.commandName}`);
  }

  if (input.candidateHarmChecked === false) {
    throw new Error(`N08 command blocked: candidate-harm gate failed for ${input.commandName}`);
  }

  if (input.productionReady === true) {
    throw new Error("N08 command execution cannot claim productionReady=true");
  }

  return true;
}