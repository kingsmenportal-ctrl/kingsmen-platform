export const N04_FINANCIAL_VIEW_POLICY = {
  productionReady: false,
  candidateCanViewServiceOrders: true,
  candidateCanViewPaymentStatus: true,
  candidateCanViewRefundStatus: true,
  candidateCannotMarkPaid: true,
  returnUrlCannotMarkPaid: true,
  paymentRequiresWebhookOrManualFinanceReview: true,
  refundRequiresManualFinanceReview: true,
  officialPricingPreserved: true,
  cvRevampUpgradeBonusPreserved: true
} as const;

export function assertN04FinancialViewPolicySafe() {
  if (N04_FINANCIAL_VIEW_POLICY.productionReady !== false) {
    throw new Error("N04 financial view policy cannot claim productionReady=true");
  }

  return true;
}