import fs from "node:fs";
import assert from "node:assert/strict";

const migrationPath = "db/migrations/0020_n07_durable_outbox_leases_retry.sql";
const routePath = "apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts";
const migration = fs.readFileSync(migrationPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

for (const [label, pattern] of [
  ["idempotent enqueue", /on conflict \(idempotency_key\) do update/i],
  ["service role required", /v_role text := current_user;[\s\S]{0,200}service_role/i],
  ["browser roles cannot access outbox", /revoke all on table public\.airtable_sync_outbox from anon, authenticated/i],
  ["service role only executes enqueue", /grant execute on function public\.n07_enqueue_airtable_mirror[\s\S]{0,160}to service_role/i],
  ["atomic worker claim", /for update skip locked/i],
  ["lease expiration", /lease_expires_at = now\(\) \+ interval '5 minutes'/i],
  ["bounded retry", /max_attempts between 1 and 3/i],
  ["dead-letter terminal state", /status = 'DEAD_LETTER'/i],
  ["exponential retry delay", /make_interval\(secs => least\(900/i],
  ["target restricted to outbound mirror", /direction = 'POSTGRES_TO_AIRTABLE'/i],
  ["payload object only", /jsonb_typeof\(payload\) = 'object'/i],
  ["sensitive and secret payload rejection", /p_payload \?\| array\[.*candidateEmail.*serviceRoleKey/s],
  ["functions use invoker security", /security invoker/i]
]) {
  assert.match(migration, pattern, `Missing required outbox guard: ${label}`);
}

assert.match(route, /Authenticated operator session required/, "route must require caller JWT");
assert.match(route, /functions\/v1\/n07-airtable-enqueue/, "route must proxy to the secured Edge Function");
assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/, "service-role key must not be used by the web route");
assert.match(route, /queued: false/, "route must report queued=false until a database write is verified");
assert.match(route, /status: 503/, "route must return 503 while the adapter is unavailable");
assert.doesNotMatch(route, /queued: true/, "route must not falsely claim a durable enqueue");

console.log("N07 durable outbox contract checks passed (static contract only; not a database/runtime test).");
