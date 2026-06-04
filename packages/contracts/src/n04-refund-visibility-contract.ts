export type N04RefundRequest = {
  refundRequestId: string;
  serviceOrderId: string;
  candidateId: string;
  reason: string;
  status: "requested" | "review_pending" | "approved" | "rejected" | "paid_out" | "closed";
  candidateVisible: true;
  autoApprovalAllowed: false;
  manualFinanceReviewRequired: true;
  evidenceId: string;
  auditId: string;
  createdAt: string;
  productionReady: false;
};