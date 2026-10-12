import { centsToRand } from "./money";
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

export function createFinanceOrder(input: {
  candidateRef: string;
  planCode: FinancePlanCode;
  /** Must come from server-verified finance history, never directly from a client request. */
  verifiedPriorCvRevampPurchase?: boolean;
}): FinanceOrder {
  const plan = getFinancePlan(input.planCode);
  const upgradeBonusRoutes =
    input.planCode !== "CV_REVAMP_R49_99" &&
    input.planCode !== "FREE_DESTINY_MAP_R0" &&
    input.verifiedPriorCvRevampPurchase === true
      ? plan.upgradeBonusRoutesWhenCvRevampOwned
      : 0;
  const entitlementSnapshot = {
    catalogueVersion: plan.catalogueVersion,
    serviceTermDays: plan.serviceTermDays,
    managedApplicationCount: plan.managedApplicationCount,
    accommodationRouteCount: plan.accommodationRouteCount,
    cvVersions: plan.cvVersions,
    motivationLetters: plan.motivationLetters,
    acknowledgementTargetBusinessHours: plan.acknowledgementTargetBusinessHours,
    firstResponseTargetBusinessHours: plan.firstResponseTargetBusinessHours,
    upgradeBonusRoutes,
    refundPolicyVersion: plan.refundPolicyVersion,
    serviceScope: plan.serviceScope,
    responseTargetDisclaimer: plan.responseTargetDisclaimer
  };
  return {
    orderRef: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    planCode: input.planCode,
    orderStatus: plan.amountCents === 0 ? "PAID" : "PENDING_PAYMENT",
    amountCents: plan.amountCents,
    currency: "ZAR",
    catalogueVersion: plan.catalogueVersion,
    serviceTermDays: plan.serviceTermDays,
    managedApplicationCount: plan.managedApplicationCount,
    accommodationRouteCount: plan.accommodationRouteCount,
    cvVersions: plan.cvVersions,
    motivationLetters: plan.motivationLetters,
    acknowledgementTargetBusinessHours: plan.acknowledgementTargetBusinessHours,
    firstResponseTargetBusinessHours: plan.firstResponseTargetBusinessHours,
    upgradeBonusRoutes,
    refundPolicyVersion: plan.refundPolicyVersion,
    serviceScope: plan.serviceScope,
    entitlementSnapshot
  };
}

export function createPayFastPaymentIntent(input: {
  order: FinanceOrder;
  candidateEmail?: string;
  candidateName?: string;
  runtime: PayFastRuntimeConfig;
}): PayFastPaymentIntent {
  if (input.order.amountCents <= 0) throw new Error("Free orders do not need PayFast payment intents.");

  const plan = getFinancePlan(input.order.planCode);
  const merchantReference = input.order.orderRef;
  const payload: PayFastFields = {
    merchant_id: input.runtime.merchantId,
    merchant_key: input.runtime.merchantKey,
    return_url: input.runtime.returnUrl,
    cancel_url: input.runtime.cancelUrl,
    notify_url: input.runtime.notifyUrl,
    m_payment_id: merchantReference,
    amount: centsToRand(input.order.amountCents),
    item_name: plan.planName,
    item_description: plan.description,
    email_address: input.candidateEmail,
    name_first: input.candidateName
  };

  const signature = createPayFastSignature(payload, input.runtime.passphrase);
  const signedPayload = { ...payload, signature };

  return {
    intentRef: `pf_intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    merchantReference,
    paymentUrl: getPayFastProcessUrl(input.runtime.environment),
    signedPayload,
    signature,
    idempotencyKey: ["payfast-intent", input.order.orderRef, input.order.amountCents].join(":")
  };
}