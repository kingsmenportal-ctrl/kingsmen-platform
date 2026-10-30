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
assert.match(migration, /revoke[\s\S]*?from public, anon, authenticated/i);
assert.match(migration, /alter default privileges for role postgres in schema public[\s\S]*?revoke/i);
assert.doesNotMatch(migration, /alter default privileges for role supabase_admin/i);
assert.match(migration, /supabase_admin owns objects in public/i);
assert.match(migration, /from pg_extension[\s\S]*?extnamespace\s*=\s*'public'::regnamespace/i);
assert.doesNotMatch(migration, /revoke all privileges|revoke all on table/i);
assert.match(runtimeTest, /has_table_privilege[\s\S]*?raise exception/i);
assert.match(runtimeTest, /d\.defaclrole\s*=\s*'postgres'::regrole/i);
assert.doesNotMatch(runtimeTest, /d\.defaclrole\s*=\s*'supabase_admin'::regrole/i);
assert.match(runtimeTest, /c\.relowner\s*=\s*'supabase_admin'::regrole/i);
assert.match(runtimeTest, /p\.proowner\s*=\s*'supabase_admin'::regrole/i);
assert.match(runtimeTest, /from pg_extension[\s\S]*?extnamespace\s*=\s*'public'::regnamespace/i);
console.log("Client non-DML privilege migration contract: PASS");
