#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const shared = read("apps/api/src/commercial/commercial-catalogue.ts");
const finance = read("apps/api/src/finance/pricing-catalog.ts");
const financeTypes = read("apps/api/src/finance/finance-types.ts");
const website = read("apps/api/src/public-website/package-boundaries.ts");
const websiteTypes = read("apps/api/src/public-website/public-website-types.ts");
const doctrine = JSON.parse(read("manifests/business/package-catalogue.json")).commercial_entitlements;

const expected = [
  ["foundational_accord", "FOUNDATIONAL_ACCORD", 16999, 5, 4, 8],
  ["collegiate_ordinance", "COLLEGIATE_ORDINANCE", 29999, 10, 8, 0],
  ["chancellors_writ", "CHANCELLORS_WRIT", 39999, 15, 10, 0],
  ["regency_mandate", "REGENCY_MANDATE", 46999, 15, 12, 0],
  ["artisan_charter", "ARTISAN_CHARTER", 14999, 5, 3, 0],
  ["guildmasters_charter", "GUILDMASTERS_CHARTER", 19999, 8, 5, 0],
  ["cv_revamp", "CV_REVAMP", 4999, null, 0, 0],
];
const rows = [...shared.matchAll(/\{ packageId: "([^"]+)", packageKey: "([^"]+)", planCode: "([^"]+)", name: "([^"]+)", priceCents: (\d+), priorityApplications: (null|\d+), concurrentManagedRoutes30d: (\d+), accommodationSupport: (true|false), includedAccommodationRoutes: (\d+), cvVersions: (\d+), motivationLetters: (\d+), checkoutEnabled: (true|false)/g)];
assert.equal(rows.length, 7, "shared runtime catalogue must contain exactly seven paid products");
assert.equal(doctrine.plans.length, 7, "business contract must contain exactly seven paid products");
for (const [id, key, cents, priority, capacity, accommodation] of expected) {
  const row = rows.find((m) => m[1] === id);
  assert.ok(row, `missing runtime product ${id}`);
  assert.equal(row[2], key, `${id}: package key drift`);
  assert.equal(Number(row[5]), cents, `${id}: integer-cent price drift`);
  assert.equal(row[6] === "null" ? null : Number(row[6]), priority, `${id}: priority allowance drift`);
  assert.equal(Number(row[7]), capacity, `${id}: concurrent route capacity drift`);
  assert.equal(row[8], "true", `${id}: accommodation support must remain available`);
  assert.equal(Number(row[9]), accommodation, `${id}: included accommodation route drift`);
  const manifestPlan = doctrine.plans.find((p) => p.package_id === id);
  assert.ok(manifestPlan, `${id}: missing doctrine plan`);
  assert.equal(manifestPlan.price_cents, cents, `${id}: runtime/manifest price mismatch`);
  assert.equal(manifestPlan.priority_application_count, priority, `${id}: runtime/manifest priority mismatch`);
  assert.equal(manifestPlan.concurrent_managed_route_capacity_30d, capacity, `${id}: runtime/manifest capacity mismatch`);
  assert.equal(manifestPlan.included_accommodation_routes, accommodation, `${id}: runtime/manifest accommodation mismatch`);
}
const checkoutEnabled = rows.filter((r) => r[12] === "true").map((r) => r[1]);
assert.deepEqual(checkoutEnabled, ["cv_revamp"], "paid package checkout must stay disabled until settlement/entitlement proof; CV Revamp remains its separately gated existing product");
assert.ok(shared.includes('name: "Free Destiny Map"') && shared.includes("priceCents: 0"), "free preview must remain separate from seven paid products");
assert.ok(shared.includes("KINGSMEN_PATHWAYS") && /"Higher Education"[\s\S]*"TVET"[\s\S]*"SETA programmes and learnerships"[\s\S]*"Internships"[\s\S]*"Apprenticeships"[\s\S]*"Employment"/.test(shared), "all six opportunity pathways must remain universal");
assert.ok(finance.includes("KINGSMEN_COMMERCIAL_CATALOGUE") && finance.includes("filter((plan) => plan.checkoutEnabled)"), "finance checkout projection must be derived from shared catalogue and fail closed");
assert.ok(website.includes("KINGSMEN_COMMERCIAL_CATALOGUE") && website.includes("map((plan)"), "public pricing projection must be derived from shared catalogue");
assert.ok(website.includes('routeVisibility: "ACTIVATED"') && website.includes("managedExecutionRequiresEntitlement: true"), "full catalogue discovery must be separated from paid managed execution");
assert.ok(websiteTypes.includes("managedExecutionRequiresEntitlement"), "managed execution gate must be explicit in the public contract");
assert.ok(!/packageKey:\s*"ACCOMMODATION_SUPPORT"/.test(website) && !/priceLabel:\s*"R179\.00"/.test(website), "standalone R179 accommodation product must not be offered");
assert.ok(financeTypes.includes('"ACCOMMODATION_SUPPORT_R179"'), "historical legacy code must remain representable for reconciliation");
assert.ok(websiteTypes.includes("priorityApplicationCount") && websiteTypes.includes("concurrentManagedRouteCapacity30d"), "priority allowance and concurrent capacity must be distinct fields");
assert.ok(shared.includes("checkoutEnabled: false"), "unproven package checkout must fail closed");

console.log(JSON.stringify({
  schema: "kingsmen.commercial-catalogue-consolidation.v1",
  passed: true,
  paidProducts: rows.length,
  runtimeAndDoctrineParity: true,
  publicProjection: "shared catalogue",
  financeProjection: "shared catalogue; checkout fail-closed for unproven package plans",
  universalPathways: 6,
  standaloneAccommodationProduct: "removed from public runtime projection; historical code retained",
  notes: ["Source-level contract only; not a TypeScript build, live database parity run, payment proof, deployment, or authenticated E2E."]
}, null, 2));
