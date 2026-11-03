import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, "");

const dashboard = read("../../apps/web/src/app/candidate/dashboard/page.tsx");
const homepage = read("../../apps/web/src/app/page.tsx");
const packages = read("../../apps/web/src/app/packages/page.tsx");
const workbench = read("../../apps/web/src/app/candidate/workbench/page.tsx");
const finance = read("../../apps/web/src/app/candidate/finance/page.tsx");
const destinyPage = read("../../apps/web/src/app/free-destiny-map/page.tsx");
const destinyForm = read("../../apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
const destinyClient = read("../../apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
const documentsPage = read("../../apps/web/src/app/candidate/documents/page.tsx");
const documentPreflight = read("../../apps/web/src/components/candidate/DocumentPreflightPanel.tsx");
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

assert.match(homepage, /title: "Higher Education"/);
assert.match(homepage, /title: "TVET"/);
assert.match(homepage, /title: "SETA programmes & learnerships"/);
assert.match(homepage, /title: "Internships"/);
assert.match(homepage, /title: "Apprenticeships"/);
assert.match(homepage, /title: "Employment"/);

assert.match(dashboard, /does not claim that a profile has been saved/);
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
assert.match(packages, /does not charge you or activate entitlements/);
assert.match(finance, /A return page is not payment proof/);

assert.match(destinyPage, /FreeDestinyMapApiForm/);
assert.match(destinyForm, /submitFreeDestinyMapClientPayload/);
assert.match(destinyForm, /consentToBeContacted/);
assert.match(destinyForm, /consentToProcessBasicInfo/);
assert.match(destinyClient, /FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT/);
assert.match(destinyClient, /application\/json/);

assert.match(documentsPage, /DocumentPreflightPanel/);
assert.match(documentsPage, /private upload signing is not yet confirmed/i);
assert.match(documentPreflight, /10 \* 1024 \* 1024/);
assert.match(documentPreflight, /SHA-256/);
assert.match(documentPreflight, /Not uploaded or saved/);

assert.match(authForm, /\/auth\/v1\/signup/);
assert.match(authForm, /grant_type=password/);
assert.match(authForm, /sb-.*-auth-token/);
assert.match(signInPage, /CandidateAuthForm mode="login"/);
assert.match(registerPage, /CandidateAuthForm mode="register"/);

console.log("Candidate portal contract passed: six core pathways, canonical pricing, Free Destiny Map boundary, document preflight, auth entry points and evidence-bound status language.");
