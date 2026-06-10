import type { FinanceInvoice, FinanceOrder, FinancePayment, RefundRequest } from "./finance-types";

export interface CandidateFinanceView {
  candidateRef: string;
  orders: FinanceOrder[];
  invoices: FinanceInvoice[];
  payments: FinancePayment[];
  refunds: RefundRequest[];
  outstandingCents: number;
  paidCents: number;
  refundPendingCents: number;
}

export function buildCandidateFinanceView(input: {
  candidateRef: string;
  orders: FinanceOrder[];
  invoices: FinanceInvoice[];
  payments: FinancePayment[];
  refunds: RefundRequest[];
}): CandidateFinanceView {
  const outstandingCents = input.invoices
    .filter((invoice) => invoice.invoiceStatus === "OPEN" || invoice.invoiceStatus === "OVERDUE")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);

  const paidCents = input.payments
    .filter((payment) => payment.paymentStatus === "COMPLETE" && payment.verified)
    .reduce((sum, payment) => sum + payment.amountGrossCents, 0);

  const refundPendingCents = input.refunds
    .filter((refund) => refund.refundStatus === "PENDING_REVIEW" || refund.refundStatus === "APPROVED" || refund.refundStatus === "PROCESSING")
    .reduce((sum, refund) => sum + refund.amountCents, 0);

  return {
    ...input,
    outstandingCents,
    paidCents,
    refundPendingCents
  };
}

export function buildFinanceFounderSummary(view: CandidateFinanceView) {
  const actions: string[] = [];
  if (view.outstandingCents > 0) actions.push("Candidate has outstanding invoice balance.");
  if (view.refundPendingCents > 0) actions.push("Refund review or processing is pending.");
  return {
    candidateRef: view.candidateRef,
    actions
  };
}