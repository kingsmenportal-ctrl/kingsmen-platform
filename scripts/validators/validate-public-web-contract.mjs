import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../../apps/web/src/app/page.tsx", import.meta.url), "utf8");
const packages = readFileSync(new URL("../../apps/web/src/app/packages/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../apps/web/src/app/candidate/dashboard/page.tsx", import.meta.url), "utf8");
const dashboardStyles = readFileSync(new URL("../../apps/web/src/app/candidate/dashboard/candidate-dashboard.module.css", import.meta.url), "utf8");
const workbench = readFileSync(new URL("../../apps/web/src/app/candidate/workbench/page.tsx", import.meta.url), "utf8");
const workbenchStyles = readFileSync(new URL("../../apps/web/src/app/candidate/workbench/workbench.module.css", import.meta.url), "utf8");
const opportunities = readFileSync(new URL("../../apps/web/src/app/candidate/opportunity-matches/page.tsx", import.meta.url), "utf8");
const opportunitiesStyles = readFileSync(new URL("../../apps/web/src/app/candidate/opportunity-matches/opportunity-matches.module.css", import.meta.url), "utf8");
const documents = readFileSync(new URL("../../apps/web/src/app/candidate/documents/page.tsx", import.meta.url), "utf8");
const documentsStyles = readFileSync(new URL("../../apps/web/src/app/candidate/documents/documents.module.css", import.meta.url), "utf8");
const savedOpportunities = readFileSync(new URL("../../apps/web/src/components/saved-opportunities-client.tsx", import.meta.url), "utf8");
const savedOpportunitiesStyles = readFileSync(new URL("../../apps/web/src/components/saved-opportunities.module.css", import.meta.url), "utf8");

const canonicalPathways = [
  "Higher Education",
  "TVET",
  "SETA programmes & learnerships",
  "Internships",
  "Apprenticeships",
  "Employment"
];

for (const label of canonicalPathways) {
  assert.ok(home.includes(`title: "${label}"`), `Public homepage is missing canonical pathway: ${label}`);
}

assert.ok(home.includes('href="/candidate/dashboard"'), "Public journey must link to the existing candidate dashboard.");

const canonicalPrices = [
  ["Foundational Accord", "169.99"],
  ["Collegiate Ordinance", "299.99"],
  ["Chancellor’s Writ", "399.99"],
  ["Regency Mandate", "469.99"],
  ["Artisan Charter", "149.99"],
  ["Guildmasters Charter", "199.99"]
];

for (const [name, price] of canonicalPrices) {
  assert.ok(packages.includes(`name: "${name}", price: "${price}"`), `Package price mismatch or missing product: ${name}`);
}

assert.ok(packages.includes('R49.99'), "Standalone CV Revamp price is missing.");
assert.match(packages, /\+2 route bonus[\s\S]*verified CV Revamp ownership[\s\S]*eligible upgrade/, "CV Revamp bonus must require verified ownership and an eligible upgrade.");
assert.match(packages, /Standalone managed-route capacity: 0/, "CV Revamp must not advertise standalone managed-route capacity.");
assert.match(packages, /PayFast settlement and entitlement path has been verified/, "Package page must not imply payment activation before settlement verification.");
assert.ok(packages.includes('href="/candidate/dashboard"'), "Package catalogue must link to the candidate dashboard.");


assert.ok(dashboard.includes('import styles from "./candidate-dashboard.module.css";'), "Candidate dashboard must import scoped responsive styles.");
assert.ok(dashboardStyles.includes("@media (max-width: 560px)"), "Candidate dashboard must include a mobile layout.");
assert.ok(dashboardStyles.includes(":focus-visible"), "Candidate dashboard controls must have visible keyboard focus.");
assert.ok(dashboardStyles.includes("prefers-reduced-motion"), "Candidate dashboard must respect reduced-motion preferences.");
for (const route of ["/candidate/profile", "/candidate/workbench", "/candidate/opportunity-matches", "/candidate/saved-opportunities", "/candidate/documents", "/personal-job-desk/application-tracker"]) {
  assert.ok(dashboard.includes(route), `Candidate dashboard is missing workspace route: ${route}`);
}
for (const key of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  assert.ok(dashboard.includes(key), `Candidate dashboard is missing pathway code: ${key}`);
}
assert.match(dashboard, /does not claim that a profile has been saved/, "Dashboard must not imply persistence that has not been proven.");
assert.match(dashboard, /Provider receipt and outcomes require provider-origin evidence/, "Dashboard must distinguish provider receipt from candidate report.");
assert.match(dashboard, /No admission, funding, placement, employment, or success is guaranteed/, "Dashboard must disclose outcome limits.");

const profilePage = readFileSync(new URL("../../apps/web/src/app/candidate/profile/page.tsx", import.meta.url), "utf8");
assert.ok(profilePage.includes('functions/v1/candidate-master-profile'), "Candidate profile must call the existing Supabase profile persistence function.");
for (const action of ["load", "save", "request_correction", "revoke_consent"]) {
  assert.ok(profilePage.includes(`action: "${action}"`) || profilePage.includes(`action !== "${action}"`), `Candidate profile action is not wired: ${action}`);
}
assert.ok(profilePage.includes("consentAccepted: true"), "Profile save must submit the explicit consent acceptance flag.");
assert.ok(profilePage.includes("PROFILE_BOOTSTRAP_REQUIRED") || profilePage.includes("identityStatus"), "Profile UI must display service-returned identity status rather than imply verified access.");
assert.match(profilePage, /Do not enter a South African ID number/, "Profile form must not request sensitive identity numbers.");
assert.ok(!profilePage.includes("SUPABASE_SERVICE_ROLE_KEY"), "A privileged Supabase service-role key must not enter browser code.");



assert.ok(workbench.includes('functions/v1/candidate-application-preparation'), "Workbench must use the authenticated application preparation service.");
assert.ok(workbench.includes('action: "load"'), "Workbench must load persisted records from the service.");
assert.ok(workbench.includes('action: "prepare_master_application"'), "Workbench must use the service for parent-application preparation.");
assert.ok(workbench.includes("No provider submission is inferred") || workbench.includes("Provider submission is not inferred"), "Workbench must distinguish preparation from provider submission.");
assert.ok(workbench.includes("CAO") && workbench.includes("child"), "Workbench must describe the CAO parent/child application model.");
assert.ok(workbenchStyles.includes("@media(max-width:560px)") && workbenchStyles.includes(":focus-visible"), "Workbench must have responsive styles and keyboard focus.");
assert.ok(opportunities.includes('functions/v1/n15-candidate-opportunities'), "Opportunity feed must use the existing verified feed endpoint.");
assert.ok(opportunities.includes('functions/v1/candidate-save-verified-opportunity'), "Opportunity save must call the server-side save endpoint.");
for (const pathway of ["SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "HIGHER_EDUCATION", "TVET", "EMPLOYMENT"]) {
  assert.ok(opportunities.includes(pathway), `Opportunity feed is missing the deployed API enum: ${pathway}`);
}
assert.ok(opportunities.includes("Saving does not submit anything to the provider."), "Saving a match must not imply provider submission.");
assert.ok(opportunitiesStyles.includes("@media(max-width:560px)") && opportunitiesStyles.includes(":focus-visible"), "Opportunity feed must have responsive styles and keyboard focus.");
assert.ok(savedOpportunities.includes('functions/v1/candidate-application-preparation'), "Saved opportunity list must load persisted application records.");
assert.ok(savedOpportunities.includes('action: "load"'), "Saved opportunity list must use the service load action.");
assert.ok(savedOpportunitiesStyles.includes("@media(max-width:560px)"), "Saved opportunity list must have mobile styling.");
assert.ok(documents.includes('functions/v1/candidate-private-documents'), "Document vault must use the private document API.");
for (const action of ["upload-url", "finalize-upload", "read-url"]) {
  assert.ok(documents.includes(`action: "${action}"`), `Document vault action not wired: ${action}`);
}
assert.ok(documents.includes("10 * 1024 * 1024"), "Document vault must cap files at 10 MiB.");
for (const mime of ["application/pdf", "image/jpeg", "image/png"]) {
  assert.ok(documents.includes(mime), `Document vault must support ${mime}`);
}
assert.ok(documents.includes("pendingFinalizeId") && documents.includes("Retry upload finalization"), "Vault must expose safe recovery if finalization needs retry.");
assert.ok(documents.includes("body: file") && !documents.includes("new FormData()"), "Private signed upload must send raw file bytes, not multipart form data.");
assert.ok(documents.includes('"Content-Type": mimeType'), "Private signed upload must send the validated MIME type.");
assert.ok(documents.includes("signedReadUrl") && documents.includes("expiresInSeconds"), "Vault must show expiring server-signed read links.");
assert.ok(documents.includes("SHA-256") && documents.includes("sha256_hex"), "Vault must surface server-recorded checksum status.");
assert.ok(documents.includes("Candidate actions cannot approve, reject or delete files"), "Candidate UI must not expose reviewer-only decisions.");
assert.ok(!documents.includes("SUPABASE_SERVICE_ROLE_KEY"), "Privileged service-role credentials must not be present in browser code.");
assert.ok(documentsStyles.includes("@media(max-width:560px)") && documentsStyles.includes(":focus-visible"), "Document vault must have responsive styles and keyboard focus.");

console.log("Public web contract passed: six pathways, persisted workspace APIs, private document workflow, pricing and entitlement guards.");
