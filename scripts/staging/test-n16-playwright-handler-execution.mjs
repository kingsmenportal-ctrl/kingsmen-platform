#!/usr/bin/env node
import assert from "node:assert/strict";
import { createWorkerHandlerRegistry } from "../../apps/api/dist/orchestrator/worker-runner.js";

const disabledRegistry = createWorkerHandlerRegistry({});
assert.equal(disabledRegistry.has("browser.readonly_scout"), false, "browser task handler must be absent unless explicitly enabled");

const env = {
  KINGSMEN_BROWSER_AUTOMATION_ENABLED: "true",
  KINGSMEN_BROWSER_ALLOWED_ORIGINS: "https://staging.kingsmen.example",
  KINGSMEN_BROWSER_ALLOWED_PATHS: "/,/pricing",
  KINGSMEN_BROWSER_TASK_TIMEOUT_MS: "3000"
};
const registry = createWorkerHandlerRegistry(env);
const handler = registry.get("browser.readonly_scout");
assert.ok(handler, "enabled browser scout handler must be registered");
assert.equal(handler.sideEffect, false);
assert.equal(handler.requiresHumanApproval, false);

const baseDispatch = {
  dispatch_ref: "dispatch:n16-browser-preflight-test",
  run_ref: "run:n16-browser-preflight-test",
  step_ref: "step:n16-browser-preflight-test",
  worker_code: "browser.readonly_scout",
  queue_status: "LOCKED",
  attempt_count: 1,
  max_attempts: 2,
  idempotency_key: "idempotency:n16-browser-preflight-test",
  payload: {},
  evidence_refs: ["ev:n16-browser-preflight-test"],
  locked_by: "test-worker",
  lease_expires_at: null
};
const cases = [
  ["cross-origin", { url: "https://attacker.example/" }],
  ["query-string", { url: "https://staging.kingsmen.example/?token=must-not-be-accepted" }],
  ["unlisted-path", { url: "https://staging.kingsmen.example/admin" }],
  ["insecure-origin", { url: "http://staging.kingsmen.example/" }],
  ["embedded-credentials", { url: "https://user:password@staging.kingsmen.example/" }],
  ["extra-payload-key", { url: "https://staging.kingsmen.example/", headers: { Authorization: "secret" } }]
];
for (const [name, payload] of cases) {
  const outcome = await handler.execute({
    workerId: "test-worker",
    dispatch: { ...baseDispatch, payload },
    now: () => "2026-11-02T00:00:00.000Z"
  });
  assert.equal(outcome.workerStatus, "BLOCKED", name + " must be blocked before browser launch");
  assert.equal(outcome.failureClass, "POLICY", name + " must be classified as policy blocked");
  assert.equal(JSON.stringify(outcome).includes("must-not-be-accepted"), false, "unsafe URL must not enter result payload");
  console.log("PASS", name);
}
console.log(JSON.stringify({ schema: "kingsmen.n16.playwright-handler-preflight.v1", status: "PASSED", cases: cases.length, externalRequests: 0, browserLaunched: false }, null, 2));
