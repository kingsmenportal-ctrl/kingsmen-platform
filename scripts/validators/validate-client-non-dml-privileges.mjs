#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migration = fs.readFileSync(path.join(root, "db/migrations/0097_revoke_client_non_dml_privileges.sql"), "utf8");
const runtimeTest = fs.readFileSync(path.join(root, "scripts/security/test-client-non-dml-privileges.sql"), "utf8");

for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"]) {
  assert.match(migration, new RegExp(privilege, "i"), "migration must revoke " + privilege);
  assert.match(runtimeTest, new RegExp(privilege, "i"), "runtime test must assert " + privilege + " denial");
}
assert.match(migration, /revoke[\s\S]*?from public, anon, authenticated/i,
  "current public tables must revoke non-DML privileges from PUBLIC and client roles");
assert.match(migration, /alter default privileges for role postgres in schema public[\s\S]*?revoke/i,
  "future public tables created by postgres must not inherit client non-DML privileges");
assert.doesNotMatch(migration, /alter default privileges for role supabase_admin/i,
  "Supabase reserves supabase_admin default ACLs; the postgres migration role cannot change them");
assert.match(migration, /supabase_admin owns objects in public/i,
  "migration must fail closed if immutable supabase_admin defaults can apply to public objects");
assert.match(migration, /from pg_extension[\s\S]*?extnamespace\s*=\s*'public'::regnamespace/i,
  "migration must fail closed when extensions remain installed in public");
assert.doesNotMatch(migration, /revoke all privileges|revoke all on table/i,
  "do not remove client DML grants without table-by-table review");
assert.match(runtimeTest, /has_table_privilege[\s\S]*?raise exception/i,
  "runtime test must fail if any current client privilege remains");
assert.match(runtimeTest, /d\.defaclrole\s*=\s*'postgres'::regrole/i,
  "runtime test must assert the modifiable postgres creator defaults");
assert.doesNotMatch(runtimeTest, /d\.defaclrole\s*=\s*'supabase_admin'::regrole/i,
  "runtime test must not expect immutable supabase_admin defaults to be modified");
assert.match(runtimeTest, /c\.relowner\s*=\s*'supabase_admin'::regrole/i,
  "runtime test must fail if supabase_admin owns public relations");
assert.match(runtimeTest, /p\.proowner\s*=\s*'supabase_admin'::regrole/i,
  "runtime test must fail if supabase_admin owns public functions");
assert.match(runtimeTest, /from pg_extension[\s\S]*?extnamespace\s*=\s*'public'::regnamespace/i,
  "runtime test must fail if extensions are installed in public");
console.log("Client non-DML privilege migration contract: PASS");
