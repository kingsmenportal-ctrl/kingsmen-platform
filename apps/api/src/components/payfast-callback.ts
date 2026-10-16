import { parsePayFastFormBody, verifyPayFastItn, type PayFastItnConfig } from "./payfast-itn";

export type ExpectedPayment = {
  invoiceId: string;
  paymentRef: string;
  amountCents: number;
  currency: "ZAR";
  status: "issued" | "paid" | "void" | "draft";
};

export type PaymentCommitInput = {
  invoiceId: string;
  paymentRef: string;
  provider: "payfast";
  providerPaymentId: string;
  amountCents: number;
  currency: "ZAR";
  eventFingerprint: string;
  rawNotification: Record<string, string>;
};

export type PaymentCommitResult = {
  outcome: "recorded" | "duplicate";
  paymentId: string;
  invoiceStatus: string;
};

export interface PaymentCallbackStore {
  /** Must look up by the merchant-generated reference, never by an untrusted amount. */
  findExpectedPayment(paymentRef: string): Promise<ExpectedPayment | null>;
  /**
   * MUST be one database transaction:
   * - unique provider + providerPaymentId and unique eventFingerprint
   * - reject an existing provider payment ID with changed invoice/amount
   * - lock invoice row and prevent cancelled/void/paid invoice transitions
   * - insert payment and balanced ledger postings atomically
   * - update invoice status only after the verified payment is committed
   * - return duplicate only when the existing event matches exactly
   */
  commitVerifiedPayment(input: PaymentCommitInput): Promise<PaymentCommitResult>;
}

export type CallbackConfig = PayFastItnConfig & {
  maxBodyBytes?: number;
};

export async function processPayFastCallback(
  rawBody: string,
  config: CallbackConfig,
  store: PaymentCallbackStore,
  fetcher: typeof fetch = fetch
): Promise<{ status: 200; body: { ok: true; outcome: "recorded" | "duplicate"; paymentId: string; invoiceStatus: string } }> {
  const maxBytes = config.maxBodyBytes ?? 16_384;
  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) throw new Error("PAYFAST_BODY_TOO_LARGE");

  const parameters = parsePayFastFormBody(rawBody);
  const paymentRef = parameters.m_payment_id ?? "";
  if (!paymentRef || paymentRef.length > 128) throw new Error("PAYFAST_PAYMENT_REFERENCE_INVALID");

  // Resolve expected values from trusted DB state before comparing callback fields.
  const expected = await store.findExpectedPayment(paymentRef);
  if (!expected) throw new Error("PAYFAST_INVOICE_NOT_FOUND");
  if (expected.currency !== "ZAR") throw new Error("PAYFAST_CURRENCY_UNSUPPORTED");
  if (expected.amountCents <= 0) throw new Error("PAYFAST_AMOUNT_INVALID");
  if (expected.status !== "issued") {
    throw new Error("PAYFAST_INVOICE_NOT_PAYABLE");
  }

  const verified = await verifyPayFastItn(parameters, {
    paymentRef: expected.paymentRef,
    amountCents: expected.amountCents
  }, config, fetcher);

  const { createHash } = await import("node:crypto");
  const eventFingerprint = createHash("sha256")
    .update(Object.keys(parameters).sort().map((key) => `${key}=${parameters[key]}`).join("&"))
    .digest("hex");

  const committed = await store.commitVerifiedPayment({
    invoiceId: expected.invoiceId,
    paymentRef: verified.paymentRef,
    provider: "payfast",
    providerPaymentId: verified.providerPaymentId,
    amountCents: verified.amountCents,
    currency: "ZAR",
    eventFingerprint,
    rawNotification: verified.raw
  });

  return {
    status: 200,
    body: { ok: true, outcome: committed.outcome, paymentId: committed.paymentId, invoiceStatus: committed.invoiceStatus }
  };
}
