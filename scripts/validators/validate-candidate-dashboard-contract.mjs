import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, "");
const dashboard = read("../../apps/web/src/app/candidate/dashboard/page.tsx");
const homepage = read("../../apps/web/src/app/page.tsx");
const packages = read("../../apps/web/src/app/packages/page.tsx");
const workbenchPage = read("../../apps/web/src/app/candidate/workbench/page.tsx");
const workbench = read("../../apps/web/src/components/candidate/CandidateApplicationWorkbench.tsx");
const finance = read("../../apps/web/src/app/candidate/finance/page.tsx");
const destinyPage = read("../../apps/web/src/app/free-destiny-map/page.tsx");
const destinyForm = read("../../apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
const destinyClient = read("../../apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
const documentsPage = read("../../apps/web/src/app/candidate/documents/page.tsx");
const documentPanel = read("../../apps/web/src/components/candidate/DocumentPreflightPanel.tsx");
const profilePage = read("../../apps/web/src/app/candidate/profile/page.tsx");
const profileForm = read("../../apps/web/src/components/candidate/CandidateMasterProfileForm.tsx");
const savedPage = read("../../apps/web/src/app/candidate/saved-opportunities/page.tsx");
const savedClient = read("../../apps/web/src/components/candidate/CandidateSavedOpportunitiesClient.tsx");
const matches = read("../../apps/web/src/app/candidate/opportunity-matches/page.tsx");
const authForm = read("../../apps/web/src/components/candidate/CandidateAuthForm.tsx");
const callbackPage = read("../../apps/web/src/app/auth/callback/page.tsx");
const callbackClient = read("../../apps/web/src/components/candidate/AuthCallbackClient.tsx");
const checkout = read("../../apps/web/src/components/candidate/PayFastSandboxCheckout.tsx");
const paymentReturn = read("../../apps/web/src/app/payment/return/page.tsx");
const paymentCancel = read("../../apps/web/src/app/payment/cancel/page.tsx");

const pathways = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
];
for (const [code, label] of pathways) {
  assert.ok(dashboard.includes(code), `Dashboard missing pathway key: ${code}`);
  assert.ok(dashboard.includes(label), `Dashboard missing pathway label: ${label}`);
  assert.ok(workbenchPage.includes(code), `Workbench page missing pathway key: ${code}`);
}
for (const route of [
  "/candidate/profile",
  "/candidate/workbench",
  "/candidate/opportunity-matches",
  "/candidate/saved-opportunities",
  "/candidate/documents",
  "/candidate/finance"
]) assert.ok(dashboard.includes(route), `Dashboard missing route: ${route}`);

for (const label of [
  "Higher Education", "TVET Colleges", "SETAs & Learnerships",
  "Internships", "Apprenticeships", "Employment"
]) assert.ok(homepage.includes(label), `Homepage missing pathway: ${label}`);

for (const [name, code, cents, priority, capacity] of [
  ["Foundational Accord", "FOUNDATIONAL_ACCORD_R169_99", 16999, 5, 4],
  ["Collegiate Ordinance", "COLLEGIATE_ORDINANCE_R299_99", 29999, 10, 8],
  ["Chancellor’s Writ", "CHANCELLORS_WRIT_R399_99", 39999, 15, 10],
  ["Regency Mandate", "REGENCY_MANDATE_R469_99", 46999, 15, 12],
  ["Artisan Charter", "ARTISAN_CHARTER_R149_99", 14999, 5, 3],
  ["Guildmasters Charter", "GUILDMASTERS_CHARTER_R199_99", 19999, 8, 5],
  ["CV Revamp", "CV_REVAMP_R49_99", 4999, 0, 0]
]) {
  assert.ok(packages.includes(name), `Missing package: ${name}`);
  assert.ok(packages.includes(code), `Package missing canonical server code: ${code}`);
  assert.ok(packages.includes(`priceCents: ${cents}`), `Package missing canonical cents: ${cents}`);
  if (priority > 0) assert.ok(packages.includes(`applications: ${priority}`) && packages.includes(`capacity: ${capacity}`), `Package missing limits: ${name}`);
  assert.ok(finance.includes(name) && finance.includes("R" + (cents / 100).toFixed(2)), `Finance screen missing canonical terms: ${name}`);
}
assert.ok(packages.includes('return "R" + (priceCents / 100).toFixed(2)'), "Package prices must use dot-decimal ZAR format");
assert.match(packages, /8 accommodation routes included/);
assert.match(packages, /15 CV versions \+ 15 motivation letters/);
assert.match(packages, /PayFast sandbox checkout is available/);
assert.match(packages, /no plan entitlement is active until a verified, idempotent PayFast ITN/i);
assert.match(finance, /A return page is not payment proof/);

assert.match(destinyPage, /FreeDestinyMapApiForm/);
assert.match(destinyForm, /submitFreeDestinyMapClientPayload/);
assert.match(destinyForm, /consentToProcessBasicInfo/);
assert.match(destinyForm, /consentToBeContacted/);
assert.match(destinyClient, /FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT/);
assert.match(destinyClient, /application\/json/);

assert.match(profilePage, /CandidateMasterProfileForm/);
assert.match(profileForm, /functions\/v1\/candidate-master-profile/);
assert.match(profileForm, /action: "load"/);
assert.match(profileForm, /action: "save"/);
assert.match(profileForm, /revoke_consent/);
assert.match(profileForm, /request_correction/);

assert.match(savedPage, /CandidateSavedOpportunitiesClient/);
assert.match(savedClient, /candidate_workspace_saved_opportunities/);
assert.match(savedClient, /VERIFIED/);
assert.match(matches, /candidate-save-verified-opportunity/);
assert.match(matches, /match_ref: item\.match_ref/);
assert.match(matches, /no provider submission occurred/i);

assert.match(workbench, /functions\/v1\/candidate-application-preparation/);
assert.match(workbench, /prepare_master_application/);
assert.match(workbench, /No provider submission occurred/);

assert.match(documentsPage, /DocumentPreflightPanel/);
assert.match(documentPanel, /10 \* 1024 \* 1024/);
assert.match(documentPanel, /SHA-256/);
assert.match(documentPanel, /functions\/v1\/candidate-private-documents/);
assert.match(documentPanel, /action: "create_upload"/);
assert.match(documentPanel, /action: "finalize_upload"/);
assert.match(documentPanel, /action: "create_download_url"/);
assert.match(documentPanel, /signedUploadUrl/);
assert.match(documentPanel, /signedReadUrl/);
assert.match(documentPanel, /IDENTITY_REVIEW_REQUIRED/);
assert.match(documentPanel, /Payment checkout and provider submission are not connected/);

assert.match(authForm, /\/auth\/v1\/signup/);
assert.match(authForm, /grant_type=password/);
assert.match(authForm, /redirect_to=/);
assert.match(callbackPage, /AuthCallbackClient/);
assert.match(callbackClient, /\/auth\/v1\/user/);

assert.match(checkout, /functions\/v1\/payfast-sandbox/);
assert.match(checkout, /idempotency-key/);
assert.match(checkout, /sandbox\.payfast\.co\.za/);
assert.match(checkout, /approvedPreviewOrigin/);
assert.match(checkout, /verified PayFast ITN/i);
assert.match(paymentReturn, /browser return is not proof of payment/i);
assert.match(paymentReturn, /Instant Transaction Notification/);
assert.match(paymentCancel, /No payment success is recorded here/);
assert.match(paymentCancel, /does not change an order/);

console.log("Candidate portal contract passed: six pathways, canonical pricing, consented intake, profile/save/application services, private-document upload boundaries, auth callback, and sandbox payment evidence.");
