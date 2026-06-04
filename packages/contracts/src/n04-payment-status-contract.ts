export type N04PaymentStatus = {
  paymentStatusId: string;
  serviceOrderId: string;
  candidateId: string;
  status: "pending" | "return_seen_unverified" | "webhook_verified" | "manual_finance_review" | "paid_verified" | "failed" | "refunded";
  provider?: "payfast" | "paypal" | "manual" | "other";
  proofId?: string;
  evidenceId: string;
  candidateVisible: true;
  candidateCanMarkPaid: false;
  returnUrlCanMarkPaid: false;
  createdAt: string;
  productionReady: false;
};