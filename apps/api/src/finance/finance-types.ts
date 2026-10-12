export type CurrencyCode = "ZAR";

export type FinancePlanCode =
  | "FREE_DESTINY_MAP_R0"
  | "CV_REVAMP_R49_99"
  | "ARTISAN_CHARTER_R149_99"
  | "FOUNDATIONAL_ACCORD_R169_99"
  | "GUILDMASTERS_CHARTER_R199_99"
  | "COLLEGIATE_ORDINANCE_R299_99"
  | "CHANCELLORS_WRIT_R399_99"
  | "REGENCY_MANDATE_R469_99"
  // Legacy compatibility only. This code is intentionally absent from the active
  // pricing catalog and must not be used to create new orders unless the founder
  // explicitly approves a separate accommodation product.
  | "ACCOMMODATION_SUPPORT_R179";

export type OrderStatus = "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "FAILED";
export type InvoiceStatus = "OPEN" | "PAID" | "VOID" | "OVERDUE" | "REFUNDED" | "FAILED";
export type PaymentStatus = "PENDING" | "COMPLETE" | "FAILED" | "CANCELLED" | "REFUNDED" | "DISPUTED";
export type RefundStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface FinancePlan {
  planCode: FinancePlanCode;
  planName: string;
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  managedApplicationCount: number;
  accommodationRouteCount: number;
  cvVersions: number;
  motivationLetters: number;
  serviceTermDays: number;
  acknowledgementTargetBusinessHours: number;
  firstResponseTargetBusinessHours: number;
  upgradeBonusRoutesWhenCvRevampOwned: number;
  refundPolicyVersion: string;
  catalogueVersion: string;
  serviceScope: string;
  responseTargetDisclaimer: string;
  doctrineNotes: string;
}

export interface FinanceOrder {
  orderRef: string;
  candidateRef: string;
  planCode: FinancePlanCode;
  orderStatus: OrderStatus;
  amountCents: number;
  currency: CurrencyCode;
  catalogueVersion: string;
  serviceTermDays: number;
  managedApplicationCount: number;
  accommodationRouteCount: number;
  cvVersions: number;
  motivationLetters: number;
  acknowledgementTargetBusinessHours: number;
  firstResponseTargetBusinessHours: number;
  upgradeBonusRoutes: number;
  refundPolicyVersion: string;
  serviceScope: string;
  entitlementSnapshot: Record<string, string | number | boolean>;
  evidenceRef?: string;
}

export interface FinanceInvoice {
  invoiceRef: string;
  orderRef: string;
  candidateRef: string;
  invoiceStatus: InvoiceStatus;
  amountCents: number;
  currency: CurrencyCode;
  evidenceRef?: string;
}

export interface FinancePayment {
  paymentRef: string;
  orderRef: string;
  invoiceRef?: string;
  candidateRef: string;
  provider: "PAYFAST";
  providerPaymentId?: string;
  merchantReference: string;
  amountGrossCents: number;
  amountFeeCents: number;
  amountNetCents: number;
  currency: CurrencyCode;
  paymentStatus: PaymentStatus;
  verified: boolean;
  evidenceRef?: string;
}

export interface RefundRequest {
  refundRef: string;
  paymentRef?: string;
  orderRef?: string;
  candidateRef: string;
  amountCents: number;
  currency: CurrencyCode;
  reason: string;
  refundStatus: RefundStatus;
  requestedBy: string;
  approvalRef?: string;
  evidenceRef?: string;
}