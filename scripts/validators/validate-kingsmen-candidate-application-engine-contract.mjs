import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const edgePath = "supabase/functions/candidate-master-applications/index.ts";
const pagePath = "apps/web/src/app/candidate/workbench/page.tsx";
assert.ok(existsSync(edgePath), "Candidate application planning Edge Function must exist.");
assert.ok(existsSync(pagePath), "Candidate application workbench page must exist.");
const edge = readFileSync(edgePath, "utf8");
const page = readFileSync(pagePath, "utf8");

for (const token of [
  "auth.auth.getUser(token)",
  "candidate_auth_identity_links",
  'link_status !== "VERIFIED"',
  "privacy_consent_records",
  "PROFILE_PROCESSING",
  "candidate_opportunity_matches",
  'match.match_status !== "APPROVED"',
  'match.source_confidence !== "OFFICIAL_VERIFIED"',
  "human_review_required",
  "sealed_exact_target",
  "external_source_observations",
  "stale_after",
  "opportunity_deadlines",
  "deadline_status",
  "CONFIRMED_DEADLINE_REQUIRED",
  "OPPORTUNITY_NOT_OPEN_YET",
  "deadline.opens_at",
  "candidate_master_application_targets",
  'source_confidence: "UNVERIFIED"',
  'planning_status: "PLANNING"',
  "provider_submission_sent: false",
  "Access-Control-Allow-Origin",
  "Cache-Control"
]) {
  assert.ok(edge.includes(token), "Application planning function must enforce " + token + ".");
}
assert.ok(!edge.includes("candidate_accounts"), "Candidate planning must resolve identity from the canonical identity-link table, not legacy candidate_accounts.");
assert.ok(!edge.includes("SUPABASE_SERVICE_ROLE_KEY" + " = \"\""), "Service-role configuration must be read from the environment only.");
assert.ok(edge.includes("KINGSMEN_PORTAL_ORIGINS"), "Application planning must allow only explicitly configured portal origins.");
assert.ok(edge.includes('slice(0, 180)'), "Saved provider labels must respect the database's 180-character limit.");
assert.ok(edge.includes('slice(0, 240)'), "Saved programme labels must respect the database's 240-character limit.");
for (const pathway of [
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP",
  "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT"
]) {
  assert.ok(edge.includes(pathway) && page.includes(pathway), "Both server and UI must support " + pathway + ".");
}
assert.ok(page.includes("getKingsmenSupabaseAccessToken"), "Workbench must use project-scoped session helper.");
assert.ok(page.includes("candidate-master-applications"), "Workbench must call the server-side application planning endpoint.");
assert.ok(page.includes("candidate-master-profile"), "Workbench must gate on saved profile and consent state.");
assert.ok(page.includes("Load verified matches"), "Workbench must load the verified opportunity feed.");
assert.ok(page.includes("SETA_LEARNERSHIPS: \"SETA_LEARNERSHIP\""), "Feed SETA pathway code must normalize to the canonical application pathway.");
assert.ok(page.includes("INTERNSHIPS: \"INTERNSHIP\""), "Feed internship pathway code must normalize to the canonical application pathway.");
assert.ok(page.includes("APPRENTICESHIPS: \"APPRENTICESHIP\""), "Feed apprenticeship pathway code must normalize to the canonical application pathway.");
assert.ok(page.includes("applicationPathways(item)"), "Workbench must add matches using normalized application pathway codes.");
assert.ok(page.includes("Add ") && page.includes("to plan"), "Workbench must provide an internal add-to-plan action.");
assert.ok(page.includes("does not submit an application"), "Workbench must clearly distinguish planning from provider submission.");
assert.ok(!page.includes("window.location") && !page.includes("location.href"), "Workbench must not redirect candidates to providers as the primary workflow.");

console.log("Kingsmen candidate application engine contract passed.");
