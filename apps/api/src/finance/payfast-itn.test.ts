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
  ipValid: true
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

  const unverified = validatePayFastItn({ ...base, ipValid: false, payload: signedPayload() });
  assert.equal(unverified.accepted, false);
  assert.match(unverified.rejectionReason ?? "", /IP\/source/i);
});

test("rejects invalid-length signatures without throwing", () => {
  const result = validatePayFastItn({
    ...base, payload: { ...signedPayload(), signature: "abc" }
  });
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
    ...base,
    payload: signedPayload({ m_payment_id: "ord_other_synthetic_002" })
  });
  assert.equal(result.accepted, false);
  assert.match(result.rejectionReason ?? "", /reference mismatch/i);
});
