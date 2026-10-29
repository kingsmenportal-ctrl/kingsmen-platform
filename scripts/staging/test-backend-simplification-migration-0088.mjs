import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migration = fs.readFileSync(path.join(process.cwd(), "db/migrations/0088_covering_indexes_for_live_foreign_keys.sql"), "utf8");
const expected = [
  ["candidate_identity_review_evidence", "reviewed_by", "candidate_identity_review_evidence_reviewed_by_idx"],
  ["candidate_identity_review_evidence", "supabase_user_id", "candidate_identity_review_evidence_supabase_user_id_idx"],
  ["candidate_master_application_targets", "application_id, candidate_id", "candidate_master_targets_application_owner_idx"]
];
for (const [table, columns, index] of expected) {
  assert.ok(migration.includes("on public." + table + " (" + columns + ")"), "covering index exists for " + table + "(" + columns + ")");
  assert.ok(migration.includes(index), "stable index name exists: " + index);
}
assert.ok(migration.includes("if v_count <> 3"), "fail closed if audited FK definitions drift");
assert.ok(migration.includes("pg_get_constraintdef(con.oid,true)"), "check exact FK definitions before DDL");
assert.match(migration, /begin;/i);
assert.match(migration, /commit;/i);
console.log("PASS migration 0088 source contract: three live FK definitions guarded and covered by indexes.");
