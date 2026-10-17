import fs from "node:fs";
import assert from "node:assert/strict";

const migration = fs.readFileSync("db/migrations/0071_n11_service_fulfilment_entitlements.sql", "utf8");
const hardening = fs.readFileSync("db/migrations/0072_n12_function_search_path_hardening.sql", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const docs = fs.readFileSync("docs/n11/N11_SERVICE_FULFILMENT_ENTITLEMENTS.md", "utf8");

assert.match(migration, /n11_grant_entitlement/);
assert.match(migration, /VERIFIED_PROVIDER_WEBHOOK/);
assert.match(migration, /server_validation/);
assert.match(migration, /provider_status/);
assert.match(migration, /entitlement events are immutable/);
assert.equal([...hardening.matchAll(/ALTER FUNCTION public\.[a-z_]+\(\)\s+SET search_path = pg_catalog, public, pg_temp;/g)].length, 6);
assert.equal(pkg.scripts["n13:release:validate"], "node scripts/validators/validate-n13-release-gates.mjs");
assert.match(docs, /Not approved for staging activation/);
assert.match(docs, /PayFast sandbox/i);
console.log("N13 release-gate contract tests passed (static source only; not production acceptance).");
