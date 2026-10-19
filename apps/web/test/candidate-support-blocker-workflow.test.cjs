const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/support/page.tsx"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/dashboard/page.tsx"), "utf8");
const supportMigration = fs.readFileSync(path.join(root, "db/migrations/0023_support_operations_audit.sql"), "utf8");

test("support requests capture bounded blocker context and retain a candidate-visible timeline", () => {
  assert.match(route, /action === "createSupportRequest"/);
  for (const marker of ["affectedWorkflow", "deadlineDate", "blockerImpact", "KINGSMEN_SUPPORT_UNASSIGNED", "REQUEST_CREATED", "history:"]) {
    assert.ok(route.includes(marker), `support API missing ${marker}`);
  }
  assert.match(route, /history: \[\.\.\.\(Array\.isArray\(existing\.history\) \? existing\.history : \[\]\),/);
  assert.match(route, /\.slice\(-100\)/);
});

test("candidate can append updates and reopen resolved or closed support requests without impersonating operators", () => {
  assert.match(route, /action === "updateSupportRequest"/);
  assert.match(route, /"ADD_UPDATE", "REOPEN", "CANDIDATE_CONFIRMS_RESOLVED"/);
  assert.match(route, /Only a resolved or closed request can be reopened/);
  assert.match(route, /Only an operator-resolved request can be confirmed resolved/);
  assert.match(route, /eventType = requestedAction === "REOPEN" \? "CANDIDATE_REOPENED" : "CANDIDATE_UPDATE"/);
  assert.match(page, /Reopen request/);
  assert.match(page, /cannot impersonate staff or mark a request resolved/);
});

test("support UI presents active queue, urgency triage, impact fields, and request history", () => {
  for (const marker of [
    "Support & blocker resolution", "Deadline at risk", "Affected workflow",
    "Impact:", "History", "Add to history", "Deadline / urgent blockers", "Awaiting Kingsmen support assignment",
    "cache: \"no-store\"", "credentials: \"same-origin\"", "not an operator assignment"
  ]) assert.ok(page.includes(marker), `support UI missing ${marker}`);
  assert.match(page, /aria-label="Filter requests"/);
  assert.match(dashboard, /href: "\/candidate\/support"/);
});

test("authenticated candidate support intake is confirmed by canonical shared queue before success", () => {
  assert.match(route, /create_candidate_support_ticket/);
  assert.match(route, /canonicalQueue: canonicalTicket \? \{ status: "SYNCED"/);
  assert.match(route, /SUPPORT_STORAGE_UNAVAILABLE/);
  assert.match(route, /LOCAL_DEVELOPMENT_ONLY/);
  assert.match(route, /No external notification was sent/);
  assert.match(supportMigration, /FUNCTION public\.create_candidate_support_ticket/);
  assert.match(supportMigration, /SECURITY DEFINER/);
  assert.match(supportMigration, /c\.owner_user_id = auth\.uid\(\)/);
  assert.match(supportMigration, /GRANT EXECUTE ON FUNCTION public\.create_candidate_support_ticket.*TO authenticated/);
});
