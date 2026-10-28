#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migration = fs.readFileSync(path.join(root, "db/migrations/0097_revoke_client_non_dml_privileges.sql"), "utf8");
const runtimeTest = fs.readFileSync(path.join(root, "scripts/security/test-client-non-dml-privileges.sql"), "utf8");

for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"]) {
  assert.match(migration, new RegExp(privilege, "i"), `migration must revoke ${privilege}`);
  assert.match(runtimeTest, new RegExp(privilege, "i"), `runtime test must assert ${privilege} denial`);
}
assert.match(migration, /revoke[\s\S]*?from anon, authenticated/i, "current public tables must revoke client non-DML privileges");
assert.match(migration, /alter default privileges for role postgres in schema public[\s\S]*?revoke[\s\S]*?from anon, authenticated/i, "future public tables must not inherit client non-DML privileges");
assert.doesNotMatch(migration, /revoke all privileges|revoke all on table/i, "do not remove client DML grants without table-by-table review");
assert.match(runtimeTest, /has_table_privilege[\s\S]*?raise exception/i, "runtime test must fail if any client privilege remains");
console.log("Client non-DML privilege migration contract: PASS");
