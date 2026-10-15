const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const helper = fs.readFileSync(path.resolve(__dirname, "../src/lib/candidate-finance-ledger.ts"), "utf8");

test("API route delegates finance validation to shared tested helpers", () => {
  assert.match(route, /validateFinanceEntryInput\(/);
  assert.match(route, /validateFinanceStatusUpdate\(/);
  assert.match(route, /@\/lib\/candidate-finance-ledger/);
});

test("shared finance helper contains strict allowlists and amount ceiling", () => {
  assert.match(helper, /FINANCE_ENTRY_TYPES = \["FEE", "PAYMENT", "REFUND", "ADJUSTMENT"\]/);
  assert.match(helper, /FINANCE_DIRECTIONS = \["IN", "OUT"\]/);
  assert.match(helper, /FINANCE_STATUSES = \["RECORDED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED"\]/);
  assert.match(helper, /FINANCE_MAX_AMOUNT_CENTS = 1_000_000_000/);
});

test("finance mutations persist through the authenticated workspace boundary", () => {
  const add = route.split('if (action === "addFinanceEntry") {')[1]?.split('if (action === "updateFinanceEntry") {')[0] || "";
  const update = route.split('if (action === "updateFinanceEntry") {')[1]?.split('if (action === "deleteFinanceEntry") {')[0] || "";
  const remove = route.split('if (action === "deleteFinanceEntry") {')[1]?.split('if (action === "addContactLog") {')[0] || "";
  assert.match(add, /await persistStore\(context, store\)/);
  assert.match(update, /await persistStore\(context, store\)/);
  assert.match(remove, /await persistStore\(context, store\)/);
});

test("ledger caps entries, checks linked opportunities and supports deletion", () => {
  const add = route.split('if (action === "addFinanceEntry") {')[1]?.split('if (action === "updateFinanceEntry") {')[0] || "";
  const remove = route.split('if (action === "deleteFinanceEntry") {')[1]?.split('if (action === "addContactLog") {')[0] || "";
  assert.match(add, /store\.opportunities\.some\(\(item\) => item\.opportunityId === opportunityId\)/);
  assert.match(add, /\.slice\(0, 1000\)/);
  assert.match(remove, /FINANCE_ENTRY_DELETED/);
});

test("candidate finance ledger is tracking only and does not process payments", () => {
  const ui = fs.readFileSync(path.resolve(__dirname, "../src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"), "utf8");
  assert.match(ui, /does not charge money/i);
  assert.match(ui, /independently verify transactions/i);
});
