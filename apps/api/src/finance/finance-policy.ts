import type { FinancePayment, RefundRequest } from "./finance-types";

export const FINANCE_DOCTRINE = {
  POSTGRES_TRUTH: "PostgreSQL finance ledger is truth.",
  PAYFAST_PROCESSOR_ONLY: "PayFast is payment processor only.",
  NO_AI_REFUND_APPROVAL: "No AI refund approval.",
  NO_AIRTABLE_PAYMENT_TRUTH: "No Airtable payment truth.",
  PAID_STATUS_REQUIRES_EVIDENCE: "Paid status requires verified payment evidence."
} as const;

export function assertPaymentCanActivateOrder(payment: FinancePayment): void {
  if (payment.provider !== "PAYFAST") throw new Error("Only PayFast payment provider is enabled for N10.");
  if (payment.paymentStatus !== "COMPLETE") throw new Error("Payment is not COMPLETE.");
  if (!payment.verified) throw new Error("Payment is not verified.");
  if (!payment.evidenceRef) throw new Error("Paid status requires payment evidence.");
}

export function assertRefundRequiresHumanApproval(refund: RefundRequest): void {
  if (!refund.approvalRef) {
    throw new Error("NO_AI_REFUND_APPROVAL: refund requires human approvalRef.");
  }
  if (!refund.evidenceRef) {
    throw new Error("REFUND_EVIDENCE_REQUIRED: refund requires evidenceRef.");
  }
}