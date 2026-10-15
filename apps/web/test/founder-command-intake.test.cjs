const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "../../db/migrations/0016_founder_audit_and_command_intake.sql"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/api/founder/commands/request/route.ts"), "utf8");

test("founder command intake persists a request and audit event transactionally", () => {
  assert.match(migration, /create table if not exists public\.founder_command_intake/);
  assert.match(migration, /create or replace function public\.record_founder_command_intake/);
  assert.match(migration, /insert into public\.founder_command_intake/);
  assert.match(migration, /insert into public\.founder_ops_audit_events/);
  assert.match(migration, /requestStatus','WAITING_REVIEW','executed',false/);
});

test("founder operational tables no longer use the permissive migration-0015 policies", () => {
  assert.match(migration, /drop policy if exists founder_command_requests_all/);
  assert.match(migration, /create policy founder_command_requests_founder .*public\.is_kingsmen_founder\(\)/);
  assert.match(migration, /create policy founder_ops_audit_events_founder .*public\.is_kingsmen_founder\(\)/);
  assert.match(migration, /auth\.jwt\(\) -> 'app_metadata'/);
  assert.doesNotMatch(migration, /user_metadata/);
});

test("request API is founder-gated, bounded, and explicitly does not dispatch", () => {
  assert.match(route, /requireFounderAccess\(\)/);
  assert.match(route, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(route, /record_founder_command_intake/);
  assert.match(route, /executed: false/);
  assert.match(route, /No command was approved, dispatched, or executed/);
  assert.doesNotMatch(route, /service_role/i);
});
