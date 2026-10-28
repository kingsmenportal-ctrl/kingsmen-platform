#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const finance = read("apps/api/src/finance/canonical-finance-plan-catalog.ts");
const seed = read("db/seeds/n10_finance_payfast_seed.sql");
const migration = read("db/migrations/20261027120000_reconcile_canonical_package_catalogues.sql");
const manifest = JSON.parse(read("manifests/n10/finance-payfast-runtime.json"));
const business = JSON.parse(read("manifests/business/package-catalogue.json"));
const expected = [
  ["FREE_DESTINY_MAP_R0",0,0,0,0,0],
  ["FOUNDATIONAL_ACCORD_R169_99",16999,5,8,0,0],
  ["COLLEGIATE_ORDINANCE_R299_99",29999,10,8,0,0],
  ["CHANCELLORS_WRIT_R399_99",39999,15,8,0,0],
  ["REGENCY_MANDATE_R469_99",46999,15,8,0,0],
  ["ARTISAN_CHARTER_R149_99",14999,5,8,0,0],
  ["GUILDMASTERS_CHARTER_R199_99",19999,8,8,1,1],
  ["CV_REVAMP_R49_99",4999,0,0,15,15],
  ["ACCOMMODATION_SUPPORT_R179",17900,0,8,0,0]
];
assert.equal(business.packages.length, 8, "six core products plus CV Revamp and Accommodation Support must be sellable");
assert.equal(manifest.pricing_locked.length, 9, "finance manifest must list all nine canonical products including Free Destiny Map");
for (const [code,cents,apps,routes,cvs,letters] of expected) {
  assert.ok(finance.includes(`planCode: "${code}"`), `finance catalogue missing ${code}`);
  assert.ok(finance.includes(`amountCents: ${cents}`), `finance price mismatch ${code}`);
  assert.ok(seed.includes(`'${code}'`), `finance seed missing ${code}`);
  assert.ok(migration.includes(`'${code}'`), `reconciliation migration missing ${code}`);
  assert.ok(manifest.pricing_locked.includes(code), `finance manifest missing ${code}`);
}
assert.ok(seed.includes("active=true"), "seed must activate canonical products");
assert.ok(migration.includes("on conflict (package_code) do update"), "service catalogue reconciliation must be idempotent");
assert.ok(migration.includes("'managed_applications',15"), "15-application package quantities must be represented");
assert.ok(migration.includes("'accommodation_routes',8"), "eight-route accommodation allowance must be represented");
assert.ok(migration.includes("'upgrade_bonus_active_routes',2"), "CV Revamp upgrade bonus must be represented");
assert.ok(manifest.checkout_guard.includes("real PayFast sandbox checkout"), "checkout must remain gated on real provider evidence");
assert.ok(manifest.checkout_guard.includes("candidate-isolation"), "candidate isolation must remain a release gate");
const result={schema:"kingsmen.finance-canonical-catalogue-contract.v2",passed:true,canonicalSellablePackageCount:business.packages.length,financePlanCount:expected.length,liveProviderProof:false,failures:[],note:"Source contract only; staging migration and real provider checkout remain unproven."};
console.log(JSON.stringify(result,null,2));
