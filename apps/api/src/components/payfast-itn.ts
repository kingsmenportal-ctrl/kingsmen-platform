import { assertPayFastItnMatches, verifyPayFastSignature } from "./payfast";

export type PayFastItn = Record<string, string>;

export type PayFastItnConfig = {
  merchantId: string;
  passphrase: string;
  environment: "sandbox" | "live";
};

export type VerifiedPayFastItn = {
  merchantId: string;
  paymentRef: string;
  providerPaymentId: string;
  paymentStatus: "COMPLETE";
  amountCents: number;
  raw: PayFastItn;
};

const HOSTS = {
  sandbox: "sandbox.payfast.co.za",
  live: "www.payfast.co.za"
} as const;

/**
 * Validate an ITN payload cryptographically, against expected invoice details,
 * and with PayFast's server-side ITN validation endpoint.
 *
 * This function does not write to the database. Only call a transactional RPC
 * after it returns successfully; that RPC must enforce unique provider payment
 * IDs and durable idempotency.
 */
export async function verifyPayFastItn(
  parameters: PayFastItn,
  expected: { paymentRef: string; amountCents: number },
  config: PayFastItnConfig,
  fetcher: typeof fetch = fetch
): Promise<VerifiedPayFastItn> {
  if (!config.merchantId || !config.passphrase) throw new Error("PAYFAST_NOT_CONFIGURED");
  if (!expected.paymentRef || !Number.isSafeInteger(expected.amountCents) || expected.amountCents < 0) {
    throw new Error("INVALID_EXPECTED_PAYMENT");
  }

  const signature = parameters.signature ?? "";
  if (!verifyPayFastSignature(parameters, signature, config.passphrase)) {
    throw new Error("PAYFAST_SIGNATURE_INVALID");
  }

  const providerPaymentId = parameters.pf_payment_id ?? "";
  if (!/^\d{1,30}$/.test(providerPaymentId)) throw new Error("PAYFAST_PROVIDER_PAYMENT_ID_INVALID");

  assertPayFastItnMatches({
    merchantId: parameters.merchant_id ?? "",
    expectedMerchantId: config.merchantId,
    paymentStatus: parameters.payment_status ?? "",
    expectedPaymentRef: expected.paymentRef,
    paymentRef: parameters.m_payment_id ?? "",
    expectedCents: expected.amountCents,
    grossAmount: parameters.amount_gross ?? ""
  });

  const host = HOSTS[config.environment];
  const confirmationBody = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (key === "signature") break;
    confirmationBody.append(key, value);
  }

  let confirmation: Response;
  try {
    confirmation = await fetcher(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: confirmationBody.toString(),
      signal: AbortSignal.timeout(8000),
      redirect: "error"
    });
  } catch {
    throw new Error("PAYFAST_CONFIRMATION_UNAVAILABLE");
  }
  if (!confirmation.ok) throw new Error("PAYFAST_CONFIRMATION_HTTP_ERROR");
  const text = (await confirmation.text()).trim();
  if (text !== "VALID") throw new Error("PAYFAST_CONFIRMATION_INVALID");

  return {
    merchantId: parameters.merchant_id,
    paymentRef: parameters.m_payment_id,
    providerPaymentId,
    paymentStatus: "COMPLETE",
    amountCents: expected.amountCents,
    raw: { ...parameters }
  };
}

/** Parse only form-urlencoded string values; reject duplicate parameter names. */
export function parsePayFastFormBody(body: string): PayFastItn {
  const params = new URLSearchParams(body);
  const result: PayFastItn = {};
  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) throw new Error("PAYFAST_DUPLICATE_PARAMETER");
    result[key] = value;
  }
  if (!result.signature) throw new Error("PAYFAST_SIGNATURE_MISSING");
  return result;
}
