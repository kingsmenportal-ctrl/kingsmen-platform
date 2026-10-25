import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (name) => (await readFile(new URL(`../../db/migrations/${name}`, import.meta.url), "utf8")).toLowerCase();
const adapter = (await readFile(new URL("../../apps/api/src/orchestrator/durable-worker-queue.ts", import.meta.url), "utf8")).toLowerCase();
const migrations = {
  queue: await read("202610250001_n16_durable_worker_recovery.sql"),
  send: await read("202610250002_n16_worker_send_boundary.sql"),
  lease: await read("202610250003_n16_exhausted_lease_recovery.sql")
};
const required = [
  ["transaction-safe queue claim function", migrations.queue, "function public.n16_claim_dispatches"],
  ["row-level concurrent claim protection", migrations.queue, "for update skip locked"],
  ["claim lease persistence", migrations.queue, "lease_expires_at"],
  ["atomic worker result persistence", migrations.queue, "function public.n16_record_dispatch_result"],
  ["result audit table write", migrations.queue, "insert into public.orchestrator_worker_results"],
  ["transactional retry scheduling", migrations.queue, "retry_scheduled"],
  ["dead-letter persistence", migrations.queue, "queue_status = 'dead_letter'"],
  ["manual handoff persistence", migrations.queue, "insert into public.orchestrator_manual_handoffs"],
  ["expired SENT quarantine", migrations.queue, "function public.n16_reconcile_expired_sent"],
  ["expired SENT never replayed", migrations.queue, "automatically replayed"],
  ["least-privilege service role grant", migrations.queue, "to service_role"],
  ["ordinary user execution revoked", migrations.queue, "from public, anon, authenticated"],
  ["lease-checked send boundary", migrations.send, "function public.n16_mark_dispatch_sent"],
  ["expired LOCKED budget exhaustion recovery", migrations.lease, "function public.n16_deadletter_exhausted_locked"],
  ["expired lease dead-letter state", migrations.lease, "queue_status = 'dead_letter'"],
  ["API adapter calls durable claim RPC", adapter, "public.n16_claim_dispatches"],
  ["API adapter records worker results through RPC", adapter, "public.n16_record_dispatch_result"],
  ["API adapter fails closed outside PostgreSQL mode", adapter, "n16_durable_queue_requires_postgres_truth_vault_mode"]
];
for (const [label, source, needle] of required) {
  assert.ok(source.includes(needle), `Missing ${label}: ${needle}`);
  console.log("PASS", label);
}
assert.ok(!migrations.queue.includes(" to authenticated") && !migrations.queue.includes(" to anon"), "Queue RPCs must not be granted to authenticated or anonymous users");
console.log(`N16 durable queue migration contract: ${required.length}/${required.length} checks passed (static contract only; PostgreSQL runtime not executed).`);
