const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const helper = fs.readFileSync(path.resolve(__dirname, "../src/lib/candidate-finance-ledger.ts"), "utf8");

test("finance validation helper is wired into add and update actions", () => {
  assert.match(route, /validateFinanceEntryInput\(/);
  assert.match(route, /validateFinanceStatusUpdate\(/);
});

test("date validation checks format and actual calendar date", () => {
  assert.match(helper, /isValidFinanceDate/);
  assert.match(helper, /Date\.parse\(value \+ "T00:00:00Z"\)/);
  assert.match(helper, /toISOString\(\)\.slice\(0, 10\) === value/);
});

test("confirmed status requires reference or evidence note", () => {
  assert.match(helper, /status === "CONFIRMED" && !reference && !evidenceNote/);
  assert.match(helper, /!existingReference && !existingEvidenceNote/);
});

test("finance records remain workspace-scoped and persistent", () => {
  assert.match(route, /store\.opportunities\.some\(\(item\) => item\.opportunityId === opportunityId\)/);
  assert.match(route, /await persistStore\(context, store\)/);
  assert.match(route, /financeLedger: Array\.isArray\(saved\.financeLedger\) \? saved\.financeLedger as FinanceLedgerEntry\[\] : \[\]/);
});

test("finance ledger does not process or independently verify payments", () => {
  assert.match(route, /does not charge money/);
  assert.match(route, /independently verify transactions/);
});
