import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = "apps/web/src/app/free-destiny-map/page.tsx";
const packagePath = "package.json";
const page = readFileSync(pagePath, "utf8").replace(/^\uFEFF/, "");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.match(page, /^"use client";/m, "The interactive preview must be a client component.");
assert.match(page, /onClick=\{previewReadinessPath\}/, "Preview button must invoke the local readiness planner.");
assert.match(page, /type="button"/, "The preview control must not submit the form.");
assert.match(page, /data-kingsmen-free-destiny-map-intake="true"/, "The intake form contract marker must remain.");
assert.match(page, /data-kingsmen-intake-button="preview-path"/, "The preview control marker must remain.");
for (const field of ["current-stage", "province", "route-interest", "biggest-blocker", "readiness-goal", "boundary-confirmation"]) {
  assert.match(page, new RegExp('data-kingsmen-intake-field="' + field + '"'), "Missing field contract: " + field);
}
assert.match(page, /data-kingsmen-preview-status="ready"/, "A ready preview state must be rendered.");
assert.match(page, /data-kingsmen-preview-steps="true"/, "Generated next steps must be identifiable.");
assert.match(page, /role="alert"/, "Validation feedback must be accessible.");
assert.match(page, /aria-live="polite"/, "Preview updates must be announced accessibly.");
assert.match(page, /not a live match/i, "The preview must not be represented as a verified live match.");
assert.match(page, /not saved or sent by this page/i, "The browser-only boundary must be explicit.");
assert.match(page, /official provider/i, "The preview must direct users to verify details with official providers.");
assert.doesNotMatch(page, /\bfetch\s*\(/, "The local-only preview must not initiate network requests.");
assert.doesNotMatch(page, /\b(localStorage|sessionStorage)\b/, "The page must not persist candidate selections.");
assert.doesNotMatch(page, /\b(XMLHttpRequest|sendBeacon)\b/, "The page must not use alternate request transports.");
assert.doesNotMatch(page, /onSubmit/, "The preview must not become a form-submission workflow.");
assert.doesNotMatch(page, /(email|phone|cell|whatsapp|surname|id number|identity number)/i, "The public preview must not request contact or sensitive identity data.");
for (const phrase of ["Higher education", "TVET and college routes", "SETA programmes and learnerships", "Internships and apprenticeships", "Employment and CV", "Funding and support", "Route discovery"]) {
  assert.ok(page.includes(phrase), "Missing route guidance: " + phrase);
}
assert.match(packageJson.scripts.test, /validate-free-destiny-map-preview\.mjs/, "The preview contract must be included in npm test.");
console.log("Free Destiny Map local readiness preview source contract passed.");
