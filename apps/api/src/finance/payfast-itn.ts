import { randToCents } from "./money";
import { verifyPayFastSignature, type PayFastFields } from "./payfast-signature";
import { isAllowedPayFastSourceIp } from "./payfast-source-ip";

export interface PayFastItnValidationInput {
  payload: PayFastFields;
  expectedMerchantReference: string;
  expectedAmountCents: number;
  passphrase?: string;
  duplicate?: boolean;
  /** Direct socket peer address; do not pass an untrusted forwarded header. */
  remoteAddress?: string;
  /** Operator-maintained exact IPs from the provider's current official guidance. */
  allowedSourceIps?: string;
}

export interface PayFastItnValidationResult {
  accepted: boolean;
  merchantReference: string;
  providerPaymentId?: string;
  paymentStatus?: string;
  signatureValid: boolean;
  amountValid: boolean;
  duplicate: boolean;
  ipValid: boolean;
  rejectionReason?: string;
  idempotencyKey: string;
}

export function validatePayFastItn(input: PayFastItnValidationInput): PayFastItnValidationResult {
  const payload = input.payload ?? {};
  const merchantReference = String(payload.m_payment_id ?? "").trim();
  const rawProviderPaymentId = String(payload.pf_payment_id ?? "").trim();
  const providerPaymentId = rawProviderPaymentId || undefined;
  const paymentStatus = String(payload.payment_status ?? "").trim().toUpperCase() || undefined;
  const receivedSignature = String(payload.signature ?? "").trim();
  const signatureValid = receivedSignature
    ? verifyPayFastSignature(payload, receivedSignature, input.passphrase)
    : false;

  let amountGrossCents = -1;
  try {
    const rawAmount = payload.amount_gross;
    const amountText = rawAmount === undefined || rawAmount === null ? "" : String(rawAmount).trim();
    // Provider ITNs use a decimal point and at most two fractional digits.
    // Reject locale commas, exponent notation, and over-precision instead of rounding them.
    if (/^\d+(?:\.\d{1,2})?$/.test(amountText)) {
      amountGrossCents = randToCents(amountText);
    }
  } catch {
    amountGrossCents = -1;
  }
  const amountValid = Number.isSafeInteger(input.expectedAmountCents)
    && input.expectedAmountCents > 0
    && amountGrossCents === input.expectedAmountCents;
  const duplicate = input.duplicate === true;
  const ipValid = isAllowedPayFastSourceIp(input.remoteAddress, input.allowedSourceIps);
  const idempotencyKey = ["payfast-itn", merchantReference || "missing-reference", providerPaymentId ?? "missing-provider-id", paymentStatus ?? "unknown"].join(":");

  const result = (accepted: boolean, rejectionReason?: string): PayFastItnValidationResult => ({
    accepted, merchantReference, providerPaymentId, paymentStatus, signatureValid,
    amountValid, duplicate, ipValid, ...(rejectionReason ? { rejectionReason } : {}), idempotencyKey
  });

  if (!input.expectedMerchantReference || merchantReference !== input.expectedMerchantReference) {
    return result(false, "Merchant reference mismatch.");
  }
  if (!signatureValid) return result(false, "Invalid PayFast signature.");
  if (!providerPaymentId) return result(false, "Missing PayFast provider payment ID.");
  if (!amountValid) return result(false, "PayFast amount mismatch or invalid expected amount.");
  if (duplicate) return result(false, "Duplicate ITN receipt.");
  if (!ipValid) return result(false, "PayFast ITN IP/source not verified.");
  if (paymentStatus !== "COMPLETE") return result(false, "Payment status is not COMPLETE.");

  return result(true);
}
