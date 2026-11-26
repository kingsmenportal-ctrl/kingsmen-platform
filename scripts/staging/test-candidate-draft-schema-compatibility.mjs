import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const path = resolve(root, "scripts/staging/kingsmen-candidate-draft-schema-compatibility.sql");
const sql = readFileSync(path, "utf8");
const statement = sql.replace(/^\s*--.*$/gm, "").trim();
const statements = statement.split(";").map(part => part.trim()).filter(Boolean);

assert.equal(statements.length, 1, "Compatibility capture must remain one read-only SQL statement.");
assert.match(statements[0], /^WITH\b/i, "Compatibility capture must be a SELECT-only CTE query.");
assert.match(statements[0], /jsonb_build_object\(/i);
assert.match(statements[0], /pg_get_constraintdef/i);
assert.match(statements[0], /pg_policy/i);
assert.match(statements[0], /has_function_privilege/i);
assert.match(statements[0], /supabase_migrations\.schema_migrations/i);
for (const required of [
  "public.candidate_applications",
  "public.candidate_application_events",
  "public.candidate_application_draft_answers",
  "public.get_candidate_application_draft(uuid)",
  "public.save_candidate_application_draft(uuid,jsonb,integer,text)",
  "kingsmen_security.current_verified_kingsmen_candidate_id()",
  "projectRefMustBeConfirmedInSupabaseDashboard",
  "migrationReplayAuthorized",
  "releaseGateOpened",
  "rawFunctionBodiesRead",
  "candidateRowsRead"
]) {
  assert.ok(sql.includes(required), `Compatibility capture must cover/report ${required}.`);
}
assert.match(sql, /'readOnly', true/);
assert.match(sql, /'writesPerformed', false/);
assert.match(sql, /'migrationsApplied', false/);
assert.match(sql, /'authOrRlsChanged', false/);
assert.match(sql, /'ready', false/);
assert.doesNotMatch(
  statements[0],
  /^\s*(?:INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|CALL|DO|COPY|VACUUM|ANALYZE)\b/im,
  "Compatibility capture must never execute mutation or administrative statements."
);
assert.doesNotMatch(sql, /pg_get_functiondef|prosrc\b/i, "Do not expose raw function bodies.");
console.log("PASS candidate draft schema compatibility capture contract");
