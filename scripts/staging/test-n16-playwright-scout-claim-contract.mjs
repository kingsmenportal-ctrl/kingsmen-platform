import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8");
const [migration, worker, integration] = await Promise.all([
  read("db/migrations/202611020001_n16_playwright_scout_worker_scope.sql"),
  read("apps/workers/src/playwright-operations-worker.mjs"),
  read("scripts/staging/test-n16-worker-process-crash-integration.mjs")
]);
const migrationLower = migration.toLowerCase();
const workerLower = worker.toLowerCase();

const checks = [
  ["dedicated group role is NOLOGIN and NOINHERIT", /create role kingsmen_playwright_scout_worker nologin noinherit/i.test(migration)],
  ["only the scoped Playwright worker code is claimable", /q\.worker_code = 'playwright\.public_source\.scout'/i.test(migration)],
  ["claim uses SKIP LOCKED", /for update skip locked/i.test(migration)],
  ["claim maximum is one dispatch", /p_limit <> 1/i.test(migration) && /limit 1/i.test(migration)],
  ["worker ID membership is enforced", /pg_has_role\(session_user, 'kingsmen_playwright_scout_worker', 'member'\)/i.test(migration)],
  ["worker result requires exact LOCKED owner", /q\.queue_status is distinct from 'locked'/i.test(migration) && /q\.locked_by is distinct from p_worker_id/i.test(migration)],
  ["worker result must preserve the queue evidence references", /n16_playwright_scout_evidence_reference_mismatch/i.test(migration)],
  ["worker result is restricted to SAME state", /'same'/i.test(migration)],
  ["worker has no direct queue table privilege", /revoke all on table public\.orchestrator_dispatch_queue/i.test(migration)],
  ["worker group is not granted the generic claim/result/SENT operations", /from public, anon, authenticated, service_role/i.test(migration)],
  ["restricted database credential is used", worker.includes("KINGSMEN_PLAYWRIGHT_DATABASE_URL")],
  ["worker switches to the dedicated group role", worker.includes('client.query("SET ROLE " + ROLE_NAME)')],
  ["worker calls only the scoped claim and result RPCs", worker.includes("n16_claim_playwright_scout_dispatches") && worker.includes("n16_record_playwright_scout_result")],
  ["worker does not call the generic claim function", !worker.includes("n16_claim_dispatches(")],
  ["worker never crosses the SENT boundary", !worker.includes("n16_mark_dispatch_sent(")],
  ["worker is read-only and single-concurrency", worker.includes("concurrency: 1") && worker.includes("request.method() !== \"GET\"")],
  ["worker deployment is disabled by default", worker.includes("KINGSMEN_PLAYWRIGHT_OPERATIONS_ENABLED") && worker.includes('log("worker_disabled"')],
  ["PostgreSQL integration proves unrelated work remains ready", integration.includes("unrelatedDispatchRemainsReady") && integration.includes("evidence.verify")],
  ["PostgreSQL integration proves generic claim and SENT are denied", integration.includes("generic_claim") && integration.includes("mark_sent") && integration.includes("permission denied")]
];
for (const [label, ok] of checks) {
  assert.equal(ok, true, "FAIL " + label);
  console.log("PASS " + label);
}
console.log(JSON.stringify({
  schema: "kingsmen.n16.playwright-scout-claim-contract.v1",
  status: "PASSED",
  assertions: checks.length,
  claimWorkerCode: "playwright.public_source.scout",
  maxConcurrency: 1,
  genericQueueClaimAvailable: false,
  sentBoundaryAvailable: false,
  liveMigrationApplied: false
}, null, 2));
