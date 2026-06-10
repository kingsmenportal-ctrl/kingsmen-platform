import type { RefundRequest } from "./finance-types";
import { assertRefundRequiresHumanApproval } from "./finance-policy";

export function createRefundRequest(input: {
  paymentRef?: string;
  orderRef?: string;
  candidateRef: string;
  amountCents: number;
  reason: string;
  requestedBy: string;
  evidenceRef?: string;
}): RefundRequest {
  if (!input.reason.trim()) throw new Error("Refund reason is required.");
  return {
    refundRef: `refund_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    paymentRef: input.paymentRef,
    orderRef: input.orderRef,
    amountCents: input.amountCents,
    currency: "ZAR",
    reason: input.reason,
    refundStatus: "PENDING_REVIEW",
    requestedBy: input.requestedBy,
    evidenceRef: input.evidenceRef
  };
}

export function approveRefund(input: RefundRequest & { approvalRef: string; evidenceRef: string }): RefundRequest {
  assertRefundRequiresHumanApproval(input);
  return {
    ...input,
    refundStatus: "APPROVED"
  };
}

export function aiCanApproveRefund(): false {
  return false;
}