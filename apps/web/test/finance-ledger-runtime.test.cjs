const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const helperUrl = pathToFileURL(path.resolve(__dirname, "../src/lib/candidate-finance-ledger.ts")).href;
let finance;
test("load shared finance validation implementation", async () => {
  finance = await import(helperUrl);
  assert.equal(typeof finance.validateFinanceEntryInput, "function");
  assert.equal(typeof finance.validateFinanceStatusUpdate, "function");
});

const validEntry = () => ({
  type: "PAYMENT", direction: "IN", status: "RECORDED", amountCents: 12500,
  description: "Application fee", reference: "REF-123", evidenceNote: "",
  opportunityId: "opp-1", occurredOn: "2026-10-15"
});

test("accepts a valid ledger entry with ZAR integer cents", async () => {
  const f = finance || await import(helperUrl);
  assert.equal(f.validateFinanceEntryInput(validEntry()), null);
});

test("rejects unsupported entry type and direction", async () => {
  const f = finance || await import(helperUrl);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), type: "CRYPTO" }), /valid entry type/);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), direction: "SIDEWAYS" }), /valid entry type/);
});

test("rejects zero, negative, fractional, unsafe and over-limit amounts", async () => {
  const f = finance || await import(helperUrl);
  for (const amountCents of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 1_000_000_001, "100"]) {
    assert.match(f.validateFinanceEntryInput({ ...validEntry(), amountCents }), /Amount must be positive integer cents/);
  }
  assert.equal(f.validateFinanceEntryInput({ ...validEntry(), amountCents: 1_000_000_000 }), null);
});

test("rejects malformed and impossible calendar dates", async () => {
  const f = finance || await import(helperUrl);
  for (const occurredOn of ["15-10-2026", "2026-02-29", "2026-13-01", "2026-04-31", ""]) {
    assert.match(f.validateFinanceEntryInput({ ...validEntry(), occurredOn }), /valid transaction date/);
  }
  assert.equal(f.validateFinanceEntryInput({ ...validEntry(), occurredOn: "2024-02-29" }), null);
});

test("confirmed status requires a reference or evidence note", async () => {
  const f = finance || await import(helperUrl);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), status: "CONFIRMED", reference: "", evidenceNote: "" }), /reference or evidence note/);
  assert.equal(f.validateFinanceEntryInput({ ...validEntry(), status: "CONFIRMED", reference: "BANK-123" }), null);
  assert.equal(f.validateFinanceEntryInput({ ...validEntry(), status: "CONFIRMED", reference: "", evidenceNote: "Checked statement" }), null);
});

test("rejects unknown status and overlong fields", async () => {
  const f = finance || await import(helperUrl);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), status: "SETTLED" }), /valid ledger status/);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), description: "x".repeat(181) }), /Description must be/);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), reference: "x".repeat(121) }), /Description must be/);
  assert.match(f.validateFinanceEntryInput({ ...validEntry(), evidenceNote: "x".repeat(1001) }), /Description must be/);
});

test("status updates require valid status and evidence for first confirmation", async () => {
  const f = finance || await import(helperUrl);
  assert.match(f.validateFinanceStatusUpdate({ status: "SETTLED" }), /valid ledger status/);
  assert.match(f.validateFinanceStatusUpdate({ status: "CONFIRMED" }), /reference or evidence note/);
  assert.equal(f.validateFinanceStatusUpdate({ status: "CONFIRMED", existingReference: "BANK-1" }), null);
  assert.equal(f.validateFinanceStatusUpdate({ status: "PENDING" }), null);
});

test("status updates enforce evidence length limits", async () => {
  const f = finance || await import(helperUrl);
  assert.match(f.validateFinanceStatusUpdate({ status: "PENDING", reference: "x".repeat(121) }), /Reference max 120/);
  assert.match(f.validateFinanceStatusUpdate({ status: "PENDING", evidenceNote: "x".repeat(1001) }), /Reference max 120/);
});

test("API route calls shared validators and persists finance mutations", async () => {
  const fs = require("node:fs");
  const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
  assert.match(route, /validateFinanceEntryInput\(/);
  assert.match(route, /validateFinanceStatusUpdate\(/);
  assert.match(route, /await persistStore\(context, store\)/);
  assert.match(route, /FINANCE_ENTRY_CREATED/);
  assert.match(route, /FINANCE_ENTRY_UPDATED/);
  assert.match(route, /FINANCE_ENTRY_DELETED/);
});
