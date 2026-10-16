import test from "node:test";
import assert from "node:assert/strict";
import { parsePayFastItnForm } from "./payfast-itn-route";

test("parses a normal URL-encoded ITN payload", () => {
  const fields = parsePayFastItnForm("m_payment_id=ord_synthetic_001&item_name=CV+Revamp&amount_gross=49.99");
  assert.equal(fields.m_payment_id, "ord_synthetic_001");
  assert.equal(fields.item_name, "CV Revamp");
  assert.equal(fields.amount_gross, "49.99");
});

test("rejects duplicate keys to prevent ambiguous signature interpretation", () => {
  assert.throws(
    () => parsePayFastItnForm("m_payment_id=ord_a&m_payment_id=ord_b"),
    /DUPLICATE_ITN_FIELD/
  );
});

test("preserves a signature field for server-side confirmation", () => {
  const fields = parsePayFastItnForm("m_payment_id=ord_synthetic_001&signature=0123456789abcdef0123456789abcdef");
  assert.equal(fields.signature, "0123456789abcdef0123456789abcdef");
});
