const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  createLedgerEntry,
  assertLedgerBalancedForPayment
} = require("../dist/finance/finance-ledger");

function entry(overrides = {}) {
  return createLedgerEntry({
    entryType: "PAYMENT_RECEIVED",
    debitCents: 10000,
    creditCents: 10000,
    description: "Test-only balanced ledger entry",
    ...overrides
  });
}

test("ledger entries are denominated in ZAR and preserve integer cents", () => {
  const value = entry({ debitCents: 12550, creditCents: 12550 });
  assert.equal(value.currency, "ZAR");
  assert.equal(value.debitCents, 12550);
  assert.equal(value.creditCents, 12550);
  assert.match(value.ledgerRef, /^ledger_/);
});

test("ledger entry creation rejects negative debit or credit amounts", () => {
  assert.throws(() => entry({ debitCents: -1 }), /cannot be negative/i);
  assert.throws(() => entry({ creditCents: -1 }), /cannot be negative/i);
});

test("ledger entry creation rejects blank descriptions", () => {
  assert.throws(() => entry({ description: "   " }), /requires description/i);
});

test("balanced payment ledger has equal debit and credit totals", () => {
  const entries = [
    entry({ entryType: "PAYMENT_RECEIVED", debitCents: 10000, creditCents: 0 }),
    entry({ entryType: "ADJUSTMENT", debitCents: 0, creditCents: 10000 })
  ];
  assert.doesNotThrow(() => assertLedgerBalancedForPayment(entries));
});

test("unbalanced payment ledger is rejected", () => {
  const entries = [
    entry({ debitCents: 10000, creditCents: 0 }),
    entry({ debitCents: 0, creditCents: 9999 })
  ];
  assert.throws(() => assertLedgerBalancedForPayment(entries), /not balanced/i);
});

// These TODOs deliberately keep the finance gate honest: the current finance module
// does not yet expose idempotency persistence, PayFast signature verification, or a
// refund-reversal posting API. Add implementation-backed tests before calling this
// component complete.
test.todo("idempotency key prevents duplicate posting across retries");
test.todo("PayFast ITN signature verification accepts valid and rejects tampered payloads");
test.todo("completed refund posts a balanced reversal linked to the original payment");
