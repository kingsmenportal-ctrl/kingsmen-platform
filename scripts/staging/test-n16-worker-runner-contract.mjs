import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runner = (await readFile(new URL("../../apps/api/src/orchestrator/worker-runner.ts", import.meta.url), "utf8"));
const main = (await readFile(new URL("../../apps/api/src/orchestrator/worker-main.ts", import.meta.url), "utf8"));
const queue = (await readFile(new URL("../../apps/api/src/orchestrator/durable-worker-queue.ts", import.meta.url), "utf8"));
const checks = [
  ["runner uses durable queue adapter", runner, "DurableWorkerQueue"],
  ["worker code must be registered", runner, "this.registry.get(dispatch.worker_code)"],
  ["unknown handlers become manual handoffs", runner, "WORKER_CODE_NOT_REGISTERED"],
  ["human approval is required before SENT", runner, "HUMAN_APPROVAL_OR_APPROVAL_EVIDENCE_REQUIRED"],
  ["approval must have linked evidence", runner, "evidenceRefs.includes(approvalEvidenceRef)"],
  ["side effects cross explicit SENT boundary", runner, "this.queue.markSent(dispatch.dispatch_ref, this.workerId, 120)"],
  ["missing evidence blocks execution", runner, "if (evidenceRefs.length === 0)"],
  ["staging probe requires staging environment", runner, 'env.KINGSMEN_WORKER_ENV === "staging"'],
  ["staging probe must be explicitly enabled", runner, "KINGSMEN_N16_ENABLE_SYNTHETIC_PROBE"],
  ["staging probe is synthetic-only", runner, "dispatch.payload.syntheticOnly !== true"],
  ["server-only DB secret is mandatory", runner, "N16_SERVER_ONLY_DATABASE_SECRET_REQUIRED"],
  ["durable PostgreSQL mode is mandatory", runner, "N16_POSTGRES_TRUTH_VAULT_MODE_REQUIRED"],
  ["worker can recover expired SENT and exhausted LOCKED", runner, "this.queue.recoverExpiredSent(50)"],
  ["long-running process has graceful shutdown", main, 'process.once("SIGTERM", stop)'],
  ["polling loop has controlled batch size", main, "KINGSMEN_WORKER_BATCH_SIZE"],
  ["queue uses server-side database connection", queue, "process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL"]
];
for (const [label, source, needle] of checks) {
  assert.ok(source.includes(needle), `Missing ${label}: ${needle}`);
  console.log("PASS", label);
}
assert.ok(!runner.includes("eval("), "Worker must not evaluate dynamic code");
assert.ok(!runner.includes("import("), "Worker must not dynamically import handlers");
console.log(`N16 worker runner static contract: ${checks.length + 2}/${checks.length + 2} passed. This is a source contract, not live worker evidence.`);
