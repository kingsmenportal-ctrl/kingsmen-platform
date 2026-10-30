import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const commercial = read("apps/api/src/commercial/commercial-catalogue.ts");
const pricing = read("apps/web/src/app/pricing/page.tsx");
const header = read("apps/web/src/components/shell/ProductHeader.tsx");
const layout = read("apps/web/src/app/layout.tsx");
const css = read("apps/web/src/app/globals.css");
const workflow = read(".github/workflows/candidate-experience-ci.yml");
const home = read("apps/web/src/app/page.tsx");

assert.ok(pricing.includes("KINGSMEN_COMMERCIAL_CATALOGUE"), "pricing must use the shared commercial catalogue");
assert.ok(pricing.includes("formatZar(plan.priceCents)"), "prices must use canonical integer-cent formatting");
for (const name of ["Foundational Accord", "Collegiate Ordinance", "Chancellor's Writ", "Regency Mandate", "Artisan Charter", "Guildmasters Charter", "CV Revamp"]) {
  assert.ok(commercial.includes(name), "canonical package missing: " + name);
}
for (const cents of ["16999", "29999", "39999", "46999", "14999", "19999", "4999"]) {
  assert.ok(commercial.includes("priceCents: " + cents), "canonical price missing: " + cents);
}
assert.ok(pricing.includes("KINGSMEN_PATHWAYS"), "pricing must expose all six pathways");
assert.ok(pricing.includes("does not collect payment"), "pricing must not imply unverified checkout");
assert.ok(header.includes("candidateLinks") && header.includes("founderLinks") && header.includes("publicLinks"), "navigation must be role-contextual");
assert.ok(layout.includes("globals.css") && layout.includes("ProductHeader"), "root layout must install shared design shell");
assert.ok(home.includes('id="pathways"') && home.includes('id="how-it-works"'), "public page anchors must remain");
assert.ok(css.includes(":focus-visible") && css.includes("prefers-reduced-motion") && css.includes("max-width:860px"), "design system must provide focus, reduced motion and mobile support");
assert.ok(workflow.includes("playwright install") && workflow.includes("test:experience"), "CI must run browser experience checks");

console.log("PASS: shared navigation, responsive visual system and canonical public packages.");
