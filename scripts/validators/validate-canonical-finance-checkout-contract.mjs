#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const finance = read("apps/api/src/finance/canonical-finance-plan-catalog.ts");
const migration = read("db/migrations/0084_verified_package_entitlement_activation.sql");
const seed = read("db/migrations/0085_seed_canonical_candidate_packages.sql");
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
for (const [code, cents, apps, routes, cvs, letters] of expected) {
  assert.ok(finance.includes(`planCode: "${code}"`), `missing ${code}`);
  assert.ok(finance.includes(`amountCents: ${cents}`), `missing canonical cents ${code}`);
  assert.ok(seed.includes(`'${code}'`), `migration seed missing ${code}`);
}
for (const token of [
  "candidate_package_entitlements", "accepted is true", "signature_valid is true",
  "ip_valid is true", "amount_valid is true", "duplicate is false",
  "new.amount_gross_cents <> v_order.amount_cents", "ACCEPTED_PAYFAST_ITN_EVIDENCE_REQUIRED",
  "revoke all on public.finance_plan_catalog", "from anon, authenticated"
]) assert.ok(migration.includes(token), `missing secure activation guard: ${token}`);
assert.ok(migration.includes("create trigger finance_payment_activate_package_entitlement"), "payment-to-entitlement trigger must exist");
assert.ok(migration.includes("security definer"), "activation must run inside the database transaction");
console.log("PASS: nine canonical finance plans, integer-ZAR pricing, verified-ITN activation gates and fail-closed finance RLS source contract.");
