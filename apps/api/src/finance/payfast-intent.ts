import crypto from "crypto";
import { centsToRand, assertPositiveOrZeroCents } from "./money";
import { getFinancePlan } from "./pricing-catalog";
import type { FinanceOrder, FinancePlanCode } from "./finance-types";
import { createPayFastSignature, type PayFastFields } from "./payfast-signature";

export interface PayFastRuntimeConfig {
  environment: "sandbox" | "live";
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl: string;
}

export interface PayFastPaymentIntent {
  intentRef: string;
  merchantReference: string;
  paymentUrl: string;
  signedPayload: PayFastFields;
  signature: string;
  idempotencyKey: string;
}

export function getPayFastProcessUrl(environment: "sandbox" | "live"): string {
  return environment === "live"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";
}

export function createFinanceOrder(input: { candidateRef: string; planCode: FinancePlanCode }): FinanceOrder {
  if (!input.candidateRef?.trim()) throw new Error("Candidate reference is required to create an order.");
  const plan = getFinancePlan(input.planCode);
  return {
    orderRef: `ord_${crypto.randomUUID()}`,
    candidateRef: input.candidateRef.trim(),
    planCode: input.planCode,
    // A zero-cost preview is not a payment and must not be represented as a paid order.
    orderStatus: plan.amountCents === 0 ? "DRAFT" : "PENDING_PAYMENT",
    amountCents: plan.amountCents,
    currency: "ZAR"
  };
}

function assertSafeCallbackUrl(value: string | undefined, name: string, required: boolean): void {
  if (!value && !required) return;
  if (!value) throw new Error(`PayFast ${name} is required.`);
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`PayFast ${name} must be an absolute HTTPS URL.`); }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`PayFast ${name} must be an absolute HTTPS URL without embedded credentials.`);
  }
}

export function createPayFastPaymentIntent(input: {
  order: FinanceOrder;
  candidateEmail?: string;
  candidateName?: string;
  runtime: PayFastRuntimeConfig;
}): PayFastPaymentIntent {
  const { order, runtime } = input;
  if (!order.orderRef?.trim() || !order.candidateRef?.trim()) throw new Error("A valid order and candidate reference are required.");
  assertPositiveOrZeroCents(order.amountCents);
  const plan = getFinancePlan(order.planCode);
  if (order.amountCents !== plan.amountCents || order.currency !== plan.currency) {
    throw new Error("Order amount/currency does not match the trusted pricing catalogue.");
  }
  if (order.amountCents <= 0) throw new Error("Free orders do not need PayFast payment intents.");
  if (order.orderStatus !== "PENDING_PAYMENT") throw new Error("Only pending-payment orders can create PayFast intents.");
  if (!runtime.merchantId.trim() || !runtime.merchantKey.trim() || !runtime.notifyUrl.trim()) {
    throw new Error("PayFast merchant credentials and notify URL are required.");
  }
  assertSafeCallbackUrl(runtime.notifyUrl, "notify URL", true);
  assertSafeCallbackUrl(runtime.returnUrl, "return URL", false);
  assertSafeCallbackUrl(runtime.cancelUrl, "cancel URL", false);

  const merchantReference = order.orderRef;
  const payload: PayFastFields = {
    merchant_id: runtime.merchantId,
    merchant_key: runtime.merchantKey,
    return_url: runtime.returnUrl,
    cancel_url: runtime.cancelUrl,
    notify_url: runtime.notifyUrl,
    m_payment_id: merchantReference,
    amount: centsToRand(plan.amountCents),
    item_name: plan.planName,
    item_description: plan.description,
    email_address: input.candidateEmail,
    name_first: input.candidateName
  };

  const signature = createPayFastSignature(payload, runtime.passphrase);
  const signedPayload = { ...payload, signature };

  return {
    intentRef: `pf_intent_${crypto.randomUUID()}`,
    merchantReference,
    paymentUrl: getPayFastProcessUrl(runtime.environment),
    signedPayload,
    signature,
    idempotencyKey: ["payfast-intent", order.orderRef, plan.amountCents].join(":")
  };
}
