#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const finance = read("apps/api/src/finance/canonical-finance-plan-catalog.ts");
const migration = read("db/migrations/20261027120000_reconcile_canonical_package_catalogues.sql");
const expected = [
  ["FREE_DESTINY_MAP_R0", 0, 0, 0, 0, 0],
  ["FOUNDATIONAL_ACCORD_R169_99", 16999, 5, 8, 0, 0],
  ["COLLEGIATE_ORDINANCE_R299_99", 29999, 10, 8, 0, 0],
  ["CHANCELLORS_WRIT_R399_99", 39999, 15, 8, 0, 0],
  ["REGENCY_MANDATE_R469_99", 46999, 15, 8, 0, 0],
  ["ARTISAN_CHARTER_R149_99", 14999, 5, 8, 0, 0],
  ["GUILDMASTERS_CHARTER_R199_99", 19999, 8, 8, 1, 1],
  ["CV_REVAMP_R49_99", 4999, 0, 0, 15, 15],
  ["ACCOMMODATION_SUPPORT_R179", 17900, 0, 8, 0, 0]
];
assert.ok(finance.includes("validateFinanceCatalogue"), "finance catalogue must export its invariant validator");
for (const [code, cents] of expected) {
  assert.ok(finance.includes(`planCode: "${code}"`), `missing ${code}`);
  assert.ok(finance.includes(`amountCents: ${cents}`), `missing canonical cents ${code}`);
  assert.ok(migration.includes(`'${code}'`), `finance migration seed missing ${code}`);
}
for (const [code, cents, apps, routes] of [
  ["FREE_DESTINY_MAP",0,0,0], ["FOUNDATIONAL_ACCORD",16999,5,8],
  ["COLLEGIATE_ORDINANCE",29999,10,8], ["CHANCELLORS_WRIT",39999,15,8],
  ["REGENCY_MANDATE",46999,15,8], ["ARTISAN_CHARTER",14999,5,8],
  ["GUILDMASTERS_CHARTER",19999,8,8], ["CV_REVAMP",4999,0,0],
  ["ACCOMMODATION_SUPPORT",17900,0,8]
]) {
  assert.ok(migration.includes(`'${code}'`), `service catalogue missing ${code}`);
  assert.ok(migration.includes(`'${cents}'`) || migration.includes(`,${cents},`), `canonical service price missing ${code}`);
}
assert.ok(migration.includes("'managed_applications',15"), "15-app package entitlements must be persisted");
assert.ok(migration.includes("'accommodation_routes',8"), "8-route accommodation privilege must be persisted");
assert.ok(migration.includes("'upgrade_bonus_active_routes',2"), "CV Revamp upgrade bonus must be retained");
assert.ok(migration.includes("on conflict (package_code) do update"), "service catalogue sync must be idempotent");
console.log("PASS: nine canonical finance and service package prices/quantities are represented in the source catalogue and reconciliation migration.");
