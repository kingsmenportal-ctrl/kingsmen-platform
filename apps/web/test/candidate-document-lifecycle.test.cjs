const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(path.resolve(__dirname, "../../../db/migrations/0022_candidate_document_application_linkage.sql"), "utf8");
const identityMigration = fs.readFileSync(path.resolve(__dirname, "../../../db/migrations/0023_candidate_auth_private_storage.sql"), "utf8");

test("application-pack document links require an authenticated candidate and unique owned candidate record", () => {
  assert.match(migration, /if auth\.uid\(\) is null then[\s\S]*CANDIDATE_AUTH_REQUIRED/);
  assert.match(migration, /kingsmen_security\.current_authenticated_candidate_id\(\)/);
  assert.match(identityMigration, /auth_user_id uuid UNIQUE REFERENCES auth\.users\(id\)/);
  assert.match(identityMigration, /WHERE ca\.auth_user_id = auth\.uid\(\)/);
});

test("document links reject applications owned by another candidate", () => {
  assert.match(migration, /a\.id = p_application_id and a\.candidate_id = v_candidate_id/);
  assert.match(migration, /APPLICATION_NOT_OWNED_BY_CANDIDATE/);
});

test("retired, deleted, and rejected documents cannot be attached to an application pack", () => {
  assert.match(migration, /v_status in \('ARCHIVED','DELETED','REJECTED'\)/);
  assert.match(migration, /DOCUMENT_NOT_ACTIVE/);
});

test("link operation updates canonical application reference and writes an audit event", () => {
  assert.match(migration, /set application_id = p_application_id, updated_at = now\(\)/);
  assert.match(migration, /'APPLICATION_LINKED'/);
  assert.match(migration, /'previousApplicationId',v_old_application_id/);
});

test("RPC privileges are restricted to authenticated users and operation is idempotent", () => {
  assert.match(migration, /revoke all on function public\.link_candidate_document_to_application\(text,uuid\) from public, anon/);
  assert.match(migration, /grant execute on function public\.link_candidate_document_to_application\(text,uuid\) to authenticated/);
  assert.match(migration, /if v_old_application_id = p_application_id then[\s\S]*'unchanged',true/);
});
