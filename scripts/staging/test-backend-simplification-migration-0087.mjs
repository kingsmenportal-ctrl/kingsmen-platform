import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(process.cwd(), "db/migrations/0087_consolidate_redundant_rls_policies_and_index.sql");
const sql = fs.readFileSync(migrationPath, "utf8");
const expected = [
  ["applications", "service_role_all_applications", "applications_service_role_backend_all"],
  ["candidate_profiles", "service_role_all_candidate_profiles", "candidate_profiles_service_role_backend_all"],
  ["candidates", "service_role_all_candidates", "candidates_service_role_backend_all"],
  ["evidence_ledger", "service_role_all_evidence_ledger", "evidence_ledger_service_role_backend_all"],
  ["route_sources", "service_role_all_route_sources", "route_sources_service_role_backend_all"],
  ["workflow_runs", "service_role_all_workflow_runs", "workflow_runs_service_role_backend_all"]
];
for (const [table, legacyPolicy, guardedPolicy] of expected) {
  assert.ok(sql.includes(" ('" + table + "','" + legacyPolicy + "','" + guardedPolicy + "')".trim()), "legacy/guarded mapping exists for " + table);
  assert.ok(sql.includes("drop policy " + legacyPolicy + " on public." + table), "only audited legacy policy removed: " + table);
  assert.ok(sql.includes("policyname=item.guarded_policy"), "guarded replacement checked for " + table);
}
assert.ok(sql.includes("coalesce(qual,'')='true'"), "unconditional USING policy required before removal");
assert.ok(sql.includes("coalesce(with_check,'')='true'"), "unconditional WITH CHECK policy required before removal");
assert.ok(sql.includes("coalesce(qual,'')='kingsmen_security.is_backend_service_role()'"), "replacement USING guard must be exact");
assert.ok(sql.includes("coalesce(with_check,'')='kingsmen_security.is_backend_service_role()'"), "replacement WITH CHECK guard must be exact");
assert.ok(sql.includes("regexp_replace(pg_get_indexdef(i.indexrelid)"), "index names are normalized before comparing definitions");
assert.ok(sql.includes("canonical_def <> duplicate_def"), "normalized duplicate index definitions must match exactly");
assert.ok(sql.includes("duplicate_oid is not null"), "cleanup accepts an index already removed by migration 0090");
assert.ok(sql.includes("drop index if exists public.candidate_identity_review_one_open_request_per_user_idx"), "only the audited duplicate index is removed, idempotently");
assert.ok(sql.includes("pg_constraint where conindid in (canonical_oid, duplicate_oid)"), "index-backed constraints are protected");
assert.match(sql, /begin;/i, "transaction begins");
assert.match(sql, /commit;/i, "transaction commits");
console.log("Backend simplification migration guard: guarded policy checks and index parity assertions passed.");
