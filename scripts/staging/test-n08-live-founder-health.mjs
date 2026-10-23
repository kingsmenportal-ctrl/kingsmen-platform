import fs from "node:fs";
import assert from "node:assert/strict";

const route = fs.readFileSync("apps/web/src/app/api/founder/control-plane/health/route.ts", "utf8");
const edge = fs.readFileSync("supabase/functions/n08-founder-control-plane-health/index.ts", "utf8");

for (const [label, pattern] of [
  ["route requires caller JWT", /Authenticated founder session required/],
  ["route forwards only public anon key", /apikey: anonKey/],
  ["route calls deployed health function", /functions\/v1\/n08-founder-control-plane-health/],
  ["service-role key is not read by web route", /SUPABASE_SERVICE_ROLE_KEY/]
]) {
  if (label === "service-role key is not read by web route") {
    assert.doesNotMatch(route, pattern, label);
  } else {
    assert.match(route, pattern, label);
  }
}
assert.match(edge, /verify_jwt|platform_reviewers/, "health function must rely on JWT and reviewer authorization");
assert.match(edge, /ALLOWED_FOUNDER_ROLES = \["PLATFORM_ADMIN"\]/, "health view must require founder admin role");
assert.match(edge, /select\("id", \{ count: "exact", head: true \}\)/, "health metrics must use aggregate counts");
assert.match(edge, /candidateRecordsReturned: false/, "health output must declare no candidate records returned");
assert.match(edge, /airtableConnectionCanBlockCandidateFlows: false/, "Airtable must remain optional");
assert.match(edge, /activeTargets.count === 0/, "missing target setup must be reported as degraded");
assert.match(edge, /activeReviewers.count === 0/, "missing reviewer grants must be reported as degraded");
assert.match(edge, /productionReady: false/, "health view must not claim production readiness");
assert.doesNotMatch(edge, /select\("\*"/, "health function must not select all columns or PII");

console.log("N08 live founder health contract checks passed (static contract only; runtime auth requires an authorized test account).");
