#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const sql = await readFile(new URL("../../db/migrations/202611020001_n16_worker_least_privilege_role.sql", import.meta.url), "utf8");
assert.match(sql, /create role kingsmen_n16_worker nologin inherit nobypassrls/i, "worker group role must be non-login and must not bypass RLS");
assert.match(sql, /grant usage on schema public to kingsmen_n16_worker/i);
assert.match(sql, /revoke all on table[\s\S]*from kingsmen_n16_worker/i, "worker role must have no direct queue-table privileges");
for (const fn of [
  "n16_claim_dispatches",
  "n16_mark_dispatch_sent",
  "n16_record_dispatch_result",
  "n16_reconcile_expired_sent",
  "n16_deadletter_exhausted_locked"
]) assert.match(sql, new RegExp("grant execute on function public\\." + fn + "[\\s\\S]*?to kingsmen_n16_worker", "i"), "missing least-privilege RPC grant: " + fn);
assert.match(sql, /never store the login password in this file/i);
assert.doesNotMatch(sql, /grant all on table[\s\S]*to kingsmen_n16_worker/i, "worker must not receive broad table grants");
console.log(JSON.stringify({ schema: "kingsmen.validation-report.v1", module: "N16 worker DB role", passed: true, checks: 9, migrationApplied: false }, null, 2));
