import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentPath = "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx";
const packagePath = "package.json";
const component = readFileSync(componentPath, "utf8").replace(/^\uFEFF/, "");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const helperStart = component.indexOf("function buildLocalReadinessPreview(");
const helperEnd = component.indexOf("const fieldClass =", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Local preview helper must have a bounded source section.");
const previewHelper = component.slice(helperStart, helperEnd);

assert.match(component, /^"use client";/m, "The interactive intake component must be a client component.");
assert.match(component, /data-kingsmen-readiness-preview-button="true"/, "The separate preview control must exist.");
assert.match(component, /type="button"\s+data-kingsmen-readiness-preview-button="true"/, "Preview action must not submit the form.");
assert.match(component, /onClick=\{\(event\) => previewReadinessPath\(event\.currentTarget\.form\)\}/, "Preview button must call the local readiness handler.");
assert.match(component, /function previewReadinessPath\(form: HTMLFormElement \| null\)/, "Preview handler must require the local form reference.");
assert.match(component, /data-kingsmen-readiness-preview="ready"/, "Generated preview state must be identifiable.");
assert.match(component, /data-kingsmen-readiness-preview-steps="true"/, "Generated steps must be identifiable.");
assert.match(component, /data-kingsmen-readiness-preview-error="true" role="alert"/, "Preview validation errors must be accessible.");
assert.match(component, /aria-live="polite"/, "Preview output must announce updates accessibly.");
assert.match(component, /not a verified live match/i, "Preview must not claim verified live availability.");
assert.match(component, /does not save or send the selections/i, "Preview must declare its local-only data boundary.");
assert.match(component, /official provider/i, "Preview must instruct the candidate to verify details with an official provider.");

assert.doesNotMatch(previewHelper, /\bfetch\s*\(/, "Local preview helper must not make network requests.");
assert.doesNotMatch(previewHelper, /\b(localStorage|sessionStorage)\b/, "Local preview helper must not persist selection data.");
assert.doesNotMatch(previewHelper, /\b(XMLHttpRequest|sendBeacon)\b/, "Local preview helper must not use network transports.");
for (const field of ["fullName", "currentSituation", "knownRoute", "accommodationArea", "randomSourceName", "consentToBeContacted", "consentToProcessBasicInfo"]) {
  assert.ok(!previewHelper.includes('"'+field+'"'), "Preview must not read intake field " + field + ".");
}
for (const [route, title] of [
  ["higher_education", "Higher education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes and learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"],
  ["nsfas_bursary", "NSFAS and bursary support"],
  ["accommodation", "Accommodation support"],
  ["cv_revamp", "CV Revamp"],
  ["documents", "Document readiness"],
  ["source_check", "Opportunity and source check"],
  ["confused_full_map", "Full route discovery"]
]) {
  assert.ok(component.includes(route), "Missing route readiness guidance key: " + route);
  assert.ok(component.includes(title), "Missing route title: " + title);
}

assert.match(component, /async function onSubmit\(event: FormEvent<HTMLFormElement>\)/, "Original submit flow must remain.");
assert.match(component, /payload\.consentToProcessBasicInfo/, "Basic-information consent validation must remain.");
assert.match(component, /payload\.consentToBeContacted/, "Contact consent validation must remain.");
assert.match(component, /submitFreeDestinyMapClientPayload\(payload\)/, "Preview addition must not remove the explicit intake submission path.");
assert.match(packageJson.scripts.test, /validate-free-destiny-map-preview\.mjs/, "Preview source contract must run in the repository test chain.");

console.log("Free Destiny Map browser-local readiness preview contract passed.");
