import test from "node:test";
import assert from "node:assert/strict";
import { createFinanceOrder, createPayFastPaymentIntent, getPayFastProcessUrl } from "./payfast-intent";
import { verifyPayFastSignature } from "./payfast-signature";

const runtime = {
  environment: "sandbox" as const,
  merchantId: "synthetic-merchant-id",
  merchantKey: "synthetic-private-merchant-key",
  passphrase: "synthetic-passphrase",
  returnUrl: "https://staging.example.test/payments/return",
  cancelUrl: "https://staging.example.test/payments/cancel",
  notifyUrl: "https://staging.example.test/api/finance/payfast/itn"
};

test("payment form payload never exposes merchant key and signature remains valid", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_001", planCode: "CV_REVAMP_R49_99" });
  const intent = createPayFastPaymentIntent({ order, candidateEmail: "test@example.invalid", runtime });

  assert.equal(Object.hasOwn(intent.signedPayload, "merchant_key"), false);
  assert.equal(JSON.stringify(intent).includes(runtime.merchantKey), false);
  assert.equal(intent.signedPayload.merchant_id, runtime.merchantId);
  assert.equal(verifyPayFastSignature(intent.signedPayload, intent.signature, runtime.passphrase), true);
});

test("payment intent rejects callback URLs that are not HTTPS", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_002", planCode: "CV_REVAMP_R49_99" });
  assert.throws(() => createPayFastPaymentIntent({
    order, runtime: { ...runtime, notifyUrl: "http://staging.example.test/itn" }
  }), /absolute HTTPS URL/i);
});

test("free preview orders cannot create payment intents", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_003", planCode: "FREE_DESTINY_MAP_R0" });
  assert.throws(() => createPayFastPaymentIntent({ order, runtime }), /Free orders do not need/i);
});

test("rejects a tampered order amount instead of signing a client-controlled price", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_004", planCode: "CV_REVAMP_R49_99" });
  order.amountCents = 1;
  assert.throws(() => createPayFastPaymentIntent({ order, runtime }), /does not match the trusted pricing catalogue/i);
});

test("rejects a currency mismatch and an order that is not pending payment", () => {
  const wrongCurrency = createFinanceOrder({ candidateRef: "candidate_synthetic_005", planCode: "CV_REVAMP_R49_99" });
  wrongCurrency.currency = "USD";
  assert.throws(() => createPayFastPaymentIntent({ order: wrongCurrency, runtime }), /does not match the trusted pricing catalogue/i);

  const wrongStatus = createFinanceOrder({ candidateRef: "candidate_synthetic_006", planCode: "CV_REVAMP_R49_99" });
  wrongStatus.orderStatus = "PAID";
  assert.throws(() => createPayFastPaymentIntent({ order: wrongStatus, runtime }), /Only pending-payment orders/i);
});

test("rejects callback URLs containing embedded credentials or malformed URLs", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_007", planCode: "CV_REVAMP_R49_99" });
  assert.throws(() => createPayFastPaymentIntent({
    order, runtime: { ...runtime, notifyUrl: "https://user:password@staging.example.test/itn" }
  }), /without embedded credentials/i);
  assert.throws(() => createPayFastPaymentIntent({
    order, runtime: { ...runtime, notifyUrl: "not-a-url" }
  }), /absolute HTTPS URL/i);
});

test("selects only the configured PayFast environment endpoint", () => {
  assert.equal(getPayFastProcessUrl("sandbox"), "https://sandbox.payfast.co.za/eng/process");
  assert.equal(getPayFastProcessUrl("live"), "https://www.payfast.co.za/eng/process");
});
