const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const routePath = path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts");
const route = fs.readFileSync(routePath, "utf8");
const addBlock = route.split('if (action === "addFinanceEntry") {')[1]?.split('if (action === "updateFinanceEntry") {')[0] || "";
const updateBlock = route.split('if (action === "updateFinanceEntry") {')[1]?.split('if (action === "deleteFinanceEntry") {')[0] || "";
const deleteBlock = route.split('if (action === "deleteFinanceEntry") {')[1]?.split('if (action === "addContactLog") {')[0] || "";

test("finance ledger validates allowed entry type and direction", () => {
  assert.match(addBlock, /\["FEE", "PAYMENT", "REFUND", "ADJUSTMENT"\]/);
  assert.match(addBlock, /\["IN", "OUT"\]/);
});

test("finance ledger rejects non-integer, non-positive and over-limit amounts", () => {
  assert.match(addBlock, /Number\.isSafeInteger\(amountCents\)/);
  assert.match(addBlock, /amountCents <= 0/);
  assert.match(addBlock, /amountCents > 1000000000/);
});

test("finance ledger validates real calendar dates rather than date-shaped strings only", () => {
  assert.match(addBlock, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
  assert.match(addBlock, /Date\.parse\(occurredOn \+ "T00:00:00Z"\)/);
  assert.match(addBlock, /toISOString\(\)\.slice\(0, 10\) === occurredOn/);
});

test("confirmed entries require reference or evidence note on creation and update", () => {
  assert.match(addBlock, /status === "CONFIRMED" && !reference && !evidenceNote/);
  assert.match(updateBlock, /status === "CONFIRMED" && !reference && !evidenceNote && !existing\.reference && !existing\.evidenceNote/);
});

test("finance updates restrict status values and bound evidence fields", () => {
  assert.match(updateBlock, /\["RECORDED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED"\]/);
  assert.match(updateBlock, /reference\.length > 120/);
  assert.match(updateBlock, /evidenceNote\.length > 1000/);
  assert.match(updateBlock, /entry\.entryId === entryId/);
});

test("linked opportunities must exist in the same loaded workspace", () => {
  assert.match(addBlock, /store\.opportunities\.some\(\(item\) => item\.opportunityId === opportunityId\)/);
  assert.match(updateBlock, /find\(\(entry\) => entry\.entryId === entryId\)/);
});

test("ledger changes persist through the authenticated workspace persistence boundary", () => {
  assert.match(addBlock, /await persistStore\(context, store\)/);
  assert.match(updateBlock, /await persistStore\(context, store\)/);
  assert.match(deleteBlock, /await persistStore\(context, store\)/);
});

test("ledger caps stored entries and supports explicit deletion", () => {
  assert.match(addBlock, /\.slice\(0, 1000\)/);
  assert.match(deleteBlock, /filter\(\(entry\) => entry\.entryId !== entryId\)/);
  assert.match(deleteBlock, /FINANCE_ENTRY_DELETED/);
});

test("candidate finance ledger is tracking only and does not process payments", () => {
  const uiPath = path.resolve(__dirname, "../src/app/personal-job-desk/apply-now/ApplyNowClient.tsx");
  const ui = fs.readFileSync(uiPath, "utf8");
  assert.match(ui, /does not charge money/i);
  assert.match(ui, /independently verify transactions/i);
});
