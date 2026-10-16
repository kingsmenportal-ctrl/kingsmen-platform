import test from "node:test";
import assert from "node:assert/strict";
import { createFinanceOrder, createPayFastPaymentIntent } from "./payfast-intent";
import { approveRefund, createRefundRequest, aiCanApproveRefund } from "./refund-boundary";

const runtime = {
  environment: "sandbox" as const,
  merchantId: "synthetic-merchant",
  merchantKey: "synthetic-key",
  passphrase: "synthetic-passphrase",
  notifyUrl: "https://staging.example.test/api/payments/payfast/notify",
  returnUrl: "https://staging.example.test/payment/return",
  cancelUrl: "https://staging.example.test/payment/cancel"
};

test("order creation requires a candidate and free preview is not marked paid", () => {
  assert.throws(() => createFinanceOrder({ candidateRef: " ", planCode: "CV_REVAMP_R49_99" }), /Candidate reference/);
  const order = createFinanceOrder({ candidateRef: "candidate-synthetic", planCode: "FREE_DESTINY_MAP_R0" });
  assert.equal(order.orderStatus, "DRAFT");
});

test("payment intent rejects a tampered order amount and non-HTTPS callback URL", () => {
  const order = createFinanceOrder({ candidateRef: "candidate-synthetic", planCode: "CV_REVAMP_R49_99" });
  assert.throws(() => createPayFastPaymentIntent({
    order: { ...order, amountCents: 1 }, runtime
  }), /trusted pricing catalogue/);
  assert.throws(() => createPayFastPaymentIntent({
    order, runtime: { ...runtime, notifyUrl: "http://staging.example.test/notify" }
  }), /HTTPS URL/);
});

test("payment intent only accepts pending orders and derives amount from catalogue", () => {
  const order = createFinanceOrder({ candidateRef: "candidate-synthetic", planCode: "CV_REVAMP_R49_99" });
  const intent = createPayFastPaymentIntent({ order, runtime });
  assert.equal(intent.signedPayload.amount, "49.99");
  assert.equal(intent.merchantReference, order.orderRef);
  assert.equal(intent.paymentUrl, "https://sandbox.payfast.co.za/eng/process");
  assert.throws(() => createPayFastPaymentIntent({
    order: { ...order, orderStatus: "PAID" }, runtime
  }), /pending-payment/);
});

test("refund requests reject invalid amounts and require a target and requester", () => {
  const base = { candidateRef: "candidate-synthetic", orderRef: "order-synthetic", reason: "Duplicate charge", requestedBy: "operator-synthetic" };
  assert.throws(() => createRefundRequest({ ...base, amountCents: 0 }), /positive integer/);
  assert.throws(() => createRefundRequest({ ...base, orderRef: undefined, amountCents: 100 }), /payment or order/);
  assert.throws(() => createRefundRequest({ ...base, requestedBy: " ", amountCents: 100 }), /requester identity/);
});

test("refund approval requires pending review, a human approval reference and evidence", () => {
  const request = createRefundRequest({
    candidateRef: "candidate-synthetic", orderRef: "order-synthetic", amountCents: 100,
    reason: "Duplicate charge", requestedBy: "operator-synthetic"
  });
  assert.equal(aiCanApproveRefund(), false);
  assert.throws(() => approveRefund({ ...request, approvalRef: "", evidenceRef: "evidence-synthetic" }), /human approval/);
  assert.throws(() => approveRefund({ ...request, approvalRef: "approval-synthetic", evidenceRef: "" }), /evidence/);
  const approved = approveRefund({ ...request, approvalRef: "approval-synthetic", evidenceRef: "evidence-synthetic" });
  assert.equal(approved.refundStatus, "APPROVED");
  assert.throws(() => approveRefund({ ...approved, approvalRef: "approval-again", evidenceRef: "evidence-synthetic" }), /pending review/);
});
