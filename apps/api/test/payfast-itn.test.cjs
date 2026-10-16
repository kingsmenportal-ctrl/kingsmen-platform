const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { verifyPayFastItn, parsePayFastFormBody } = require("../dist/components/payfast-itn.js");

function enc(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+")
    .replace(/%[0-9a-f]{2}/gi, e => e.toUpperCase());
}
function sign(parameters, passphrase) {
  const parts = Object.entries(parameters).filter(([,v]) => v !== "").map(([k,v]) => `${k}=${enc(v)}`);
  return createHash("md5").update(`${parts.join("&")}&passphrase=${enc(passphrase)}`).digest("hex");
}
function fixture() {
  const p = {
    merchant_id: "10000100",
    m_payment_id: "invoice-0001",
    pf_payment_id: "123456789",
    payment_status: "COMPLETE",
    item_name: "Kingsmen Invoice",
    amount_gross: "125.50"
  };
  p.signature = sign(p, "test passphrase");
  return p;
}

test("ITN verifier requires signature, merchant, reference, status, amount and VALID server confirmation", async () => {
  const parameters = fixture();
  const verified = await verifyPayFastItn(parameters, { paymentRef: "invoice-0001", amountCents: 12550 }, {
    merchantId: "10000100", passphrase: "test passphrase", environment: "sandbox"
  }, async (url, init) => {
    assert.equal(url, "https://sandbox.payfast.co.za/eng/query/validate");
    assert.equal(init.method, "POST");
    return new Response("VALID", { status: 200 });
  });
  assert.equal(verified.paymentRef, "invoice-0001");
  assert.equal(verified.providerPaymentId, "123456789");
  assert.equal(verified.amountCents, 12550);
});

test("ITN verifier rejects invalid signature and non-VALID server confirmation", async () => {
  const parameters = fixture();
  parameters.amount_gross = "1.00";
  await assert.rejects(() => verifyPayFastItn(parameters, { paymentRef: "invoice-0001", amountCents: 12550 }, {
    merchantId: "10000100", passphrase: "test passphrase", environment: "sandbox"
  }, async () => new Response("VALID", { status: 200 })), /PAYFAST_SIGNATURE_INVALID/);

  const valid = fixture();
  await assert.rejects(() => verifyPayFastItn(valid, { paymentRef: "invoice-0001", amountCents: 12550 }, {
    merchantId: "10000100", passphrase: "test passphrase", environment: "sandbox"
  }, async () => new Response("INVALID", { status: 200 })), /PAYFAST_CONFIRMATION_INVALID/);
});

test("ITN parser rejects duplicate fields and requires signature", () => {
  assert.throws(() => parsePayFastFormBody("m_payment_id=a&m_payment_id=b&signature=x"), /PAYFAST_DUPLICATE_PARAMETER/);
  assert.throws(() => parsePayFastFormBody("m_payment_id=a"), /PAYFAST_SIGNATURE_MISSING/);
  assert.equal(parsePayFastFormBody("m_payment_id=abc&signature=deadbeef").m_payment_id, "abc");
});
