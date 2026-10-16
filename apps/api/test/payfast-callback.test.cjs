const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { processPayFastCallback } = require("../dist/components/payfast-callback.js");

function enc(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+").replace(/%[0-9a-f]{2}/gi, e => e.toUpperCase());
}
function bodyWithSignature(overrides = {}) {
  const p = {
    merchant_id: "10000100", m_payment_id: "invoice-0001", pf_payment_id: "123456789",
    payment_status: "COMPLETE", item_name: "Kingsmen invoice", amount_gross: "125.50", ...overrides
  };
  const canonical = Object.entries(p).map(([k,v]) => `${k}=${enc(v)}`).join("&");
  p.signature = createHash("md5").update(`${canonical}&passphrase=${enc("test passphrase")}`).digest("hex");
  return Object.entries(p).map(([k,v]) => `${enc(k)}=${enc(v)}`).join("&");
}
function store(overrides = {}) {
  const calls = [];
  return {
    calls,
    async findExpectedPayment(ref) {
      calls.push(["lookup", ref]);
      return overrides.expected === undefined ? {
        invoiceId: "invoice-uuid", paymentRef: "invoice-0001", amountCents: 12550, currency: "ZAR", status: "issued"
      } : overrides.expected;
    },
    async commitVerifiedPayment(input) {
      calls.push(["commit", input]);
      if (overrides.commit) return overrides.commit;
      return { outcome: "recorded", paymentId: "payment-uuid", invoiceStatus: "paid" };
    }
  };
}
const config = { merchantId: "10000100", passphrase: "test passphrase", environment: "sandbox" };
const validFetcher = async () => new Response("VALID", { status: 200 });

test("callback looks up trusted invoice and commits only after PayFast confirmation", async () => {
  const db = store();
  const result = await processPayFastCallback(bodyWithSignature(), config, db, validFetcher);
  assert.equal(result.status, 202);
  assert.equal(result.body.outcome, "recorded");
  assert.equal(db.calls.filter(c => c[0] === "commit").length, 1);
  assert.equal(db.calls[1][1].invoiceId, "invoice-uuid");
  assert.equal(db.calls[1][1].amountCents, 12550);
});

test("callback does not commit when invoice is missing or not payable", async () => {
  const missing = store({ expected: null });
  await assert.rejects(() => processPayFastCallback(bodyWithSignature(), config, missing, validFetcher), /PAYFAST_INVOICE_NOT_FOUND/);
  assert.equal(missing.calls.some(c => c[0] === "commit"), false);

  const paid = store({ expected: { invoiceId: "i", paymentRef: "invoice-0001", amountCents: 12550, currency: "ZAR", status: "paid" } });
  await assert.rejects(() => processPayFastCallback(bodyWithSignature(), config, paid, validFetcher), /PAYFAST_INVOICE_NOT_PAYABLE/);
  assert.equal(paid.calls.some(c => c[0] === "commit"), false);
});

test("callback does not commit when PayFast server confirmation fails", async () => {
  const db = store();
  await assert.rejects(() => processPayFastCallback(bodyWithSignature(), config, db, async () => new Response("INVALID", { status: 200 })), /PAYFAST_CONFIRMATION_INVALID/);
  assert.equal(db.calls.some(c => c[0] === "commit"), false);
});

test("callback returns duplicate outcome from atomic persistence layer", async () => {
  const db = store({ commit: { outcome: "duplicate", paymentId: "payment-existing", invoiceStatus: "paid" } });
  const result = await processPayFastCallback(bodyWithSignature(), config, db, validFetcher);
  assert.equal(result.status, 200);
  assert.equal(result.body.outcome, "duplicate");
});
