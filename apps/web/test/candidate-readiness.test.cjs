const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const pagePath = path.join(root, "apps/web/src/app/candidate/readiness/page.tsx");
const dashboardPath = path.join(root, "apps/web/src/app/candidate/dashboard/page.tsx");

test("candidate readiness center covers core workflow areas and next actions", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  for (const marker of [
    "Core candidate profile",
    "CV in document vault",
    "Source-backed opportunities",
    "Application preparation packs",
    "Submission evidence",
    "Follow-up discipline",
    "Support blockers",
    "Finance records",
    "Application-stage accuracy",
    "/api/personal-jobs/apply-now",
    "cache: \"no-store\"",
    "credentials: \"same-origin\"",
    "human review",
    "not independently verified",
    "Do not mark an application submitted",
  ]) assert.ok(page.includes(marker), `readiness center missing ${marker}`);
});

test("candidate readiness center is discoverable from candidate dashboard", () => {
  const dashboard = fs.readFileSync(dashboardPath, "utf8");
  assert.match(dashboard, /Readiness & next actions/);
  assert.match(dashboard, /\/candidate\/readiness/);
});
