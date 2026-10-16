import { createHash, timingSafeEqual } from "node:crypto";

/**
 * PayFast custom-payment/ITN signature validation.
 *
 * IMPORTANT: preserve the original POST parameter order. PayFast's custom
 * payment/ITN format is NOT the alphabetically-sorted API signature format.
 * Parse form-urlencoded requests into an insertion-ordered object and do not
 * reorder keys before calling this helper.
 */
export function verifyPayFastSignature(
  parameters: Record<string, string>,
  receivedSignature: string,
  passphrase: string
): boolean {
  if (!passphrase || !receivedSignature || !/^[a-f0-9]{32}$/i.test(receivedSignature)) return false;

  const pairs: string[] = [];
  for (const [key, rawValue] of Object.entries(parameters)) {
    if (key === "signature") break;
    const value = String(rawValue).trim();
    // PayFast's custom integration omits blank values.
    if (value !== "") pairs.push(`${key}=${payfastUrlEncode(value)}`);
  }
  if (pairs.length === 0) return false;

  const canonical = `${pairs.join("&")}&passphrase=${payfastUrlEncode(passphrase.trim())}`;
  const expected = createHash("md5").update(canonical, "utf8").digest("hex");
  const expectedBytes = Buffer.from(expected.toLowerCase(), "utf8");
  const suppliedBytes = Buffer.from(receivedSignature.toLowerCase(), "utf8");
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

/** PHP urlencode-compatible encoding used by PayFast custom integration. */
function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+")
    .replace(/%[0-9a-f]{2}/gi, (escape) => escape.toUpperCase());
}

export function assertPayFastAmountMatches(expectedCents: number, grossAmount: string): void {
  if (!Number.isSafeInteger(expectedCents) || expectedCents < 0) throw new Error("INVALID_EXPECTED_AMOUNT");
  if (!/^\d+\.\d{2}$/.test(grossAmount)) throw new Error("INVALID_PAYFAST_AMOUNT");
  const [whole, fraction] = grossAmount.split(".");
  const receivedCents = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(receivedCents) || receivedCents !== expectedCents) throw new Error("PAYFAST_AMOUNT_MISMATCH");
}

/** Validate fields required before a verified ITN may change payment state. */
export function assertPayFastItnMatches(input: {
  merchantId: string;
  expectedMerchantId: string;
  paymentStatus: string;
  expectedPaymentRef: string;
  paymentRef: string;
  expectedCents: number;
  grossAmount: string;
}): void {
  if (!input.expectedMerchantId || input.merchantId !== input.expectedMerchantId) {
    throw new Error("PAYFAST_MERCHANT_MISMATCH");
  }
  if (!input.expectedPaymentRef || input.paymentRef !== input.expectedPaymentRef) {
    throw new Error("PAYFAST_PAYMENT_REFERENCE_MISMATCH");
  }
  if (input.paymentStatus !== "COMPLETE") throw new Error("PAYFAST_PAYMENT_NOT_COMPLETE");
  assertPayFastAmountMatches(input.expectedCents, input.grossAmount);
}
