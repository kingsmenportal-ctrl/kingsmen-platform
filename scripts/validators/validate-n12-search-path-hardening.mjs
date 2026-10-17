import fs from "node:fs";
import assert from "node:assert/strict";

const migration = fs.readFileSync("db/migrations/0072_n12_function_search_path_hardening.sql", "utf8");
const functions = [
  "prevent_candidate_application_event_mutation",
  "prevent_candidate_outcome_ledger_mutation",
  "guard_candidate_outcome_identity",
  "guard_n09_communication_state",
  "prevent_n09_ledger_delete",
  "n10_prevent_finance_audit_mutation",
];
for (const name of functions) {
  const statement = new RegExp(
    "ALTER\\s+FUNCTION\\s+public\\." + name + "\\s*\\(\\)\\s+SET\\s+search_path\\s*=\\s*pg_catalog\\s*,\\s*public\\s*,\\s*pg_temp\\s*;",
    "i",
  );
  assert.match(migration, statement, "Missing pinned search_path for " + name);
}
assert.equal((migration.match(/ALTER\\s+FUNCTION/gi) || []).length, functions.length,
  "Migration must alter exactly the six reviewed trigger functions");
assert.match(migration, /pg_catalog, public, pg_temp/);
assert.match(migration, /RLS-deny-by-default finance tables unchanged/);
console.log("N12 validator passed: six reviewed trigger functions pin search_path; no table policy or data changes.");
