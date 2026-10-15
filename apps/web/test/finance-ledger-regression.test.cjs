const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const routePath = path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts");
const source = fs.readFileSync(routePath, "utf8");
const financeBlock = source.slice(source.indexOf('if (action === "addFinanceEntry")'), source.indexOf('if (action === "updateFinanceEntry")'));
const updateBlock = source.slice(source.indexOf('if (action === "updateFinanceEntry")'), source.indexOf('if (action === "deleteFinanceEntry")'));

test("finance entries allow only supported types and directions", () => {
  assert.match(financeBlock, /\["FEE", "PAYMENT", "REFUND", "ADJUSTMENT"\]/);
  assert.match(financeBlock, /\["IN", "OUT"\]/);
  assert.match(financeBlock, /valid entry type and money direction/);
});

test("finance entries reject invalid amounts and enforce the R10m ceiling", () => {
  assert.match(financeBlock, /Number\.isSafeInteger\(amountCents\)/);
  assert.match(financeBlock, /amountCents <= 0/);
  assert.match(financeBlock, /amountCents > 1000000000/);
});

test("transaction date validation checks format and actual calendar date", () => {
  assert.match(financeBlock, /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
  assert.match(financeBlock, /Date\.parse\(occurredOn \+ "T00:00:00Z"\)/);
  assert.match(financeBlock, /toISOString\(\)\.slice\(0, 10\) === occurredOn/);
});

test("confirmed status requires user-supplied reference or evidence", () => {
  assert.match(financeBlock, /status === "CONFIRMED" && !reference && !evidenceNote/);
  assert.match(updateBlock, /status === "CONFIRMED" && !reference && !evidenceNote && !existing\.reference && !existing\.evidenceNote/);
});

test("linked opportunities must belong to the loaded workspace and ledger is capped", () => {
  assert.match(financeBlock, /store\.opportunities\.some\(\(item\) => item\.opportunityId === opportunityId\)/);
  assert.match(financeBlock, /\.slice\(0, 1000\)/);
});

test("finance changes persist through the current workspace context", () => {
  assert.match(financeBlock, /await persistStore\(context, store\)/);
  assert.match(updateBlock, /await persistStore\(context, store\)/);
  assert.match(source, /financeLedger: Array\.isArray\(saved\.financeLedger\) \? saved\.financeLedger as FinanceLedgerEntry\[\] : \[\]/);
});

test("finance ledger is reconciliation-only, not payment processing", () => {
  assert.match(source, /does not charge money/);
  assert.match(source, /independently verify transactions/);
});
