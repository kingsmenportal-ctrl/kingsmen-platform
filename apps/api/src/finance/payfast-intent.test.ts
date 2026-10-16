import test from "node:test";
import assert from "node:assert/strict";
import { createFinanceOrder, createPayFastPaymentIntent } from "./payfast-intent";
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
  assert.equal(
    verifyPayFastSignature(intent.signedPayload, intent.signature, runtime.passphrase),
    true
  );
});

test("payment intent rejects callback URLs that are not HTTPS", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_002", planCode: "CV_REVAMP_R49_99" });
  assert.throws(() => createPayFastPaymentIntent({
    order,
    runtime: { ...runtime, notifyUrl: "http://staging.example.test/itn" }
  }), /absolute HTTPS URL/i);
});

test("free preview orders cannot create payment intents", () => {
  const order = createFinanceOrder({ candidateRef: "candidate_synthetic_003", planCode: "FREE_DESTINY_MAP_R0" });
  assert.throws(() => createPayFastPaymentIntent({ order, runtime }), /Free orders do not need/i);
});
