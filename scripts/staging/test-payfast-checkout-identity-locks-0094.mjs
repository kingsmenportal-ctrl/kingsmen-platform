import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(path.join(process.cwd(), "db/migrations/0094_harden_payfast_checkout_identity_locks.sql"), "utf8");
assert.match(migration, /create or replace function public\.create_payfast_sandbox_checkout_bundle/);
assert.match(migration, /perform l\.id[\s\S]*?from public\.candidate_auth_identity_links l[\s\S]*?for share;/, "identity link row must remain locked until transaction end");
assert.match(migration, /select count\(\*\)[\s\S]*?l\.link_status = 'VERIFIED'[\s\S]*?l\.verified_at <= v_now[\s\S]*?l\.verified_by ~\*/);
assert.match(migration, /perform c\.id[\s\S]*?from public\.candidates c[\s\S]*?c\.is_active is true[\s\S]*?for share;/, "candidate active state is locked through checkout");
assert.match(migration, /set search_path = pg_catalog, public, pg_temp/);
assert.match(migration, /revoke all on function public\.create_payfast_sandbox_checkout_bundle[\s\S]*?from public, anon, authenticated;/);
assert.match(migration, /grant execute on function public\.create_payfast_sandbox_checkout_bundle[\s\S]*?to service_role;/);
assert.ok(migration.trimEnd().endsWith("commit;"), "migration must be transactional");
console.log("PASS PayFast checkout identity-lock migration (8 assertions)");
