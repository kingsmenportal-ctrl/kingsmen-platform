import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");
const flowsCss = readFileSync(new URL("./flows.css", import.meta.url), "utf8");
const flowsJs = readFileSync(new URL("./flows.js", import.meta.url), "utf8");
const liveHome = readFileSync(new URL("../web/src/app/page.tsx", import.meta.url), "utf8");
const liveLayout = readFileSync(new URL("../web/src/app/layout.tsx", import.meta.url), "utf8");
const liveCss = readFileSync(new URL("../web/src/app/public-home.css", import.meta.url), "utf8");
const livePackages = readFileSync(new URL("../web/src/app/packages/page.tsx", import.meta.url), "utf8");
const liveDashboard = readFileSync(new URL("../web/src/app/candidate/dashboard/page.tsx", import.meta.url), "utf8");
const liveDocuments = readFileSync(new URL("../web/src/app/candidate/documents/page.tsx", import.meta.url), "utf8");
const liveDocumentPreflight = readFileSync(new URL("../web/src/components/candidate/DocumentPreflightPanel.tsx", import.meta.url), "utf8");
const liveDestiny = readFileSync(new URL("../web/src/app/free-destiny-map/page.tsx", import.meta.url), "utf8");
const liveReceipt = readFileSync(new URL("../web/src/app/preview/payment-confirmed/page.tsx", import.meta.url), "utf8");
const liveStaff = readFileSync(new URL("../web/src/app/preview/staff-review/page.tsx", import.meta.url), "utf8");
const liveProfileRoute = readFileSync(new URL("../web/src/app/candidate/profile/page.tsx", import.meta.url), "utf8");
const liveProfileForm = readFileSync(new URL("../web/src/components/candidate/CandidateMasterProfileForm.tsx", import.meta.url), "utf8");
const liveSavedRoute = readFileSync(new URL("../web/src/app/candidate/saved-opportunities/page.tsx", import.meta.url), "utf8");
const liveSavedClient = readFileSync(new URL("../web/src/components/candidate/CandidateSavedOpportunitiesClient.tsx", import.meta.url), "utf8");
const liveMatches = readFileSync(new URL("../web/src/app/candidate/opportunity-matches/page.tsx", import.meta.url), "utf8");
const liveAuthForm = readFileSync(new URL("../web/src/components/candidate/CandidateAuthForm.tsx", import.meta.url), "utf8");
const liveAuthCallback = readFileSync(new URL("../web/src/app/auth/callback/page.tsx", import.meta.url), "utf8");
const liveAuthCallbackClient = readFileSync(new URL("../web/src/components/candidate/AuthCallbackClient.tsx", import.meta.url), "utf8");

for (const page of ["candidate-dashboard.html", "documents.html", "payment-confirmed.html", "staff-review.html", "packages.html", "destiny-map.html"]) {
  assert.ok(readFileSync(new URL("./" + page, import.meta.url), "utf8").includes("<html"), `missing page: ${page}`);
}
assert.ok(flowsJs.includes("No file was uploaded"), "document upload boundary missing");
assert.ok(flowsJs.includes("No candidate record"), "staff action boundary missing");
assert.ok(flowsCss.includes(".review-table"), "staff review styling missing");

for (const pathway of ["Higher Education", "TVET Colleges", "Learnerships & SETAs", "Internships", "Apprenticeships", "Employment"]) {
  assert.ok(html.includes(pathway), `missing pathway: ${pathway}`);
}
for (const token of ["--navy:#0a1348", "--navy-deep:#060c2e", "--gold:#c9a227", "--gold-soft:#d4af37"]) {
  assert.ok(css.includes(token), `missing design token: ${token}`);
}
for (const plan of ["Foundational Accord", "Collegiate Ordinance", "Chancellor’s Writ", "Regency Mandate", "Artisan Charter", "Guildmasters Charter", "CV Revamp", "Free Destiny Map"]) {
  assert.ok(js.includes(plan), `missing package: ${plan}`);
}
assert.ok(html.includes('id="destiny-form"'), "Destiny Map intake form missing");
assert.ok(js.includes("No data was sent"), "preview boundary copy missing");
assert.ok(readme.includes("does not authenticate users"), "backend boundary documentation missing");
assert.ok(css.includes("@media(max-width:680px)"), "mobile layout breakpoint missing");
assert.ok(css.includes("prefers-reduced-motion"), "reduced-motion support missing");

for (const pathway of ["Higher Education", "TVET", "SETA programmes & learnerships", "Internships", "Apprenticeships", "Employment"]) {
  assert.ok(liveHome.includes(pathway), `live homepage missing pathway: ${pathway}`);
}
assert.ok(liveLayout.includes('import "./public-home.css"'), "Next.js layout must load the Kingsmen design system");
assert.ok(liveHome.includes("Candidate account creation, real uploads, provider submissions and checkout are not enabled"), "public homepage must disclose preview limitations");
assert.ok(liveCss.includes("--km-navy:#0a1348") && liveCss.includes("--km-gold:#c9a227"), "live frontend design tokens missing");
for (const plan of ["Foundational Accord", "Collegiate Ordinance", "Chancellor’s Writ", "Regency Mandate", "Artisan Charter", "Guildmasters Charter", "CV Revamp", "Free Destiny Map"]) {
  assert.ok(livePackages.includes(plan), `live package route missing: ${plan}`);
}
for (const contract of ["priceCents: 16999", "applications: 5", "capacity: 4", "priceCents: 29999", "applications: 10", "capacity: 8", "priceCents: 39999", "capacity: 10", "priceCents: 46999", "capacity: 12", "priceCents: 14999", "capacity: 3", "priceCents: 19999", "capacity: 5", "priceCents: 4999"]) {
  assert.ok(livePackages.includes(contract), `live package contract missing: ${contract}`);

assert.ok(livePackages.includes("Accommodation support available; routes verified separately"), "CV Revamp must retain accommodation support while exposing zero managed-route capacity");
assert.ok(js.includes("Accommodation support available; routes verified separately"), "static CV Revamp accommodation wording missing");
}
assert.ok(liveDashboard.includes("All six pathways") && liveDashboard.includes("provider-origin evidence"), "candidate dashboard scope/safety copy missing");
assert.ok(liveDocuments.includes("Private upload requires verified candidate identity"), "Document Vault must disclose its identity gate");
assert.ok(liveDocuments.includes("Payment checkout and provider submission are not connected"), "document and provider/payment status boundaries must remain separate");
assert.ok(liveDocumentPreflight.includes("candidate-private-documents") && liveDocumentPreflight.includes('action: "create_upload"'), "Document Vault must request a signed private upload");
assert.ok(liveDocumentPreflight.includes('action: "finalize_upload"') && liveDocumentPreflight.includes("sha256_hex"), "Document Vault must finalise and show server-recorded integrity");
assert.ok(liveDocumentPreflight.includes('action: "create_download_url"') && liveDocumentPreflight.includes("expiresInSeconds"), "private read links must be short-lived and requested from the backend");
assert.ok(liveDocumentPreflight.includes("IDENTITY_REVIEW_REQUIRED") && liveDocumentPreflight.includes("VERIFIED"), "document upload must be gated by verified candidate identity");
assert.ok(liveDestiny.includes("FreeDestinyMapApiForm"), "live Destiny Map must use the intake API-boundary form");
const liveDestinyForm = readFileSync(new URL("../web/src/components/kingsmen/FreeDestinyMapApiForm.tsx", import.meta.url), "utf8");
assert.ok(liveDestinyForm.includes("FREE_DESTINY_MAP_API_WIRING_NOTICE"), "Destiny Map must disclose the API boundary");
assert.ok(liveDestinyForm.includes("consentToProcessBasicInfo") && liveDestinyForm.includes("consentToBeContacted"), "Destiny Map must require explicit consent");
assert.ok(liveReceipt.includes("No payment has been made") && liveReceipt.includes("Settlement status: not verified"), "payment receipt must stay an example until settlement verification");
assert.ok(liveStaff.includes("Synthetic examples only") && liveStaff.includes("do not affect real candidate data"), "staff-review controls must stay demo-only");
assert.ok(liveProfileRoute.includes("CandidateMasterProfileForm"), "candidate profile route must use the profile form");
assert.ok(liveProfileForm.includes("/functions/v1/candidate-master-profile"), "candidate profile must use the verified Supabase profile service");
assert.ok(liveProfileForm.includes('action: "load"') && liveProfileForm.includes('action: "save"'), "candidate profile must support backend load and save");
assert.ok(liveProfileForm.includes("consentAccepted: true") && liveProfileForm.includes("pathwayPreferences"), "candidate profile must send consent and pathway preferences");
assert.ok(liveProfileForm.includes('action: "revoke_consent"') && liveProfileForm.includes('action: "request_correction"'), "profile consent withdrawal and correction requests must use backend workflows");
assert.ok(liveSavedRoute.includes("CandidateSavedOpportunitiesClient"), "saved-opportunities route must use the connected backend client");
assert.ok(liveSavedClient.includes("candidate-master-profile") && liveSavedClient.includes("candidate_workspace_saved_opportunities"), "saved records must be identity-gated and loaded from the backend");
assert.ok(liveSavedClient.includes('identityStatus !== "VERIFIED"'), "saved opportunity rows must be withheld until candidate identity is verified");
assert.ok(liveMatches.includes("candidate-save-verified-opportunity") && liveMatches.includes('action: "save", match_ref: item.match_ref'), "verified opportunity save must use the guarded backend workflow");
assert.ok(liveMatches.includes("Save & prepare draft") && liveMatches.includes("no provider submission occurred"), "candidate UI must distinguish saved draft from provider submission");
assert.ok(liveAuthForm.includes("/auth/v1/signup") && liveAuthForm.includes('"/auth/callback"'), "registration must send confirmation links through the callback route");
assert.ok(liveAuthCallback.includes("AuthCallbackClient") && liveAuthCallbackClient.includes("/auth/v1/user"), "auth callback must verify and store the returned Supabase session");

console.log("Kingsmen frontend preview smoke checks passed.");
