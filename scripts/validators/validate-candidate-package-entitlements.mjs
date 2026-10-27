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
const expected = [
  ["FOUNDATIONAL_ACCORD", "Foundational Accord", "R169.99", "managedApplicationCount: 5"],
  ["COLLEGIATE_ORDINANCE", "Collegiate Ordinance", "R299.99", "managedApplicationCount: 10"],
  ["CHANCELLORS_WRIT", "Chancellor's Writ", "R399.99", "managedApplicationCount: 15"],
  ["REGENCY_MANDATE", "Regency Mandate", "R469.99", "managedApplicationCount: 15"],
  ["ARTISAN_CHARTER", "Artisan Charter", "R149.99", "managedApplicationCount: 5"],
  ["GUILDMASTERS_CHARTER", "Guildmaster's Charter", "R199.99", "managedApplicationCount: 8"]
];
for (const [key, name, price, count] of expected) {
  assert.ok(catalogue.includes(`packageKey: "${key}"`), `missing package key ${key}`);
  assert.ok(catalogue.includes(`packageName: "${name}"`), `missing package name ${name}`);
  assert.ok(catalogue.includes(`priceLabel: "${price}"`), `wrong or missing price ${price}`);
  assert.ok(catalogue.includes(count), `wrong or missing application entitlement for ${key}`);
}
for (const required of [
  "NSFAS", "CAO", "MAP fallback", "Phoenix fallback", "24-hour monitoring",
  "ATS-aware CV preparation", "Skills-gap analysis", "up to 8 ACC-01 routes",
  "No guarantee", "provider permits it"
]) {
  assert.ok(catalogue.toLowerCase().includes(required.toLowerCase()), `missing service/safety contract: ${required}`);
}
assert.ok(types.includes('"FOUNDATIONAL_ACCORD"') && types.includes('"GUILDMASTERS_CHARTER"'));
assert.ok(panel.includes("PUBLIC_PACKAGE_CARDS") && panel.includes("item.includedBenefits.map"));
assert.ok(catalogue.includes('PUBLIC_PACKAGE_CARDS.length !== 9'));
console.log("PASS: six paid Kingsmen packages, canonical prices, application entitlements, supporting services, and candidate-facing render contract are present.");
