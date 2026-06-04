export function assertN04PaymentStatusSafe(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  paymentSignal: "return_url" | "webhook_verified" | "manual_finance_review" | "none";
  action: "view_status" | "mark_paid" | "mark_failed" | "mark_refunded";
  evidenceId?: string;
  auditId?: string;
}) {
  if (!input.auditId || !input.evidenceId) {
    throw new Error("N04 payment status requires auditId and evidence");
  }

  if (input.actorType === "candidate" && input.action !== "view_status") {
    throw new Error("N04 payment status blocked: candidate cannot mark paid, failed, or refunded");
  }

  if (input.action === "mark_paid" && input.paymentSignal !== "webhook_verified" && input.paymentSignal !== "manual_finance_review") {
    throw new Error("N04 payment status blocked: return_url cannot mark paid");
  }

  return true;
}