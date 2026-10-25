import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../../db/migrations/0015_n16_durable_worker_recovery.sql", import.meta.url), "utf8");
const required = [
  ["transaction-safe queue claim function", "function public.n16_claim_dispatches"],
  ["row-level concurrent claim protection", "for update skip locked"],
  ["claim lease persistence", "lease_expires_at"],
  ["atomic worker result persistence", "function public.n16_record_dispatch_result"],
  ["result audit table write", "insert into public.orchestrator_worker_results"],
  ["transactional retry scheduling", "retry_scheduled"],
  ["dead-letter persistence", "queue_status = 'DEAD_LETTER'"],
  ["manual handoff persistence", "insert into public.orchestrator_manual_handoffs"],
  ["expired SENT quarantine", "function public.n16_reconcile_expired_sent"],
  ["expired SENT never replayed", "no automatic replay"],
  ["least-privilege service role grant", "to service_role"],
  ["ordinary user execution revoked", "from public, anon, authenticated"]
];
for (const [label, needle] of required) {
  assert.ok(sql.toLowerCase().includes(needle.toLowerCase()), `Missing ${label}: ${needle}`);
  console.log("PASS", label);
}
assert.ok(!/grant execute on function public\.n16_[^(]+\([^;]+ to authenticated/i.test(sql), "Queue RPC must not be granted to authenticated users");
console.log(`N16 durable queue migration contract: ${required.length}/${required.length} checks passed (static contract only; PostgreSQL runtime not executed).`);
