import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("scripts/staging/kingsmen-restored-schema-inventory.sql", "utf8");
const executableSql = sql.replace(/^\s*--.*$/gm, "").trim();

assert.match(executableSql, /^WITH\b/i, "Schema inventory must be a read-only CTE query.");
assert.match(executableSql, /SELECT jsonb_build_object/i);
assert.match(executableSql, /XMLTABLE\s*\(/i, "Optional migration ledger must be queried dynamically.");
assert.match(executableSql, /query_to_xml\s*\(/i, "Migration ledger fallback must not statically bind a possibly absent relation.");
assert.match(executableSql, /to_regclass\('supabase_migrations\.schema_migrations'\)/i);
assert.doesNotMatch(
  executableSql,
  /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COMMENT|CALL|DO|COPY)\b/i,
  "Schema inventory must not contain mutations or command execution."
);
for (const [label, pattern] of [
  ["columns and defaults", /information_schema\.columns/],
  ["constraints", /pg_constraint/],
  ["indexes", /pg_indexes/],
  ["triggers", /pg_trigger/],
  ["function signatures and definitions", /pg_get_functiondef/],
  ["RLS enabled/forced state", /relrowsecurity.*relforcerowsecurity/s],
  ["policies", /pg_policies/],
  ["table grants", /role_table_grants/],
  ["function grants", /aclexplode/],
  ["extensions", /pg_extension/],
  ["migration ledger", /supabase_migrations\.schema_migrations/],
  ["dynamic ledger query", /query_to_xml\s*\(/i],
  ["XML ledger row extraction", /XMLTABLE\s*\(/i]
]) {
  assert.match(executableSql, pattern, `Inventory missing ${label}.`);
}

for (const safetyFlag of [
  "'readOnly', true",
  "'writesPerformed', false",
  "'migrationsApplied', false",
  "'grantsOrPoliciesChanged', false",
  "'authChanged', false"
]) {
  assert.ok(executableSql.includes(safetyFlag), `Missing safety marker: ${safetyFlag}`);
}
console.log("RESTORED_SCHEMA_INVENTORY_CONTRACT_PASSED");
console.log("- Covers columns, constraints, indexes, triggers, functions, grants, RLS, policies, extensions and migration ledger.");
console.log("- SELECT-only; no schema/data/auth/grant changes.");
