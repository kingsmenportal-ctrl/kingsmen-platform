import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");

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
console.log("Kingsmen frontend preview smoke checks passed.");
