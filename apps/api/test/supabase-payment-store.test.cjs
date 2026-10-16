const test = require("node:test");
const assert = require("node:assert/strict");
const { SupabasePaymentCallbackStore } = require("../dist/components/supabase-payment-store.js");

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("payment store resolves the expected amount and invoice from the trusted RPC", async () => {
  let request;
  const store = new SupabasePaymentCallbackStore(
    { url: "https://example.supabase.co", serviceRoleKey: "test-service-role-secret" },
    async (url, init) => {
      request = { url: String(url), init };
      return response([{ invoice_id: "invoice-id", payment_reference: "INV-123", amount_cents: 9000, currency: "ZAR", invoice_status: "issued" }]);
    }
  );
  const invoice = await store.findExpectedPayment("INV-123");
  assert.equal(invoice.invoiceId, "invoice-id");
  assert.equal(invoice.amountCents, 9000);
  assert.equal(invoice.status, "issued");
  assert.match(request.url, /rpc\/payfast_expected_payment$/);
  assert.equal(request.init.headers.apikey, "test-service-role-secret");
});

test("payment store fails closed if the RPC migration is not installed", async () => {
  const store = new SupabasePaymentCallbackStore(
    { url: "https://example.supabase.co", serviceRoleKey: "test-service-role-secret" },
    async () => response({ message: "function not found" }, 404)
  );
  await assert.rejects(() => store.findExpectedPayment("INV-123"), /PAYMENT_DATABASE_SCHEMA_NOT_READY/);
});

test("payment store sends only verified transaction fields to atomic commit RPC", async () => {
  let captured;
  const store = new SupabasePaymentCallbackStore(
    { url: "https://example.supabase.co", serviceRoleKey: "test-service-role-secret" },
    async (url, init) => {
      captured = { url: String(url), body: JSON.parse(init.body) };
      return response([{ outcome: "recorded", payment_id: "payment-id", invoice_status: "paid" }]);
    }
  );
  const result = await store.commitVerifiedPayment({
    invoiceId: "invoice-id", paymentRef: "INV-123", provider: "payfast",
    providerPaymentId: "123456", amountCents: 9000, currency: "ZAR",
    eventFingerprint: "a".repeat(64), rawNotification: { signature: "never-send-to-rpc" }
  });
  assert.equal(result.outcome, "recorded");
  assert.match(captured.url, /rpc\/commit_verified_payfast_payment$/);
  assert.equal(captured.body.p_amount_cents, 9000);
  assert.equal(Object.values(captured.body).includes("never-send-to-rpc"), false);
});
