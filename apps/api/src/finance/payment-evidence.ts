export interface PaymentEvidence {
  evidenceRef: string;
  sourceType: "payfast_intent" | "payfast_itn" | "finance_payment" | "refund_request" | "ledger_entry";
  sourceRef: string;
  candidateRef?: string;
  orderRef?: string;
  paymentRef?: string;
  eventName: string;
  eventSummary: string;
  proofPayload: Record<string, unknown>;
}

export function createPaymentEvidence(input: Omit<PaymentEvidence, "evidenceRef">): PaymentEvidence {
  if (!input.eventSummary.trim()) throw new Error("Payment evidence summary is required.");
  return {
    evidenceRef: `pay_ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    ...input
  };
}