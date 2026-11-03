import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../../apps/web/src/app/page.tsx", import.meta.url), "utf8");
const packages = readFileSync(new URL("../../apps/web/src/app/packages/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../apps/web/src/app/candidate/dashboard/page.tsx", import.meta.url), "utf8");
const dashboardStyles = readFileSync(new URL("../../apps/web/src/app/candidate/dashboard/candidate-dashboard.module.css", import.meta.url), "utf8");

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
for (const route of ["/candidate/workbench", "/candidate/opportunity-matches", "/candidate/saved-opportunities", "/candidate/documents", "/personal-job-desk/application-tracker"]) {
  assert.ok(dashboard.includes(route), `Candidate dashboard is missing workspace route: ${route}`);
}
for (const key of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  assert.ok(dashboard.includes(key), `Candidate dashboard is missing pathway code: ${key}`);
}
assert.match(dashboard, /does not claim that a profile has been saved/, "Dashboard must not imply persistence that has not been proven.");
assert.match(dashboard, /Provider receipt and outcomes require provider-origin evidence/, "Dashboard must distinguish provider receipt from candidate report.");
assert.match(dashboard, /No admission, funding, placement, employment, or success is guaranteed/, "Dashboard must disclose outcome limits.");

console.log("Public web contract passed: six canonical pathways, responsive candidate workspace, canonical prices, and guarded CV Revamp entitlements.");
