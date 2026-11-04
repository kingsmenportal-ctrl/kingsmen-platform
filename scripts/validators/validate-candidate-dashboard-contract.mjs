import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const dashboard = read("../../apps/web/src/app/candidate/dashboard/page.tsx");
const profile = read("../../apps/web/src/app/candidate/profile/page.tsx");
const documents = read("../../apps/web/src/app/candidate/documents/page.tsx");
const workbench = read("../../apps/web/src/app/candidate/workbench/page.tsx");

const expectedPathways = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
];

for (const [key, label] of expectedPathways) {
  assert.ok(dashboard.includes(key), `Missing dashboard pathway key: ${key}`);
  assert.ok(dashboard.includes(label), `Missing dashboard pathway label: ${label}`);
  assert.ok(workbench.includes(key), `Missing workbench pathway key: ${key}`);
  assert.ok(workbench.includes(label), `Missing workbench pathway label: ${label}`);
}

const expectedRoutes = [
  "/candidate/workbench",
  "/candidate/opportunity-matches",
  "/candidate/saved-opportunities",
  "/candidate/documents",
  "/personal-job-desk/application-tracker"
];

for (const route of expectedRoutes) {
  assert.ok(dashboard.includes(route), `Missing dashboard route: ${route}`);
}

assert.match(dashboard, /Provider receipt and outcomes require provider-origin evidence/);
assert.match(dashboard, /does not claim that a profile has been saved/);
assert.match(dashboard, /No admission, funding, placement, employment, or success is guaranteed/);

// Profile route: preparation guidance only until authenticated persistence is wired.
assert.match(profile, /<h1[^>]*>Your profile<\/h1>/);
assert.match(profile, /Secure profile editing is not connected/);
assert.match(profile, /No profile completeness has been calculated/);
assert.match(profile, /candidate ownership enforcement/);
assert.doesNotMatch(profile, /<input\b|<textarea\b|<form\b|<button\b|onSubmit=/i);

// Document Vault: render existing panels, but never invent an uploaded document or
// expose a browser-only upload/save action before authenticated private storage exists.
assert.match(documents, /DocumentVaultPanel/);
assert.match(documents, /DocumentUploadChecklist/);
assert.match(documents, /No authenticated candidate document records/);
assert.match(documents, /documents=\{\[\]\}/);
assert.match(documents, /PDF, JPEG, or PNG files, no larger than 10 MiB each/);
assert.match(documents, /human-governed review state/);
assert.doesNotMatch(documents, /<input\b|<textarea\b|<form\b|<button\b|onSubmit=/i);

// Workbench: all six pathways remain visible, route data is explicitly unavailable,
// and CAO programme choices remain children of one parent application.
assert.match(workbench, /ApplicationWorkbenchPanel/);
assert.match(workbench, /RouteReadinessPanel/);
assert.match(workbench, /routes=\{\[\]\}/);
assert.match(workbench, /No authenticated route records were loaded/);
assert.match(workbench, /CAO: one parent application/);
assert.match(workbench, /Programme preferences are child choices/);
assert.match(workbench, /Provider receipt and provider decisions require separate evidence/);

console.log("Candidate portal contract passed: six pathways, workspace routes, profile safety, document boundary, and CAO parent-child semantics.");
