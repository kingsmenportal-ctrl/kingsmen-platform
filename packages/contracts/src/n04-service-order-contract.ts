export type N04KingsmenPackageCode =
  | "FOUNDATIONAL_ACCORD"
  | "COLLEGIATE_ORDINANCE"
  | "CHANCELLORS_WRIT"
  | "REGENCY_MANDATE"
  | "ARTISAN_CHARTER"
  | "GUILDMASTERS_CHARTER"
  | "CV_REVAMP";

export type N04ServiceOrder = {
  serviceOrderId: string;
  candidateId: string;
  packageCode: N04KingsmenPackageCode;
  packageName: string;
  amountCents: number;
  currency: "ZAR";
  status: "draft" | "payment_pending" | "paid_verified" | "manual_review" | "cancelled" | "refunded";
  candidateCanMarkPaid: false;
  auditId: string;
  createdAt: string;
  productionReady: false;
};