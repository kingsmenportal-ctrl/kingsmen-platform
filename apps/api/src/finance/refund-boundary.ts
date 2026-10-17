import crypto from "crypto";
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
  if (!input.candidateRef?.trim()) throw new Error("Refund candidate reference is required.");
  if (!input.paymentRef?.trim() && !input.orderRef?.trim()) {
    throw new Error("Refund must reference a payment or order.");
  }
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Refund amount must be a positive integer number of cents.");
  }
  if (!input.reason?.trim()) throw new Error("Refund reason is required.");
  if (!input.requestedBy?.trim()) throw new Error("Refund requester identity is required.");
  return {
    refundRef: `refund_${crypto.randomUUID()}`,
    candidateRef: input.candidateRef.trim(),
    paymentRef: input.paymentRef?.trim(),
    orderRef: input.orderRef?.trim(),
    amountCents: input.amountCents,
    currency: "ZAR",
    reason: input.reason.trim(),
    refundStatus: "PENDING_REVIEW",
    requestedBy: input.requestedBy.trim(),
    evidenceRef: input.evidenceRef?.trim() || undefined
  };
}

export function approveRefund(input: RefundRequest & { approvalRef: string; evidenceRef: string }): RefundRequest {
  if (!input.approvalRef?.trim()) throw new Error("NO_AI_REFUND_APPROVAL: a human approval reference is required.");
  if (!input.evidenceRef?.trim()) throw new Error("REFUND_EVIDENCE_REQUIRED: refund requires evidence.");
  if (!input.requestedBy?.trim() || !input.candidateRef?.trim()) {
    throw new Error("Refund requester and candidate references are required.");
  }
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Refund amount must be a positive integer number of cents.");
  }
  if (input.refundStatus !== "PENDING_REVIEW") {
    throw new Error("Only a refund pending review can be approved.");
  }
  assertRefundRequiresHumanApproval(input);
  return { ...input, approvalRef: input.approvalRef.trim(), evidenceRef: input.evidenceRef.trim(), refundStatus: "APPROVED" };
}

export function aiCanApproveRefund(): false {
  return false;
}
