import { randToCents } from "./money";
import { verifyPayFastSignature, type PayFastFields } from "./payfast-signature";

export interface PayFastItnValidationInput {
  payload: PayFastFields;
  expectedMerchantReference: string;
  expectedAmountCents: number;
  passphrase?: string;
  duplicate?: boolean;
  ipValid?: boolean;
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
  const payload = input.payload;
  const merchantReference = String(payload.m_payment_id ?? "");
  const providerPaymentId = payload.pf_payment_id ? String(payload.pf_payment_id) : undefined;
  const paymentStatus = payload.payment_status ? String(payload.payment_status) : undefined;
  const receivedSignature = String(payload.signature ?? "");
  const signatureValid = receivedSignature
    ? verifyPayFastSignature(payload, receivedSignature, input.passphrase)
    : false;

  const amountGrossCents = payload.amount_gross ? randToCents(String(payload.amount_gross)) : -1;
  const amountValid = amountGrossCents === input.expectedAmountCents;
  const duplicate = input.duplicate ?? false;
  const ipValid = input.ipValid ?? false;

  const idempotencyKey = ["payfast-itn", merchantReference, providerPaymentId ?? "no-provider-id", paymentStatus ?? "unknown"].join(":");

  if (merchantReference !== input.expectedMerchantReference) {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "Merchant reference mismatch.", idempotencyKey };
  }

  if (!signatureValid) {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "Invalid PayFast signature.", idempotencyKey };
  }

  if (!amountValid) {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "PayFast amount mismatch.", idempotencyKey };
  }

  if (duplicate) {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "Duplicate ITN receipt.", idempotencyKey };
  }

  if (!ipValid) {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "PayFast ITN IP/source not verified.", idempotencyKey };
  }

  if (paymentStatus !== "COMPLETE") {
    return { accepted: false, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason: "Payment status is not COMPLETE.", idempotencyKey };
  }

  return { accepted: true, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, idempotencyKey };
}