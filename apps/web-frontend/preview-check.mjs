import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");
const flowsCss = readFileSync(new URL("./flows.css", import.meta.url), "utf8");
const flowsJs = readFileSync(new URL("./flows.js", import.meta.url), "utf8");
const liveHome = readFileSync(new URL("../web/src/app/page.tsx", import.meta.url), "utf8");
const liveLayout = readFileSync(new URL("../web/src/app/layout.tsx", import.meta.url), "utf8");
const liveCss = readFileSync(new URL("../web/src/app/public-home.css", import.meta.url), "utf8");
const livePackages = readFileSync(new URL("../web/src/app/packages/page.tsx", import.meta.url), "utf8");
const liveDashboard = readFileSync(new URL("../web/src/app/candidate/dashboard/page.tsx", import.meta.url), "utf8");
const liveDocuments = readFileSync(new URL("../web/src/app/candidate/documents/page.tsx", import.meta.url), "utf8");
const liveDestiny = readFileSync(new URL("../web/src/app/free-destiny-map/page.tsx", import.meta.url), "utf8");
const liveReceipt = readFileSync(new URL("../web/src/app/preview/payment-confirmed/page.tsx", import.meta.url), "utf8");
const liveStaff = readFileSync(new URL("../web/src/app/preview/staff-review/page.tsx", import.meta.url), "utf8");

for (const page of ["candidate-dashboard.html", "documents.html", "payment-confirmed.html", "staff-review.html", "packages.html", "destiny-map.html"]) {
  assert.ok(readFileSync(new URL("./" + page, import.meta.url), "utf8").includes("<html"), `missing page: ${page}`);
}
assert.ok(flowsJs.includes("No file was uploaded"), "document upload boundary missing");
assert.ok(flowsJs.includes("No candidate record"), "staff action boundary missing");
assert.ok(flowsCss.includes(".review-table"), "staff review styling missing");

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

for (const pathway of ["Higher Education", "TVET Colleges", "SETAs & Learnerships", "Internships", "Apprenticeships", "Employment"]) {
  assert.ok(liveHome.includes(pathway), `live homepage missing pathway: ${pathway}`);
}
assert.ok(liveLayout.includes('import "./public-home.css"'), "Next.js layout must load the Kingsmen design system");
assert.ok(liveCss.includes("--km-navy:#0a1348") && liveCss.includes("--km-gold:#c9a227"), "live frontend design tokens missing");
for (const plan of ["Foundational Accord", "Collegiate Ordinance", "Chancellor’s Writ", "Regency Mandate", "Artisan Charter", "Guildmasters Charter", "CV Revamp", "Free Destiny Map"]) {
  assert.ok(livePackages.includes(plan), `live package route missing: ${plan}`);
}
for (const contract of ["priceCents: 16999", "applications: 5", "capacity: 4", "priceCents: 29999", "applications: 10", "capacity: 8", "priceCents: 39999", "capacity: 10", "priceCents: 46999", "capacity: 12", "priceCents: 14999", "capacity: 3", "priceCents: 19999", "capacity: 5", "priceCents: 4999"]) {
  assert.ok(livePackages.includes(contract), `live package contract missing: ${contract}`);

assert.ok(livePackages.includes("Accommodation support available; routes verified separately"), "CV Revamp must retain accommodation support while exposing zero managed-route capacity");
assert.ok(js.includes("Accommodation support available; routes verified separately"), "static CV Revamp accommodation wording missing");
}
assert.ok(liveDashboard.includes("All six pathways") && liveDashboard.includes("provider-origin evidence"), "candidate dashboard scope/safety copy missing");
assert.ok(liveDocuments.includes("Nothing was uploaded") || liveDocuments.includes("not connected"), "document preview boundary missing");
assert.ok(liveDestiny.includes('data-kingsmen-intake-button="preview-path"') && liveDestiny.includes("have not been sent or saved"), "Destiny Map preview interaction/boundary missing");
assert.ok(liveReceipt.includes("No payment has been made") && liveReceipt.includes("Settlement status: not verified"), "payment receipt must stay an example until settlement verification");
assert.ok(liveStaff.includes("Synthetic examples only") && liveStaff.includes("do not affect real candidate data"), "staff-review controls must stay demo-only");

console.log("Kingsmen frontend preview smoke checks passed.");
