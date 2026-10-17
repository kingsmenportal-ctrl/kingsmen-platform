import test from "node:test";
import assert from "node:assert/strict";
import { reconcilePayFastAmounts } from "./payfast-amounts";

test("accepts matching gross and negative provider fee reconciled to net", () => {
  const result = reconcilePayFastAmounts("49.99", "-2.00", "47.99", 4999);
  assert.equal(result.valid, true);
  assert.equal(result.grossCents, 4999);
  assert.equal(result.feeCents, -200);
  assert.equal(result.netCents, 4799);
});

test("rejects gross amount that differs from the locked order amount", () => {
  const result = reconcilePayFastAmounts("50.00", "-2.00", "48.00", 4999);
  assert.equal(result.valid, false);
  assert.match(result.reason ?? "", /does not match the order/i);
});

test("rejects internally inconsistent gross, fee, and net", () => {
  const result = reconcilePayFastAmounts("49.99", "-2.00", "49.00", 4999);
  assert.equal(result.valid, false);
  assert.match(result.reason ?? "", /does not equal net/i);
});

test("rejects missing, malformed, over-precision, and unsafe values", () => {
  for (const values of [
    [undefined, "-1.00", "48.99"],
    ["49,99", "-1.00", "48.99"],
    ["49.999", "-1.00", "48.99"],
    ["49.99", "fee", "48.99"],
    ["49.99", "-1.00", "48.00"]
  ]) {
    assert.equal(reconcilePayFastAmounts(values[0], values[1], values[2], 4999).valid, false);
  }
  assert.equal(reconcilePayFastAmounts("49.99", "-1.00", "48.99", Number.MAX_SAFE_INTEGER + 1).valid, false);
});
