import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = new URL("../../apps/web/src/app/free-destiny-map/page.tsx", import.meta.url);
const source = readFileSync(pagePath, "utf8");

assert.ok(source.startsWith('"use client";'), "Free Destiny Map must be a client component so the preview handler can run.");
assert.match(source, /function handlePreview\(event: FormEvent<HTMLFormElement>\)/, "Missing submit handler.");
assert.match(source, /event\.preventDefault\(\)/, "The local preview must not trigger a browser form submission.");
assert.match(source, /new FormData\(event\.currentTarget\)/, "The preview must read the user's selections.");
assert.match(source, /<form[\s\S]*?onSubmit=\{handlePreview\}/, "The form must invoke the preview handler.");
assert.match(source, /data-kingsmen-route-preview="true"/, "The result panel must be rendered for a completed preview.");
assert.match(source, /aria-live="polite"/, "Preview results must be announced accessibly.");
assert.match(source, /This preview uses only the choices currently in this page\. Kingsmen has not received or saved them\./, "The preview must disclose its local-only behavior.");

for (const field of ["currentStage", "province", "routeInterest", "biggestBlocker", "readinessGoal"]) {
  assert.ok(source.includes(`name="${field}"`), `Missing named form field: ${field}`);
}

for (const route of [
  "Higher education route",
  "TVET and college route",
  "Skills and learnership route",
  "Work experience and apprenticeship route",
  "Employment route",
  "Funding and support route",
  "Explore and compare routes"
]) {
  assert.ok(source.includes(route), `Missing route-specific guidance: ${route}`);
}

assert.match(source, /type="submit"/, "The preview button must submit the form to its local handler.");
assert.doesNotMatch(source, /\bfetch\s*\(|postKingsmenCommand|localStorage|sessionStorage/, "The route preview must not transmit or persist selections.");
console.log("Free Destiny Map local preview contract passed: all fields, seven route-guidance branches, accessible output, and no data transmission or browser persistence.");
