import type { PolicyGateEvaluation } from "./governance-types";

export function evaluateRefundBoundary(input: {
  paymentEvidenceRefs: string[];
  refundPolicyEvidenceRefs: string[];
  humanApproved: boolean;
  refundReason: string;
}): PolicyGateEvaluation {
  const evidenceRefs = [...input.paymentEvidenceRefs, ...input.refundPolicyEvidenceRefs];
  const base = {
    gateRef: `gate_refund_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    policyRef: "POL-REFUND-001",
    gateName: "Refund approval boundary",
    actionRequested: "refund_approval",
    evidenceRefs,
    sourceConfidence: "HIGH" as const,
    evaluatedBy: "system"
  };

  if (!input.refundReason.trim()) {
    return { ...base, gateStatus: "BLOCK" as const, decisionSummary: "Refund blocked because refund reason is missing.", blockedReason: "REFUND_REASON_REQUIRED" };
  }
  if (input.paymentEvidenceRefs.length === 0) {
    return { ...base, gateStatus: "BLOCK" as const, decisionSummary: "Refund blocked because payment evidence is missing.", blockedReason: "PAYMENT_EVIDENCE_REQUIRED" };
  }
  if (input.refundPolicyEvidenceRefs.length === 0) {
    return { ...base, gateStatus: "REVIEW_REQUIRED" as const, decisionSummary: "Refund requires review because refund policy evidence is missing.", reviewReason: "REFUND_POLICY_EVIDENCE_REQUIRED" };
  }
  if (!input.humanApproved) {
    return { ...base, gateStatus: "REVIEW_REQUIRED" as const, decisionSummary: "Refund requires human/operator approval.", reviewReason: "HUMAN_APPROVAL_REQUIRED" };
  }
  return { ...base, gateStatus: "ALLOW" as const, decisionSummary: "Refund boundary passed." };
}