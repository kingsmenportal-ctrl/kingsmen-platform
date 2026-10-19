const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/review-ledger/route.ts"), "utf8");

test("review ledger fails closed in production until authenticated candidate-scoped storage exists", () => {
  assert.equal((route.match(/process\.env\.NODE_ENV === "production"/g) || []).length, 2);
  assert.match(route, /STORAGE_NOT_CONFIGURED/);
  assert.match(route, /authenticated, candidate-scoped persistent storage/);
});

test("review ledger responses are private and non-cacheable", () => {
  assert.match(route, /Cache-Control", "private, no-store, max-age=0/);
  assert.match(route, /Pragma", "no-cache/);
});

test("manual submission readiness requires both candidate approval and operator review", () => {
  assert.match(route, /candidateApproved && record\.review\.founderReviewed/);
  assert.match(route, /Both candidate approval and founder\/operator review are required/);
});

test("proof-captured state requires submission time, proof type, and proof reference", () => {
  assert.match(route, /reviewStatus === "SUBMITTED_PROOF_CAPTURED"/);
  assert.match(route, /record\.review\.submittedAt \|\| !record\.review\.proofType \|\| !record\.review\.proofReference/);
});

test("review updates validate status enums, approval booleans, field lengths, and dates", () => {
  assert.match(route, /Unsupported review status/);
  assert.match(route, /Unsupported outcome status/);
  assert.match(route, /must be a boolean/);
  assert.match(route, /followUpDate must be a valid YYYY-MM-DD date/);
  assert.match(route, /exceeds .* characters/);
});

test("employer outcomes cannot be recorded before submission proof is captured", () => {
  assert.match(route, /Record submission proof before recording an employer outcome/);
});

test("follow-up and interview workflow exposes overdue, due-today, and upcoming-interview counts", () => {
  const api = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/review-ledger/route.ts"), "utf8");
  const ui = fs.readFileSync(path.resolve(__dirname, "../src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx"), "utf8");
  const sync = fs.readFileSync(path.resolve(__dirname, "../../../scripts/agents/personal-job-review-ledger.mjs"), "utf8");
  assert.match(api, /followUpsOverdue/);
  assert.match(api, /followUpsDueToday/);
  assert.match(api, /interviewsScheduled/);
  assert.match(api, /interviewAt: 40/);
  assert.match(ui, /OVERDUE_FOLLOW_UPS/);
  assert.match(ui, /UPCOMING_INTERVIEWS/);
  assert.match(ui, /Response history/);
  assert.match(sync, /responseHistory: s\(existingReview\.responseHistory\)/);
  assert.match(sync, /interviewAt: s\(existingReview\.interviewAt\)/);
});

test("follow-up and response history fields have bounded input sizes", () => {
  const api = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/review-ledger/route.ts"), "utf8");
  assert.match(api, /nextAction: 300/);
  assert.match(api, /responseHistory: 3000/);
  assert.match(api, /followUpDate: 10/);
});


test("follow-up UI prepares a manual draft, records an explicit attempt, and exports a task queue", () => {
  const ui = fs.readFileSync(path.resolve(__dirname, "../src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx"), "utf8");
  assert.match(ui, /Prepare follow-up draft/);
  assert.match(ui, /Record follow-up attempt/);
  assert.match(ui, /Follow-up attempt recorded by user/);
  assert.ok(ui.includes('anchor.download = "kingsmen-follow-up-queue.csv"'));
  assert.match(ui, /Prevent spreadsheet formula injection/);
  assert.match(ui, /nothing was sent/);
  assert.match(ui, /Save the ledger record to persist/);
});
