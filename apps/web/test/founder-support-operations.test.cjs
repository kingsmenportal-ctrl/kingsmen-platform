const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/founder/support/operations/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/founder/support/operations/page.tsx"), "utf8");
const migration = fs.readFileSync(path.join(root, "db/migrations/0023_support_operations_audit.sql"), "utf8");
const controlPlane = fs.readFileSync(path.join(root, "apps/web/src/app/founder/control-plane/page.tsx"), "utf8");

test("support operations endpoints enforce founder authorization and private responses", () => {
  assert.equal((api.match(/requireFounderAccess\(\)/g) || []).length, 2);
  assert.match(api, /founderAccessDenied\(access\)/);
  assert.match(api, /founderPrivateJson/);
  assert.match(api, /cache: "no-store"/);
  assert.match(api, /candidate_support_tickets/);
  assert.match(api, /candidate_support_ticket_events/);
});

test("operator status changes and audit history are atomic and database role-checked", () => {
  assert.match(api, /rpc\/update_support_ticket_as_operator/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.update_support_ticket_as_operator/);
  assert.match(migration, /SUPPORT_OPERATOR_ROLE_REQUIRED/);
  assert.match(migration, /SUPPORT_ACTOR_MISMATCH/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /INSERT INTO public\.candidate_support_ticket_events/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.update_support_ticket_as_operator/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.update_support_ticket_as_operator.*TO authenticated/);
});

test("legacy permissive support-ticket policy is replaced with founder-role RLS", () => {
  assert.match(migration, /DROP POLICY IF EXISTS service_role_all_candidate_support_tickets/);
  assert.match(migration, /founder_support_ticket_select/);
  assert.match(migration, /founder_support_ticket_update/);
  assert.match(migration, /founder_support_ticket_events_insert/);
  assert.match(migration, /auth\.jwt\(\) -> 'app_metadata'/);
});

test("founder support UI exposes assignment, queue filters, resolution, and audit history", () => {
  for (const marker of [
    "Support Team Operations", "Unassigned", "Urgent / high priority", "Active >24 hours",
    "Assigned operator", "Save audited change", "Audit timeline", "No external notification was sent",
    "not automatically mirrored", "RESOLUTION_NOTE", "Refresh queue"
  ]) assert.ok(page.includes(marker), `support operations UI missing ${marker}`);
  assert.match(controlPlane, /href: "\/founder\/support\/operations"/);
});

test("API refuses unconfirmed or malformed support changes and does not claim delivery", () => {
  assert.match(api, /Request too large/);
  assert.match(api, /valid status/);
  assert.match(api, /4–2000 character audit note/);
  assert.match(api, /notificationSent: false/);
  assert.match(api, /No external notification was sent/);
});
