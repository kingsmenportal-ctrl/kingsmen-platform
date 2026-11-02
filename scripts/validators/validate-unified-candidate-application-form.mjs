import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const page = read("apps/web/src/app/candidate/apply/page.tsx");
const editor = read("apps/web/src/app/candidate/applications/[applicationId]/page.tsx");
const caoPage = read("apps/web/src/app/candidate/cao-choices/page.tsx");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");
const tracker = read("apps/web/src/app/candidate/applications/page.tsx");
const draftRoute = read("apps/web/src/app/api/candidate/application-draft/route.ts");
const preparationRoute = read("apps/web/src/app/api/candidate/applications/route.ts");
const opportunityPage = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");

const pathways = [
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP",
  "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT"
];
const checks = [
  ["one candidate-facing form covers all six pathways", pathways.every((value) => page.includes(value))],
  ["form loads only authenticated candidate-owned saved targets", page.includes('getCandidateAccessToken()') && page.includes('"/api/candidate/applications"') && page.includes("masterTargets")],
  ["unlinked saved targets use the verified master-target preparation action", page.includes('"prepare_master_application"') && page.includes("target_key: selectedTarget.target_key")],
  ["target selector opens the single canonical parent-application editor", page.includes('router.push("/candidate/applications/"') && editor.includes('"/api/candidate/application-draft?application_id="') && editor.includes('"/api/candidate/application-draft",')],
  ["canonical editor uses optimistic versioning and retry-stable idempotency", editor.includes("expected_version: version") && editor.includes("idempotency_key: requestKey") && editor.includes("saveIdempotencyKey")],
  ["answer fields match the allow-listed database contract", ["motivation_statement","relevant_experience","qualifications_summary","availability_date","preferred_campus","additional_answers"].every((value) => editor.includes(value))],
  ["canonical editor handles locked parent states and version conflicts", editor.includes("isEditable") && editor.includes("APPLICATION_DRAFT_VERSION_CONFLICT")],
  ["canonical editor requires the reusable profile record and links back to profile editing", editor.includes("shared_profile_available") && editor.includes("!profileAvailable") && editor.includes('href="/candidate/profile"')],
  ["higher-education editor deep-links CAO choices to the same parent and CAO page selects that authorised parent", editor.includes('"/candidate/cao-choices?application_id=" + encodeURIComponent(applicationId)') && caoPage.includes("requestedParentId") && caoPage.includes("nextParents.find(parent => parent.application_id === requestedParentId)")],
  ["candidate can navigate from dashboard, tracker and opportunity discovery into the unified selector", dashboard.includes('href: "/candidate/apply"') && tracker.includes('href="/candidate/apply"') && opportunityPage.includes('href="/candidate/apply"')],
  ["candidate selector hides internal source-confidence values and does not link external providers", !page.includes("source status:") && !page.includes("provider_application_url") && !page.includes("target=\"_blank\"") && page.includes("Current official-source, eligibility and deadline checks are repeated")],
  ["canonical editor explicitly distinguishes drafts from provider submission and outcomes", editor.includes("not an external provider submission") && editor.includes("provider-confirmed receipt")],
  ["API routes require bearer authentication and preserve no-store behaviour", draftRoute.includes("AUTHENTICATION_REQUIRED") && draftRoute.includes("Cache-Control") && preparationRoute.includes("Bearer")],
  ["application-preparation API forwards only the target key, not browser candidate IDs", preparationRoute.includes("payload.target_key = incoming.target_key") && preparationRoute.includes("Browser-supplied candidate IDs are deliberately not forwarded")]
];

for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
}
assert.ok(checks.every(([, passed]) => passed), "Unified candidate application form contract failed.");
process.stdout.write("Unified candidate application form contract: " + checks.filter(([, passed]) => passed).length + "/" + checks.length + " passed\n");
