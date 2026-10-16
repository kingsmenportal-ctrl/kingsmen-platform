const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/support/page.tsx"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/dashboard/page.tsx"), "utf8");

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
    "Impact:", "History", "Add to history", "Urgent requests", "Awaiting Kingsmen support assignment",
    "cache: \"no-store\"", "credentials: \"same-origin\"", "not an operator assignment"
  ]) assert.ok(page.includes(marker), `support UI missing ${marker}`);
  assert.match(page, /aria-label="Filter requests"/);
  assert.match(dashboard, /href: "\/candidate\/support"/);
});
