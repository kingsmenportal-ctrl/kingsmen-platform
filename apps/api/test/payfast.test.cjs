const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const {
  verifyPayFastSignature,
  assertPayFastAmountMatches,
  assertPayFastItnMatches
} = require("../dist/components/payfast.js");

function urlEncode(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+")
    .replace(/%[0-9a-f]{2}/gi, (escape) => escape.toUpperCase());
}
function signature(parameters, passphrase) {
  const pairs = Object.entries(parameters)
    .filter(([, value]) => String(value).trim() !== "")
    .map(([key, value]) => `${key}=${urlEncode(String(value).trim())}`);
  return createHash("md5")
    .update(`${pairs.join("&")}&passphrase=${urlEncode(passphrase)}`)
    .digest("hex");
}

test("PayFast ITN signature preserves received order and validates valid signature", () => {
  const parameters = { merchant_id: "100100", m_payment_id: "inv-123", item_name: "Kingsmen Portal", amount_gross: "500.00" };
  assert.equal(verifyPayFastSignature(parameters, signature(parameters, "test salt"), "test salt"), true);
});

test("PayFast ITN signature rejects changed payload, missing secret and malformed signature", () => {
  const parameters = { merchant_id: "100100", m_payment_id: "inv-123", amount_gross: "500.00" };
  const valid = signature(parameters, "test salt");
  assert.equal(verifyPayFastSignature({ ...parameters, amount_gross: "5.00" }, valid, "test salt"), false);
  assert.equal(verifyPayFastSignature(parameters, valid, ""), false);
  assert.equal(verifyPayFastSignature(parameters, "nope", "test salt"), false);
});

test("PayFast amount comparison uses exact integer ZAR cents", () => {
  assert.doesNotThrow(() => assertPayFastAmountMatches(50000, "500.00"));
  assert.throws(() => assertPayFastAmountMatches(50000, "499.99"), /PAYFAST_AMOUNT_MISMATCH/);
  assert.throws(() => assertPayFastAmountMatches(50000, "500"), /INVALID_PAYFAST_AMOUNT/);
});

test("ITN business checks require expected merchant, reference, COMPLETE status and amount", () => {
  const valid = {
    merchantId: "100100", expectedMerchantId: "100100", paymentStatus: "COMPLETE",
    expectedPaymentRef: "inv-123", paymentRef: "inv-123", expectedCents: 50000, grossAmount: "500.00"
  };
  assert.doesNotThrow(() => assertPayFastItnMatches(valid));
  assert.throws(() => assertPayFastItnMatches({ ...valid, merchantId: "other" }), /PAYFAST_MERCHANT_MISMATCH/);
  assert.throws(() => assertPayFastItnMatches({ ...valid, paymentRef: "other" }), /PAYFAST_PAYMENT_REFERENCE_MISMATCH/);
  assert.throws(() => assertPayFastItnMatches({ ...valid, paymentStatus: "PENDING" }), /PAYFAST_PAYMENT_NOT_COMPLETE/);
  assert.throws(() => assertPayFastItnMatches({ ...valid, grossAmount: "499.00" }), /PAYFAST_AMOUNT_MISMATCH/);
});
