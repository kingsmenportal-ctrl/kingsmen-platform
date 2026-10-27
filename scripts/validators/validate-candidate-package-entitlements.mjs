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
const finance = JSON.parse(read("manifests/n10/finance-payfast-runtime.json"));
const expected = [
  ["FOUNDATIONAL_ACCORD", "foundational_accord", "Foundational Accord", "R169.99", 169.99, 5],
  ["COLLEGIATE_ORDINANCE", "collegiate_ordinance", "Collegiate Ordinance", "R299.99", 299.99, 10],
  ["CHANCELLORS_WRIT", "chancellors_writ", "Chancellor's Writ", "R399.99", 399.99, 15],
  ["REGENCY_MANDATE", "regency_mandate", "Regency Mandate", "R469.99", 469.99, 15],
  ["ARTISAN_CHARTER", "artisan_charter", "Artisan Charter", "R149.99", 149.99, 5],
  ["GUILDMASTERS_CHARTER", "guildmasters_charter", "Guildmaster's Charter", "R199.99", 199.99, 8],
  ["CV_REVAMP", "cv_revamp", "CV Revamp", "R49.99", 49.99, 0],
  ["ACCOMMODATION_SUPPORT", "accommodation_support", "Accommodation Support Package", "R179.00", 179, 0]
];
assert.equal(manifest.packages.length, 8, "business manifest must include six core packages plus CV Revamp and Accommodation Support");
for (const [key, manifestKey, name, priceLabel, numericPrice, applications] of expected) {
  assert.ok(catalogue.includes(`packageKey: "${key}"`), `missing package key ${key}`);
  assert.ok(catalogue.includes(`packageName: "${name}"`), `missing package name ${name}`);
  assert.ok(catalogue.includes(`priceLabel: "${priceLabel}"`), `wrong or missing price ${priceLabel}`);
  assert.ok(catalogue.includes(`managedApplicationCount: ${applications}`), `wrong or missing managed quantity for ${key}`);
  const entry = manifest.packages.find((item) => item.package_id === manifestKey);
  assert.ok(entry, `manifest missing ${manifestKey}`);
  assert.equal(entry.name, name, `manifest name mismatch for ${manifestKey}`);
  assert.equal(entry.price, numericPrice, `manifest price mismatch for ${manifestKey}`);
  assert.equal(entry.managed_application_count, applications, `manifest managed quantity mismatch for ${manifestKey}`);
  assert.ok(Array.isArray(entry.benefits) && entry.benefits.length >= 3, `manifest benefits missing for ${manifestKey}`);
  assert.equal(typeof entry.route_visibility, "string", `manifest route visibility missing for ${manifestKey}`);
}
assert.ok(catalogue.includes('packageKey: "FREE_DESTINY_MAP"') && catalogue.includes('priceLabel: "R0"') && catalogue.includes('managedApplicationCount: 0'));
assert.ok(finance.pricing_locked?.includes("FREE_DESTINY_MAP_R0"));
assert.ok(finance.pricing_locked?.includes("ACCOMMODATION_SUPPORT_R179"), "standalone accommodation price must be included in the canonical finance schedule");
assert.ok(catalogue.includes('packageKey: "ACCOMMODATION_SUPPORT"') && catalogue.includes('priceLabel: "R179.00"') && catalogue.includes('managedApplicationCount: 0'));
for (const required of [
  "NSFAS", "CAO", "MAP fallback", "Phoenix fallback", "24-hour monitoring",
  "ATS-aware CV preparation", "Skills-gap analysis", "up to 8 accommodation routes",
  "not a guarantee", "provider permits it"
]) assert.ok(catalogue.toLowerCase().includes(required.toLowerCase()), `missing service/safety contract: ${required}`);
assert.ok(types.includes('"FOUNDATIONAL_ACCORD"') && types.includes('"GUILDMASTERS_CHARTER"'));
assert.ok(panel.includes("PUBLIC_PACKAGE_CARDS") && panel.includes("item.includedBenefits.map"));
assert.ok(catalogue.includes("LIVE_SERVICE_AVAILABILITY_NOTICE"), "catalogue must declare unverified premium workflow limits");
assert.ok(panel.includes("Service availability") && panel.includes("LIVE_SERVICE_AVAILABILITY_NOTICE"), "candidate pricing page must visibly identify unavailable/conditional premium workflows");
assert.ok(catalogue.includes("PUBLIC_PACKAGE_CARDS.length !== 9"));
assert.equal(manifest.entitlement_contract?.caO_counting_rule?.startsWith("One CAO parent application"), true);
assert.equal(manifest.entitlement_contract?.accommodation_policy?.includes("8 accommodation routes"), true);
console.log("PASS: all eight sellable Kingsmen products match canonical prices, quantities, benefits, and safety boundaries; Free Destiny Map remains preview-only.");
