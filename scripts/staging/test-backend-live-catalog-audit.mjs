import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const auditPath = path.join(process.cwd(), "scripts/staging/backend-live-catalog-audit.sql");
const sql = fs.readFileSync(auditPath, "utf8");
const uncommented = sql
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*--.*$/gm, "")
  .trim();
const statements = uncommented.split(";").map((statement) => statement.trim()).filter(Boolean);

assert.ok(statements.length >= 18, "read-only catalog audit must retain its full query inventory");
for (const [index, statement] of statements.entries()) {
  assert.match(statement, /^select\b/i, `catalog audit statement ${index + 1} must be SELECT-only`);
}
for (const required of [
  "supabase_migrations.schema_migrations",
  "having count(*) > 1",
  "pg_class",
  "pg_get_constraintdef",
  "pg_indexes",
  "pg_index",
  "pg_policies",
  "pg_get_triggerdef",
  "pg_get_functiondef",
  "information_schema.table_privileges",
  "information_schema.routine_privileges",
  "role_routine_grants",
  "role_usage_grants",
  "pg_default_acl",
  "pg_auth_members",
  "pg_extension",
  "pg_sequences",
  "storage.buckets",
  "schemaname='storage'",
  "pg_event_trigger",
  "cron.job"
]) {
  assert.ok(sql.includes(required), `audit must include ${required}`);
}
assert.ok(
  sql.includes("The live migration runner") ||
  sql.includes("READ ONLY") && sql.includes("ledger does not store the executed SQL body"),
  "audit must state the read-only/provenance boundary"
);

console.log("PASS: backend live-catalog audit is SELECT-only and covers migration labels, object definitions, privileges, Storage, extensions and event triggers.");
