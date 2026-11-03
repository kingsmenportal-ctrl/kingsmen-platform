import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboardPath = new URL("../../apps/web/src/app/candidate/dashboard/page.tsx", import.meta.url);
const source = readFileSync(dashboardPath, "utf8");

const expectedPathways = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
];

for (const [key, label] of expectedPathways) {
  assert.ok(source.includes(key), `Missing pathway key: ${key}`);
  assert.ok(source.includes(label), `Missing candidate-facing pathway label: ${label}`);
}

const expectedRoutes = [
  "/candidate/workbench",
  "/candidate/opportunity-matches",
  "/candidate/saved-opportunities",
  "/candidate/documents",
  "/personal-job-desk/application-tracker"
];

for (const route of expectedRoutes) {
  assert.ok(source.includes(route), `Missing dashboard route: ${route}`);
}

assert.match(source, /Provider receipt and outcomes require provider-origin evidence/);
assert.match(source, /does not claim that a profile has been saved/);
assert.match(source, /No admission, funding, placement, employment, or success is guaranteed/);

console.log("Candidate dashboard contract passed: six pathways, five workspace routes, and evidence-bound status language.");
