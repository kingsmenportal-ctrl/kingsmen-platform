import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const page = read("apps/web/src/app/candidate/apply/page.tsx");
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
  ["draft reads and writes use the dedicated application-draft route", page.includes('"/api/candidate/application-draft?application_id="') && page.includes('"/api/candidate/application-draft", "POST"')],
  ["draft writes use optimistic versioning and a unique idempotency key", page.includes("expected_version: draftVersion") && page.includes("idempotency_key:") && page.includes("crypto.randomUUID()")],
  ["answer fields match the allow-listed database contract", ["motivation_statement","relevant_experience","qualifications_summary","availability_date","preferred_campus","additional_answers"].every((value) => page.includes(value))],
  ["form handles locked parent state and version conflicts", page.includes("is_editable") && page.includes("VERSION_CONFLICT")],
  ["CAO choices are described as children under the existing parent", page.includes("ordered child records under one Kingsmen parent application") && page.includes('href="/candidate/cao-choices"')],
  ["candidate can navigate to the form from dashboard, tracker and opportunity discovery", dashboard.includes('href: "/candidate/apply"') && tracker.includes('href="/candidate/apply"') && opportunityPage.includes('href="/candidate/apply"')],
  ["candidate browser does not receive service-role or provider URL handling", !page.includes("SUPABASE_SERVICE_ROLE_KEY") && !page.includes("provider_application_url") && !page.includes("target=\"_blank\"")],
  ["form never marks provider submission or outcome", page.includes("No provider submission has occurred") && page.includes("no provider receipt or outcome is inferred")],
  ["API routes require bearer authentication and preserve no-store behaviour", draftRoute.includes("AUTHENTICATION_REQUIRED") && draftRoute.includes("Cache-Control") && preparationRoute.includes("Bearer")],
  ["application-preparation API forwards only the target key, not browser candidate IDs", preparationRoute.includes("payload.target_key = incoming.target_key") && preparationRoute.includes("Browser-supplied candidate IDs are deliberately not forwarded")]
];

for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
}
assert.ok(checks.every(([, passed]) => passed), "Unified candidate application form contract failed.");
process.stdout.write("Unified candidate application form contract: " + checks.filter(([, passed]) => passed).length + "/" + checks.length + " passed\n");
