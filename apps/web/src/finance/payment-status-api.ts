export type CandidateUiPaymentStatus = "pending" | "paid" | "active" | "blocked";

export interface BackendPayFastStatusResponse {
  ok?: boolean;
  status?: string;
  payment?: {
    merchantReference?: string;
    orderRef?: string;
    invoiceRef?: string;
    candidateRef?: string;
    orderStatus?: string;
    invoiceStatus?: string;
    paymentStatus?: string;
    verified?: boolean;
    evidenceRef?: string;
    entitlementRef?: string;
    entitlementStatus?: string;
    updatedAtIso?: string;
  };
}

export interface CandidatePaymentStatusViewModel {
  status: CandidateUiPaymentStatus;
  candidateRef?: string;
  merchantReference?: string;
  packageName?: string;
  entitlementRef?: string;
  evidenceRef?: string;
  backendStatus?: string;
  updatedAtIso?: string;
  error?: string;
}

export function mapPayFastBackendStatus(input: BackendPayFastStatusResponse | null, merchantReference?: string): CandidatePaymentStatusViewModel {
  if (!input?.ok) {
    return {
      status: "pending",
      merchantReference,
      backendStatus: input?.status,
      error: input?.status ? undefined : "Payment status is not available yet."
    };
  }

  const payment = input.payment;
  if (!payment) {
    return {
      status: "pending",
      merchantReference,
      backendStatus: input.status
    };
  }

  const paymentStatus = (payment.paymentStatus ?? "").toUpperCase();
  const orderStatus = (payment.orderStatus ?? "").toUpperCase();
  const entitlementStatus = (payment.entitlementStatus ?? "").toUpperCase();

  let status: CandidateUiPaymentStatus = "pending";
  if ([paymentStatus, orderStatus].some((value) => ["FAILED", "CANCELLED", "DISPUTED", "BLOCKED"].includes(value))) {
    status = "blocked";
  } else if (entitlementStatus === "ACTIVE") {
    status = "active";
  } else if (payment.verified === true && paymentStatus === "COMPLETE") {
    status = "paid";
  }

  return {
    status,
    candidateRef: payment.candidateRef,
    merchantReference: payment.merchantReference ?? merchantReference,
    packageName: payment.orderStatus === "PAID" ? "Paid Kingsmen package" : undefined,
    entitlementRef: payment.entitlementRef,
    evidenceRef: payment.evidenceRef,
    backendStatus: input.status,
    updatedAtIso: payment.updatedAtIso
  };
}

export async function fetchCandidatePaymentStatus(input: {
  apiBaseUrl?: string;
  merchantReference?: string;
}): Promise<CandidatePaymentStatusViewModel> {
  if (!input.merchantReference) {
    return {
      status: "pending",
      error: "Add a merchant reference to check payment status."
    };
  }

  const apiBaseUrl = input.apiBaseUrl ?? process.env.KINGSMEN_API_BASE_URL ?? process.env.NEXT_PUBLIC_KINGSMEN_API_BASE_URL;
  if (!apiBaseUrl) {
    return {
      status: "pending",
      merchantReference: input.merchantReference,
      error: "Backend API base URL is not configured for payment status lookup."
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/payments/payfast/status/${encodeURIComponent(input.merchantReference)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    const body = await response.json() as BackendPayFastStatusResponse;
    return mapPayFastBackendStatus(body, input.merchantReference);
  } catch (error) {
    return {
      status: "pending",
      merchantReference: input.merchantReference,
      error: error instanceof Error ? error.message : "Payment status lookup failed."
    };
  }
}

export const CANDIDATE_PAYMENT_STATUS_API_DOCTRINE = {
  readsBackendStatusRoute: true,
  noPaymentStateMutationFromWeb: true,
  noProviderCredentialsInBrowser: true,
  activeRequiresEntitlementStatusActive: true,
  blockedShowsWhenProviderEvidenceFails: true
} as const;
