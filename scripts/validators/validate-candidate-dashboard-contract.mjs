import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, "");

const dashboard = read("../../apps/web/src/app/candidate/dashboard/page.tsx");
const homepage = read("../../apps/web/src/app/page.tsx");
const packages = read("../../apps/web/src/app/packages/page.tsx");
const workbench = read("../../apps/web/src/app/candidate/workbench/page.tsx");
const applicationTracker = read("../../apps/web/src/app/personal-job-desk/application-tracker/page.tsx");
const finance = read("../../apps/web/src/app/candidate/finance/page.tsx");
const destinyPage = read("../../apps/web/src/app/free-destiny-map/page.tsx");
const destinyForm = read("../../apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
const destinyClient = read("../../apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
const documentsPage = read("../../apps/web/src/app/candidate/documents/page.tsx");
const documentPreflight = read("../../apps/web/src/components/candidate/DocumentPreflightPanel.tsx");
const candidateProfile = read("../../apps/web/src/components/candidate/CandidateMasterProfileForm.tsx");
const savedOpportunities = read("../../apps/web/src/components/candidate/CandidateSavedOpportunitiesClient.tsx");
const authCallback = read("../../apps/web/src/components/candidate/AuthCallbackClient.tsx");
const opportunityMatches = read("../../apps/web/src/app/candidate/opportunity-matches/page.tsx");
const payfastCheckout = read("../../apps/web/src/components/candidate/PayFastSandboxCheckout.tsx");
const paymentReturn = read("../../apps/web/src/app/payment/return/page.tsx");
const paymentCancel = read("../../apps/web/src/app/payment/cancel/page.tsx");
const profilePage = read("../../apps/web/src/app/candidate/profile/page.tsx");
const callbackPage = read("../../apps/web/src/app/auth/callback/page.tsx");
const authForm = read("../../apps/web/src/components/candidate/CandidateAuthForm.tsx");
const signInPage = read("../../apps/web/src/app/candidate/login/page.tsx");
const registerPage = read("../../apps/web/src/app/auth/register/page.tsx");

const expectedPathways = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
];

for (const [key, label] of expectedPathways) {
  assert.ok(dashboard.includes(key), `Dashboard missing pathway key: ${key}`);
  assert.ok(dashboard.includes(label), `Dashboard missing pathway label: ${label}`);
  assert.ok(workbench.includes(key), `Workbench missing pathway key: ${key}`);
}

const expectedRoutes = [
  "/candidate/profile",
  "/candidate/workbench",
  "/candidate/opportunity-matches",
  "/candidate/saved-opportunities",
  "/candidate/documents",
  "/personal-job-desk/application-tracker",
  "/candidate/finance"
];

for (const route of expectedRoutes) {
  assert.ok(dashboard.includes(route), `Dashboard missing workspace route: ${route}`);
}

const expectedWorkbenchRoutes = [
  "/candidate/profile",
  "/candidate/opportunity-matches",
  "/candidate/saved-opportunities",
  "/candidate/documents",
  "/personal-job-desk/application-tracker",
  "/candidate/finance"
];
for (const route of expectedWorkbenchRoutes) {
  assert.ok(workbench.includes(route), `Workbench journey missing route: ${route}`);
}
assert.match(workbench, /Your application journey/);
assert.match(workbench, /not a provider submission/i);
assert.match(workbench, /provider-confirmed receipt/i);
assert.match(workbench, /verified PayFast ITN settlement/i);
assert.match(workbench, /CAO remains one Kingsmen managed application/);
assert.match(applicationTracker, /ApplicationTrackerClient/);

assert.match(homepage, /title: "Higher Education"/);
assert.match(homepage, /title: "TVET"/);
assert.match(homepage, /title: "SETA programmes & learnerships"/);
assert.match(homepage, /title: "Internships"/);
assert.match(homepage, /title: "Apprenticeships"/);
assert.match(homepage, /title: "Employment"/);

assert.match(dashboard, /does not claim an opportunity is open/);
assert.match(dashboard, /No admission, funding, placement, employment, or success is guaranteed/);
assert.match(dashboard, /Provider receipt and outcomes require provider-origin evidence/);

for (const [name, price] of [
  ["Foundational Accord", "R169.99"],
  ["Collegiate Ordinance", "R299.99"],
  ["Chancellor’s Writ", "R399.99"],
  ["Regency Mandate", "R469.99"],
  ["Artisan Charter", "R149.99"],
  ["Guildmasters Charter", "R199.99"],
  ["CV Revamp", "R49.99"]
]) {
  assert.ok(packages.includes(name), `Package page missing ${name}`);
  assert.ok(packages.includes(price), `Package page missing canonical price ${price}`);
  assert.ok(finance.includes(name), `Finance view missing ${name}`);
  assert.ok(finance.includes(price), `Finance view missing canonical price ${price}`);
}

assert.match(packages, /accommodation routes included/i);
assert.match(packages, /15 CV versions and 15 motivation letters/);
assert.match(packages, /does not activate entitlements/);
assert.match(packages, /PayFast sandbox only/);
assert.match(packages, /ARTISAN_CHARTER_R149_99/);
assert.match(packages, /FOUNDATIONAL_ACCORD_R169_99/);
assert.match(packages, /GUILDMASTERS_CHARTER_R199_99/);
assert.match(packages, /COLLEGIATE_ORDINANCE_R299_99/);
assert.match(packages, /CHANCELLORS_WRIT_R399_99/);
assert.match(packages, /REGENCY_MANDATE_R469_99/);
assert.match(packages, /CV_REVAMP_R49_99/);
assert.match(packages, /PayFastSandboxCheckout/);
assert.match(finance, /A return page is not payment proof/);

assert.match(destinyPage, /FreeDestinyMapApiForm/);
assert.match(destinyForm, /submitFreeDestinyMapClientPayload/);
assert.match(destinyForm, /consentToBeContacted/);
assert.match(destinyForm, /consentToProcessBasicInfo/);
assert.match(destinyClient, /FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT/);
assert.match(destinyClient, /application\/json/);

assert.match(documentsPage, /DocumentPreflightPanel/);
assert.match(documentsPage, /UPLOADED_CANDIDATE_REPORTED/);
assert.ok(documentPreflight.includes("10 * 1024 * 1024"));
assert.match(documentPreflight, /SHA-256/);
assert.match(documentPreflight, /candidate-private-documents/);
assert.match(documentPreflight, /upload-url/);
assert.match(documentPreflight, /finalize-upload/);
assert.match(documentPreflight, /read-url/);
assert.match(documentPreflight, /signedUploadUrl/);
assert.match(documentPreflight, /60 seconds/);

assert.match(candidateProfile, /candidate-master-profile/);
assert.match(candidateProfile, /revoke_consent/);
assert.match(candidateProfile, /request_correction/);
assert.match(savedOpportunities, /candidate_workspace_saved_opportunities/);
assert.ok(savedOpportunities.includes('gate.identityStatus !== "VERIFIED"'), "Saved opportunities must remain unavailable until candidate identity is verified.");
assert.ok(authCallback.includes("auth/v1/user"));
assert.match(opportunityMatches, /candidate-save-verified-opportunity/);
assert.ok(opportunityMatches.includes("pathway_type: item.pathways[0]"));
assert.ok(payfastCheckout.includes("functions/v1/payfast-sandbox"));
assert.match(payfastCheckout, /idempotency-key/);
assert.match(payfastCheckout, /sandbox.payfast.co.za/);
assert.match(payfastCheckout, /verified PayFast ITN/i);
assert.match(paymentReturn, /browser return is not proof of payment/i);
assert.match(paymentCancel, /No payment success is recorded here/);
assert.match(profilePage, /CandidateMasterProfileForm/);
assert.match(callbackPage, /AuthCallbackClient/);
assert.match(authForm, /\/auth\/v1\/signup/);
assert.match(authForm, /grant_type=password/);
assert.match(authForm, /sb-.*-auth-token/);
assert.match(authForm, /redirect_to=/);
assert.match(signInPage, /CandidateAuthForm mode="login"/);
assert.match(registerPage, /CandidateAuthForm mode="register"/);

console.log("Candidate portal contract passed: six pathways, candidate journey navigation, tracker route, canonical pricing, Free Destiny Map boundary, private document preflight, auth entry points and evidence-bound status language.");
