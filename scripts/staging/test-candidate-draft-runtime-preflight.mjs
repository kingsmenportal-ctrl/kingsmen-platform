import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sql = readFileSync(resolve(root, "scripts/staging/kingsmen-candidate-draft-runtime-preflight.sql"), "utf8");
const withoutComments = sql.replace(/^\s*--.*$/gm, "").trim();
const statements = withoutComments.split(";").map((value) => value.trim()).filter(Boolean);

assert.equal(statements.length, 1, "Runtime preflight must stay a single read-only SQL statement.");
assert.match(statements[0], /^WITH\b/i, "Runtime preflight must use a SELECT-only CTE query.");
assert.match(statements[0], /\bSELECT\s+jsonb_build_object\(/i);
assert.doesNotMatch(
  statements[0],
  /^\s*(?:INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|CALL|DO|COPY|VACUUM|ANALYZE)\b/im,
  "Runtime preflight must never execute a mutation or administrative statement."
);
for (const required of [
  "supabase_migrations.schema_migrations",
  "candidate_applications_kingsmen_status_column",
  "candidate_application_draft_answers",
  "get_candidate_application_draft",
  "save_candidate_application_draft",
  "current_verified_kingsmen_candidate_id",
  "APPLICATION_DRAFT_SAVED",
  "migrationReplayAuthorized",
  "backup/restore rehearsal",
  "projectRefMustBeConfirmedInSupabaseDashboard",
  "draftTableColumnCompatibility",
  "draftTableSecurity",
  "pg_policies",
  "has_table_privilege",
  "rpcSignaturesAndSecurityDefiner",
  "pg_get_function_identity_arguments",
  "pg_get_function_result",
  "search_path",
  "migrationReplayAuthorized"
]) {
  assert.ok(sql.includes(required), `Preflight must check/report ${required}.`);
}
assert.match(sql, /'writesPerformed', false/);
assert.match(sql, /'migrationsApplied', false/);
assert.match(sql, /'authOrRlsChanged', false/);
assert.match(sql, /'candidateDraftRuntimeReady', false/);

assert.match(sql, /kingsmen\\.candidate-draft-runtime-preflight\\.v2/);
assert.match(sql, /CASE WHEN to_regclass/);
assert.match(sql, /migrationReplayAuthorized/);

console.log("CANDIDATE_DRAFT_RUNTIME_PREFLIGHT_CONTRACT_PASSED");
console.log("- One SELECT-only SQL statement; no mutation/admin statements.");
console.log("- Covers migration ledger, live schema objects, status column and event type.");
console.log("- Always records migration replay as unauthorized and runtime-ready as false.");
