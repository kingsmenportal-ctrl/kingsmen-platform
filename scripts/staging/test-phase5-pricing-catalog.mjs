import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const types = await readFile("apps/api/src/finance/finance-types.ts", "utf8");
const catalog = await readFile("apps/api/src/finance/pricing-catalog.ts", "utf8");
const packages = await readFile("apps/web/src/app/packages/page.tsx", "utf8");
const plans = [
  ["FREE_DESTINY_MAP_R0", "Free Destiny Map", 0],
  ["CV_REVAMP_R49_99", "CV Revamp", 4999],
  ["ARTISAN_CHARTER_R149_99", "Artisan Charter", 14999],
  ["FOUNDATIONAL_ACCORD_R169_99", "Foundational Accord", 16999],
  ["GUILDMASTERS_CHARTER_R199_99", "Guildmasters Charter", 19999],
  ["COLLEGIATE_ORDINANCE_R299_99", "Collegiate Ordinance", 29999],
  ["CHANCELLORS_WRIT_R399_99", "Chancellor's Writ", 39999],
  ["REGENCY_MANDATE_R469_99", "Regency Mandate", 46999]
];
for (const [code, name, cents] of plans) {
  assert.ok(types.includes('"' + code + '"'), "finance type missing " + code);
  assert.ok(catalog.includes('planCode: "' + code + '"'), "finance catalog missing " + code);
  assert.ok(catalog.includes("amountCents: " + cents), "finance catalog missing price cents for " + code);
  assert.ok(packages.includes('planCode: "' + code + '"'), "package UI missing " + code);
  if (cents > 0) assert.ok(packages.includes('price: "R' + (cents / 100).toFixed(2) + '"'), "package UI price mismatch for " + code);
}
assert.ok(catalog.includes("accommodationRouteCount: 8"), "Foundational Accord must include eight accommodation routes");
assert.ok(!types.includes("ACCOMMODATION_SUPPORT_R179"), "obsolete plan code must not remain in the canonical type union");
assert.ok(!packages.includes('"Accommodation support included"'), "accommodation benefits must not be claimed by every plan");
assert.ok(packages.includes("8 accommodation routes included with Foundational Accord"));
console.log("PASS: all eight canonical plan codes and prices match finance types, backend catalog and package UI.");
console.log("PASS: accommodation entitlements are limited to the catalogued Foundational Accord allowance.");
