#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(readFileSync(resolve(root, "manifests/business/package-catalogue.json"), "utf8"));
const contract = manifest.commercial_entitlements;
assert.ok(contract, "commercial_entitlements contract must exist");
assert.equal(contract.currency, "ZAR");
assert.equal(contract.amount_unit, "integer_cents");
assert.equal(contract.all_packages_discover_all_six_pathways, true);
assert.equal(contract.priority_applications_and_concurrent_routes_are_distinct, true);

const expected = [
  ["foundational_accord", 16999, 5, 4, 8],
  ["collegiate_ordinance", 29999, 10, 8, 0],
  ["chancellors_writ", 39999, 15, 10, 0],
  ["regency_mandate", 46999, 15, 12, 0],
  ["artisan_charter", 14999, 5, 3, 0],
  ["guildmasters_charter", 19999, 8, 5, 0],
  ["cv_revamp", 4999, null, 0, 0],
];
assert.equal(contract.plans.length, expected.length, "all seven paid products must be declared exactly once");
const byId = new Map(contract.plans.map((p) => [p.package_id, p]));
assert.equal(byId.size, expected.length, "duplicate package_id in commercial entitlement contract");
for (const [id, cents, priority, capacity, accommodation] of expected) {
  const p = byId.get(id);
  assert.ok(p, `missing plan ${id}`);
  assert.equal(p.price_cents, cents, `${id}: price must be stored as integer cents`);
  assert.equal(p.priority_application_count, priority, `${id}: priority allowance drift`);
  assert.equal(p.concurrent_managed_route_capacity_30d, capacity, `${id}: concurrent capacity drift`);
  assert.equal(p.included_accommodation_routes, accommodation, `${id}: included accommodation drift`);
  assert.equal(p.accommodation_support, true, `${id}: accommodation support must remain discoverable`);
  assert.ok(Number.isInteger(p.price_cents), `${id}: price_cents must be an integer`);
}
const cv = byId.get("cv_revamp");
assert.equal(cv.standalone_cv_versions, 15);
assert.equal(cv.standalone_motivation_letters, 15);
assert.equal(cv.target_business_days_after_complete_intake, 3);
assert.equal(cv.cv_revamp_upgrade_bonus_routes, 0, "CV Revamp standalone product must not grant its own upgrade bonus");
for (const p of contract.plans.filter((x) => x.package_id !== "cv_revamp")) {
  assert.equal(p.cv_revamp_upgrade_bonus_routes, 2, `${p.package_id}: eligible bonus policy drift`);
}
assert.match(contract.bonus_eligibility, /verified CV Revamp ownership/i);
assert.match(contract.historical_snapshots, /Never rewrite/i);
assert.ok(manifest.access_law.includes("full discovery access to all six pathways"));
assert.ok(manifest.core_gates_visible_to_all.length === 6, "the six pathway catalogue must remain universal");
assert.ok(manifest.live_database_findings.service_packages.includes("Trace all readers/writers"));
assert.ok(manifest.live_database_findings.route_visibility.includes("Do not change until proven"));
console.log("PASS backend simplification commercial contract: 7 paid products, integer-cent prices, distinct priority/capacity, accommodation, CV Revamp and universal access.");
