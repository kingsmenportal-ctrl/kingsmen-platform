export function assertN04RefundVisibilitySafe(input: {
  actorType: "candidate" | "founder" | "operator" | "system";
  action: "request_refund" | "view_refund" | "approve_refund" | "reject_refund" | "mark_refund_paid";
  manualFinanceReview?: boolean;
  evidenceId?: string;
  auditId?: string;
  autoApprove?: boolean;
}) {
  if (!input.auditId || !input.evidenceId) {
    throw new Error("N04 refund visibility requires auditId and evidence");
  }

  if (input.autoApprove === true) {
    throw new Error("N04 refund request blocked: auto approval is not allowed");
  }

  if (["approve_refund", "reject_refund", "mark_refund_paid"].includes(input.action) && input.manualFinanceReview !== true) {
    throw new Error("N04 refund decision requires manual finance review");
  }

  if (input.actorType === "candidate" && input.action !== "request_refund" && input.action !== "view_refund") {
    throw new Error("N04 refund visibility blocked: candidate cannot approve or pay refunds");
  }

  return true;
}