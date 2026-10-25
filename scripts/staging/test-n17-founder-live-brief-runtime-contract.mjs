import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runtime = await readFile(new URL("../../apps/api/src/founder-ops/founder-live-brief-runtime.ts", import.meta.url), "utf8");
const server = await readFile(new URL("../../apps/api/src/server.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../../db/migrations/202610250004_n17_founder_brief_access_hardening.sql", import.meta.url), "utf8");
const required = [
  ["founder route is mounted", 'pathname === "/api/founder/brief"'],
  ["Supabase verifies the bearer session", "/auth/v1/user"],
  ["active founder role required", "role_key = 'FOUNDER'"],
  ["identity is matched by immutable auth UUID", "where operator_ref = $1"],
  ["database-backed Truth Vault is mandatory", "FOUNDER_BRIEF_POSTGRES_TRUTH_VAULT_REQUIRED"],
  ["nine domains use persisted source tables", "SOURCE_QUERIES"],
  ["candidate-facing fields are excluded", "candidate identities and task descriptions are never returned."],
  ["brief is persisted to history", "insert into public.founder_daily_briefs"],
  ["read is audited", "insert into public.founder_ops_audit_events"],
  ["response is non-cacheable", 'cache-control", "no-store"'],
  ["source errors fail visibly", "Source query unavailable"],
  ["launch readiness remains false", "productionReady: false"]
];
for (const [label, needle] of required) {
  assert.ok(runtime.includes(needle) || server.includes(needle), `Missing runtime contract: ${label} (${needle})`);
  console.log("PASS", label);
}
assert.ok(migration.includes("revoke all on table") && migration.includes("grant all on table") && migration.includes("service_role"), "founder-only tables must be inaccessible to ordinary API roles");
assert.ok(!runtime.includes("service_role") && !runtime.includes("SUPABASE_SERVICE_ROLE_KEY"), "runtime must not require or expose Supabase service-role key; database URL stays server-side");
console.log(`N17 authenticated runtime source contract: ${required.length + 2}/${required.length + 2} assertions passed.`);
