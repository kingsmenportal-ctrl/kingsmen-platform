import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(process.cwd(), "db/migrations/0087_consolidate_redundant_rls_policies_and_index.sql");
const sql = fs.readFileSync(migrationPath, "utf8");
const expected = [
  ["applications", "service_role_all_applications"],
  ["candidate_profiles", "service_role_all_candidate_profiles"],
  ["candidates", "service_role_all_candidates"],
  ["evidence_ledger", "service_role_all_evidence_ledger"],
  ["route_sources", "service_role_all_route_sources"],
  ["workflow_runs", "service_role_all_workflow_runs"]
];
for (const [table, policy] of expected) {
  assert.match(sql, new RegExp("\\('" + table + "','" + policy + "'\\)"), `guard exists for ${table}.${policy}`);
  assert.match(sql, new RegExp("drop policy " + policy + " on public\\." + table), `only audited policy removed: ${table}.${policy}`);
}
assert.match(sql, /coalesce\(qual,''\)='true'/, "unconditional USING policy required before removal");
assert.match(sql, /coalesce\(with_check,''\)='true'/, "unconditional WITH CHECK policy required before removal");
assert.match(sql, /canonical_def <> duplicate_def/, "duplicate index definitions must match exactly");
assert.match(sql, /drop index public\.candidate_identity_review_one_open_request_per_user_idx/, "only duplicate index is removed");
assert.match(sql, /begin;/i, "transaction begins");
assert.match(sql, /commit;/i, "transaction commits");
console.log("Backend simplification migration guard: 16 assertions passed.");
