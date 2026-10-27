#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const catalogue = read("apps/api/src/public-website/package-boundaries.ts");
const types = read("apps/api/src/public-website/public-website-types.ts");
const panel = read("apps/web/src/public-site/PricingBoundaryPanel.tsx");
const manifest = JSON.parse(read("manifests/business/package-catalogue.json"));
const expected = [
  ["FOUNDATIONAL_ACCORD", "foundational_accord", "Foundational Accord", "R169.99", 169.99, 5],
  ["COLLEGIATE_ORDINANCE", "collegiate_ordinance", "Collegiate Ordinance", "R299.99", 299.99, 10],
  ["CHANCELLORS_WRIT", "chancellors_writ", "Chancellor's Writ", "R399.99", 399.99, 15],
  ["REGENCY_MANDATE", "regency_mandate", "Regency Mandate", "R469.99", 469.99, 15],
  ["ARTISAN_CHARTER", "artisan_charter", "Artisan Charter", "R149.99", 149.99, 5],
  ["GUILDMASTERS_CHARTER", "guildmasters_charter", "Guildmaster's Charter", "R199.99", 199.99, 8],
  ["FREE_DESTINY_MAP", "free_destiny_map", "Free Destiny Map", "R0", 0, 0],
  ["CV_REVAMP", "cv_revamp", "CV Revamp", "R49.99", 49.99, 0],
  ["ACCOMMODATION_SUPPORT", "accommodation_support", "Accommodation Support Package", "R179.00", 179, 8]
];
assert.equal(manifest.packages.length, expected.length, "manifest must be the canonical source for all nine public catalogue entries");
for (const [key, manifestKey, name, priceLabel, numericPrice, applications] of expected) {
  assert.ok(catalogue.includes(`packageKey: "${key}"`), `missing package key ${key}`);
  assert.ok(catalogue.includes(`packageName: "${name}"`), `missing package name ${name}`);
  assert.ok(catalogue.includes(`priceLabel: "${priceLabel}"`), `wrong or missing price ${priceLabel}`);
  assert.ok(catalogue.includes(`managedApplicationCount: ${applications}`), `wrong or missing application entitlement for ${key}`);
  const entry = manifest.packages.find((item) => item.package_id === manifestKey);
  assert.ok(entry, `manifest missing ${manifestKey}`);
  assert.equal(entry.name, name, `manifest name mismatch for ${manifestKey}`);
  assert.equal(entry.price, numericPrice, `manifest price mismatch for ${manifestKey}`);
  assert.equal(entry.managed_application_count, applications, `manifest application entitlement mismatch for ${manifestKey}`);
  assert.ok(Array.isArray(entry.benefits) && entry.benefits.length >= (key === "FREE_DESTINY_MAP" ? 3 : 3), `manifest benefits missing for ${manifestKey}`);
  assert.equal(typeof entry.route_visibility, "string", `manifest route visibility missing for ${manifestKey}`);
}
for (const required of [
  "NSFAS", "CAO", "MAP fallback", "Phoenix fallback", "24-hour monitoring",
  "ATS-aware CV preparation", "Skills-gap analysis", "up to 8 accommodation routes",
  "not a guarantee", "provider permits it"
]) {
  assert.ok(catalogue.toLowerCase().includes(required.toLowerCase()), `missing service/safety contract: ${required}`);
}
assert.ok(types.includes('"FOUNDATIONAL_ACCORD"') && types.includes('"GUILDMASTERS_CHARTER"'));
assert.ok(panel.includes("PUBLIC_PACKAGE_CARDS") && panel.includes("item.includedBenefits.map"));
assert.ok(catalogue.includes("PUBLIC_PACKAGE_CARDS.length !== 9"));
assert.equal(manifest.entitlement_contract?.caO_counting_rule?.startsWith("One CAO parent application"), true);
assert.equal(manifest.entitlement_contract?.accommodation_policy?.includes("8 ACC-01 routes"), true);
assert.equal(manifest.cv_revamp_upgrade_rule?.benefit?.includes("+2 active managed applications/routes"), true);
console.log("PASS: all nine public Kingsmen catalogue entries match canonical prices, managed quantities, route visibility, benefits, and safety boundaries.");
