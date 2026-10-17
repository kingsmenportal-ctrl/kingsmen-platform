import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const migrationDir = path.join(root, "db/migrations");
const failures = [];
const check = (label, fn) => {
  try { fn(); console.log("PASS", label); }
  catch (error) { failures.push({ label, message: error.message }); console.error("FAIL", label, "-", error.message); }
};

check("N11 entitlement migration exists", () => assert.ok(exists("db/migrations/0071_n11_service_fulfilment_entitlements.sql")));
check("N12 search-path migration exists", () => assert.ok(exists("db/migrations/0072_n12_function_search_path_hardening.sql")));
check("N11 migration precedes N12 migration", () => {
  const files = fs.readdirSync(migrationDir).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  const n11 = files.indexOf("0071_n11_service_fulfilment_entitlements.sql");
  const n12 = files.indexOf("0072_n12_function_search_path_hardening.sql");
  assert.ok(n11 >= 0 && n12 >= 0 && n11 < n12, "ordered migration chain is missing or out of order");
});
check("N11 activation remains bound to verified PayFast evidence", () => {
  const sql = read("db/migrations/0071_n11_service_fulfilment_entitlements.sql");
  for (const fragment of [
    "n11_grant_entitlement",
    "v_order.status <> 'PAID'",
    "v_payment.event_type <> 'PAYMENT_CONFIRMED'",
    "v_payment.source <> 'VERIFIED_PROVIDER_WEBHOOK'",
    "upper(coalesce(v_payment.provider,'')) <> 'PAYFAST'",
    "server_validation",
    "provider_status",
    "REVOKED"
  ]) assert.ok(sql.includes(fragment), `missing activation guard: ${fragment}`);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.candidate_entitlement_events/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.candidate_entitlement_events/);
});
check("N12 pins all six reviewed trigger guards", () => {
  const sql = read("db/migrations/0072_n12_function_search_path_hardening.sql");
  const alters = [...sql.matchAll(/ALTER FUNCTION public\.[a-z_]+\(\)\s+SET search_path = pg_catalog, public, pg_temp;/g)];
  assert.equal(alters.length, 6, "expected exactly six explicit, pinned search_path alterations");
  for (const name of [
    "prevent_candidate_application_event_mutation",
    "prevent_candidate_outcome_ledger_mutation",
    "guard_candidate_outcome_identity",
    "guard_n09_communication_state",
    "prevent_n09_ledger_delete",
    "n10_prevent_finance_audit_mutation"
  ]) assert.ok(sql.includes(`ALTER FUNCTION public.${name}()`), `missing pinned function: ${name}`);
});
check("N11 and N12 validators are wired into package scripts", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["n11:entitlements:validate"], "node scripts/validators/validate-n11-entitlements.mjs");
  assert.equal(pkg.scripts["n12:security:validate"], "node scripts/validators/validate-n12-search-path-hardening.mjs");
  assert.equal(pkg.scripts["n13:release:validate"], "node scripts/validators/validate-n13-release-gates.mjs");
  assert.equal(pkg.scripts["n13:release:test"], "node --check scripts/tests/n13-release-gates-contract.mjs && node scripts/tests/n13-release-gates-contract.mjs");
});
check("release docs explicitly keep external acceptance gates visible", () => {
  const n11 = read("docs/n11/N11_SERVICE_FULFILMENT_ENTITLEMENTS.md");
  assert.match(n11, /Not approved for staging activation/);
  assert.match(n11, /genuine green Actions run/i);
  assert.match(n11, /PayFast sandbox/i);
});
if (failures.length) {
  console.error(JSON.stringify({ ok: false, productionReady: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    productionReady: false,
    scope: "static source and migration-order contract only",
    externalGatesStillRequired: [
      "genuine green GitHub Actions run",
      "approved authenticated staging isolation and reviewer tests",
      "PayFast sandbox payment and refund reconciliation",
      "full application build and live rollback/transition tests"
    ]
  }, null, 2));
}
