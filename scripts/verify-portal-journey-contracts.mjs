#!/usr/bin/env node
/**
 * Static contract checks for the critical candidate journey and MAP fallback.
 * These checks prove source wiring only; they do not replace browser/E2E tests.
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = async (relative) => {
  try { return await readFile(path.join(root, relative), "utf8"); }
  catch { errors.push(`Required journey component is missing: ${relative}`); return ""; }
};
const exists = async (relative) => {
  try { await access(path.join(root, relative)); return true; }
  catch { return false; }
};

const dashboard = await read("apps/web/src/app/candidate/dashboard/page.tsx");
const opportunitiesClient = await read("apps/web/src/components/candidate-opportunities-client.tsx");
const trackerPage = await read("apps/web/src/app/candidate/applications/page.tsx");
const trackerApi = await read("apps/web/src/app/api/candidate/applications/route.ts");
const identityRuntime = await read("apps/web/src/lib/candidate-document-runtime.ts");
const mapBuilder = await read("apps/api/src/routes/map-fallback.ts");
const mapPage = await read("apps/web/src/app/candidate/map-packages/page.tsx");
const mapApi = await read("apps/web/src/app/api/candidate/map-packages/route.ts");
const founderMapPage = await read("apps/web/src/app/founder/map-packages/page.tsx");
const founderMapApi = await read("apps/web/src/app/api/founder/map-packages/route.ts");

for (const route of [
  "/candidate/profile", "/candidate/discover", "/candidate/saved-opportunities",
  "/candidate/applications", "/candidate/outcomes", "/candidate/documents",
  "/candidate/finance", "/candidate/messages"
check(dashboard.includes("/candidate/map-packages"), "Candidate dashboard does not link to MAP package handling.");
for (const pathway of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) check(dashboard.includes(pathway) && opportunitiesClient.includes(pathway), `Six-pathway dashboard/discovery filter is missing ${pathway}.`);
check(opportunitiesClient.includes("Filter pathway") && opportunitiesClient.includes("not a claim that eligibility has been assessed"), "Opportunity discovery does not distinguish pathway category filters from an eligibility decision.");
]) check(dashboard.includes(route), `Candidate dashboard is not wired to ${route}`);

check(trackerPage.includes('fetch("/api/candidate/applications"'), "Application tracker does not call its same-origin API route.");
check(trackerApi.includes("requireCandidateSession"), "Application tracker API does not require a verified candidate session.");
check(trackerApi.includes("map_fallback_required,last_evidence_ref"), "Application API omits MAP fallback state or evidence reference.");
check(trackerPage.includes("Manual Application Package (MAP) required"), "Candidate tracker does not surface MAP/manual fallback state.");
check(trackerPage.includes("OTP_REQUIRED") && trackerPage.includes("CAPTCHA_BLOCKED") && trackerPage.includes("MANUAL_ONLY"), "Candidate tracker does not cover known portal blockers.");
check(trackerPage.includes('["C","D"].includes(row.source_confidence_band)'), "Candidate tracker does not route low-confidence source records to manual review.");
check(trackerPage.includes("not a successful submission") && trackerPage.includes("Contact support"), "MAP UI must distinguish fallback from successful submission and expose support escalation.");

check(identityRuntime.includes("candidate_auth_identity_links") && identityRuntime.includes('link_status", "eq.VERIFIED"'), "Candidate runtime does not require an explicit verified identity link.");
check(identityRuntime.includes("account_recovery_required") && identityRuntime.includes("is_active"), "Candidate runtime omits account recovery or active-candidate checks.");

check(mapBuilder.includes('import { randomUUID } from "node:crypto"'), "MAP references must use cryptographically strong unique IDs.");
check(mapBuilder.includes("source.protocol !== \"https:\""), "MAP source links are not restricted to HTTPS.");
check(mapBuilder.includes("source.username || source.password"), "MAP source links do not reject embedded URL credentials.");
check(mapBuilder.includes('packageStatus: "DRAFT"'), "New MAP packages must start in DRAFT pending authorised review.");
check(mapPage.includes("Save draft for authorised review"), "Candidate MAP page is missing draft creation.");
check(mapApi.includes("create_candidate_manual_application_package") && mapApi.includes("requireCandidateSession"), "Candidate MAP API is not connected to verified session and durable creation RPC.");
check(mapApi.includes("confirm_candidate_map_package_delivery") && mapApi.includes("update_candidate_map_package_progress"), "Candidate MAP delivery and progress actions are not wired.");
check(founderMapPage.includes("Approve and release to candidate") && founderMapPage.includes("Verify completion with evidence"), "Founder MAP review UI is missing approval or evidence-backed completion.");
check(founderMapApi.includes("review_candidate_manual_application_package") && founderMapApi.includes("requirePortalUser"), "Founder MAP review API is missing authorised database review.");

for (const route of [
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/complete/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts"
  "apps/web/src/app/api/candidate/map-packages/route.ts",
  "apps/web/src/app/api/founder/map-packages/route.ts"
]) check(await exists(route), `Document vault API route is missing: ${route}`);

if (errors.length) {
  console.error("Portal journey contract checks FAILED:");
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  console.log("Portal journey contract checks passed (static source wiring only; runtime/E2E not implied).");
}
