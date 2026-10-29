import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "db/migrations/0090_remove_duplicate_identity_review_open_request_index.sql");
const sql = fs.readFileSync(file, "utf8");

assert.match(sql, /begin;/i, "migration must be transactional");
assert.match(sql, /commit;/i, "migration must commit transaction");
assert.match(sql, /to_regclass\('public\.candidate_identity_review_one_open_request_per_user'\)/, "canonical index must be checked");
assert.match(sql, /to_regclass\('public\.candidate_identity_review_one_open_request_per_user_idx'\)/, "duplicate index must be checked");
assert.match(sql, /pg_get_indexdef\(i\.indexrelid\)/, "definitions must be compared");
assert.match(sql, /i\.indisunique\s+and\s+i\.indisvalid\s+and\s+i\.indisready/i, "both indexes must be valid and unique");
assert.match(sql, /v_canonical_def <> v_duplicate_def/, "definitions must match exactly");
assert.match(sql, /pg_constraint where conindid in \(v_canonical, v_duplicate\)/, "indexes backing constraints must be protected");
assert.match(sql, /drop index public\.candidate_identity_review_one_open_request_per_user_idx/i, "only the duplicate index may be dropped");
assert.doesNotMatch(sql, /drop policy|alter policy/i, "this migration must not alter access policies");
console.log("PASS migration 0090 source contract: exact duplicate index only, validity and constraint preconditions enforced.");
