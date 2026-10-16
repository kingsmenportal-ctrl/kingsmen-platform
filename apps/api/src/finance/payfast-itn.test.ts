import test from "node:test";
import assert from "node:assert/strict";
import { validatePayFastItn } from "./payfast-itn";
import { createPayFastSignature, type PayFastFields } from "./payfast-signature";

function signedPayload(overrides: PayFastFields = {}): PayFastFields {
  const payload: PayFastFields = {
    m_payment_id: "ord_synthetic_001",
    pf_payment_id: "pf_synthetic_001",
    payment_status: "COMPLETE",
    amount_gross: "49.99",
    ...overrides
  };
  payload.signature = createPayFastSignature(payload, "synthetic-passphrase");
  return payload;
}

const base = {
  expectedMerchantReference: "ord_synthetic_001",
  expectedAmountCents: 4999,
  passphrase: "synthetic-passphrase",
  remoteAddress: "203.0.113.7",
  allowedSourceIps: "203.0.113.7",
  idempotencyCheckCompleted: true
};

test("accepts only a complete, signed, matching ITN with provider payment ID and verified source", () => {
  const result = validatePayFastItn({ ...base, payload: signedPayload() });
  assert.equal(result.accepted, true);
  assert.equal(result.amountValid, true);
  assert.equal(result.signatureValid, true);
});

test("rejects a missing provider payment ID even when the payload signature is valid", () => {
  const result = validatePayFastItn({ ...base, payload: signedPayload({ pf_payment_id: "" }) });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /provider payment ID/i);
});

test("rejects malformed amounts and non-positive expected amounts", () => {
  const malformed = validatePayFastItn({ ...base, payload: signedPayload({ amount_gross: "NaN" }) });
  assert.equal(malformed.accepted, false);
  assert.equal(malformed.amountValid, false);

  const zeroExpected = validatePayFastItn({
    ...base, expectedAmountCents: 0, payload: signedPayload({ amount_gross: "0.00" })
  });
  assert.equal(zeroExpected.accepted, false);
  assert.equal(zeroExpected.amountValid, false);
});

test("rejects duplicate notifications and unverified source IPs", () => {
  const duplicate = validatePayFastItn({ ...base, duplicate: true, payload: signedPayload() });
  assert.equal(duplicate.accepted, false);
  assert.match(duplicate.rejectionReason ?? "", /Duplicate/i);

  const unverified = validatePayFastItn({ ...base, remoteAddress: "203.0.113.8", payload: signedPayload() });
  assert.equal(unverified.accepted, false);
  assert.match(unverified.rejectionReason ?? "", /IP\/source/i);
});

test("rejects invalid-length signatures without throwing", () => {
  const result = validatePayFastItn({ ...base, payload: { ...signedPayload(), signature: "abc" } });
  assert.equal(result.accepted, false);
  assert.equal(result.signatureValid, false);
});

test("rejects locale commas and amounts with more than two decimal places", () => {
  for (const amount of ["49,99", "49.999", "4.999e1", "+49.99"]) {
    const result = validatePayFastItn({ ...base, payload: signedPayload({ amount_gross: amount }) });
    assert.equal(result.accepted, false, `unexpected acceptance for ${amount}`);
    assert.equal(result.amountValid, false, `unexpected amount validity for ${amount}`);
  }
});

test("rejects a signed notification for a different order reference", () => {
  const result = validatePayFastItn({
    ...base, payload: signedPayload({ m_payment_id: "ord_other_synthetic_002" })
  });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /reference mismatch/i);
});

test("fails closed until durable ITN idempotency lookup completes", () => {
  const result = validatePayFastItn({ ...base, idempotencyCheckCompleted: false, payload: signedPayload() });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /idempotency check has not been completed/i);
});

test("rejects a correctly signed notification whose payment status is not COMPLETE", () => {
  const result = validatePayFastItn({ ...base, payload: signedPayload({ payment_status: "PENDING" }) });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /not COMPLETE/i);
});

test("rejects a modified payload when the signature no longer matches", () => {
  const payload = signedPayload();
  payload.amount_gross = "50.00";
  const result = validatePayFastItn({ ...base, payload });
  assert.equal(result.accepted, false);
  assert.equal(result.signatureValid, false);
});

test("rejects a valid signature when source IP allowlist is missing", () => {
  const result = validatePayFastItn({ ...base, allowedSourceIps: "", payload: signedPayload() });
  assert.equal(result.accepted, false);
  assert.equal(result.ipValid, false);
});

test("rejects a valid signature when gross amount does not equal the trusted order amount", () => {
  const result = validatePayFastItn({ ...base, payload: signedPayload({ amount_gross: "50.00" }) });
  assert.equal(result.accepted, false);
  assert.equal(result.amountValid, false);
  assert.match(result.rejectionReason ?? "", /amount mismatch/i);
});

test("rejects a missing expected merchant reference and a missing provider reference", () => {
  const noExpectedReference = validatePayFastItn({
    ...base, expectedMerchantReference: "", payload: signedPayload()
  });
  assert.equal(noExpectedReference.accepted, false);
  assert.match(noExpectedReference.rejectionReason ?? "", /reference mismatch/i);

  const noProviderReference = validatePayFastItn({
    ...base, payload: signedPayload({ m_payment_id: "" })
  });
  assert.equal(noProviderReference.accepted, false);
});

test("defaults to fail-closed when durable idempotency confirmation is omitted", () => {
  const { idempotencyCheckCompleted: _notProvided, ...withoutIdempotencyProof } = base;
  const result = validatePayFastItn({ ...withoutIdempotencyProof, payload: signedPayload() });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /idempotency check has not been completed/i);
});

test("idempotency key distinguishes provider payment IDs and status transitions", () => {
  const complete = validatePayFastItn({ ...base, payload: signedPayload() });
  const pending = validatePayFastItn({ ...base, payload: signedPayload({ payment_status: "PENDING" }) });
  const anotherProviderId = validatePayFastItn({
    ...base, payload: signedPayload({ pf_payment_id: "pf_synthetic_002" })
  });
  assert.notEqual(complete.idempotencyKey, pending.idempotencyKey);
  assert.notEqual(complete.idempotencyKey, anotherProviderId.idempotencyKey);
});
