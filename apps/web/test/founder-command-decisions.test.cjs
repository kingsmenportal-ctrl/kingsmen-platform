const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "../../db/migrations/0017_founder_command_decisions.sql"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/api/founder/commands/decision/route.ts"), "utf8");
const queue = fs.readFileSync(path.join(root, "src/app/api/founder/commands/queue/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/founder/control-plane/command-review/page.tsx"), "utf8");

test("decision RPC enforces founder identity, separate reviewer, and pending-only decisions", () => {
  assert.match(migration, /create table if not exists public\.founder_command_decisions/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /auth\.uid\(\) <> p_reviewer_user_id/);
  assert.match(migration, /v_request\.actor_user_id = auth\.uid\(\)/);
  assert.match(migration, /SEPARATION_OF_DUTIES_REQUIRED/);
  assert.match(migration, /request_status not in \('WAITING_REVIEW','WAITING_APPROVAL'\)/);
  assert.match(migration, /update public\.founder_command_intake/);
  assert.match(migration, /insert into public\.founder_ops_audit_events/);
  assert.match(migration, /revoke all on function public\.decide_founder_command_intake[\s\S]*from public, anon/);
  assert.match(migration, /grant execute on function public\.decide_founder_command_intake[\s\S]*to authenticated/);
  assert.doesNotMatch(migration, /grant .*service_role/i);
});

test("decision API validates bounded input and never dispatches commands", () => {
  assert.match(route, /requireFounderAccess\(\)/);
  assert.match(route, /MAX_BODY_BYTES = 8 \* 1024/);
  assert.match(route, /decide_founder_command_intake/);
  assert.match(route, /p_reviewer_user_id: access\.userId/);
  assert.match(route, /executed: false/);
  assert.match(route, /no operational command was dispatched/i);
  assert.doesNotMatch(route, /service_role/i);
});

test("review queue returns decision history and review UI presents separate-duty decisions", () => {
  assert.match(queue, /founder_command_decisions\?select=/);
  assert.match(queue, /currentUserId: access\.userId/);
  assert.match(page, /Approve request/);
  assert.match(page, /Reject request/);
  assert.match(page, /You cannot decide your own request/);
  assert.match(page, /Decision history/);
  assert.match(page, /does not trigger deployment, payments, messages/);
});
