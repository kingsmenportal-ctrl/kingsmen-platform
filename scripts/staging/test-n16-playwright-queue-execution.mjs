#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { AuthenticatedWorkerRunner, createWorkerHandlerRegistry } from "../../apps/api/dist/orchestrator/worker-runner.js";

const server = createServer((request, response) => {
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.end();
    return;
  }
  if (request.url !== "/") {
    response.statusCode = 404;
    response.end();
    return;
  }
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end("<!doctype html><html><head><title>Kingsmen Local Browser Worker Fixture</title></head><body><h1>private test fixture text</h1><img src='https://example.invalid/blocked-pixel.png'><form method='post' action='/submit'><label for='email'>Email</label><input id='email' name='email'><button type='submit'>Continue</button></form></body></html>");
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const origin = "http://127.0.0.1:" + address.port;

const env = {
  NODE_ENV: "test",
  KINGSMEN_BROWSER_AUTOMATION_ENABLED: "true",
  KINGSMEN_BROWSER_ALLOW_HTTP_LOCAL_TESTS: "true",
  KINGSMEN_BROWSER_ALLOWED_ORIGINS: origin,
  KINGSMEN_BROWSER_ALLOWED_PATHS: "/",
  KINGSMEN_BROWSER_TASK_TIMEOUT_MS: "5000"
};
const registry = createWorkerHandlerRegistry(env);
const handler = registry.get("browser.readonly_scout");
assert.ok(handler, "explicitly enabled browser worker must be registered");
assert.equal(handler.sideEffect, false);
assert.equal(handler.requiresHumanApproval, false);

const dispatch = {
  dispatch_ref: "dispatch:n16-playwright-queue-execution",
  run_ref: "run:n16-playwright-queue-execution",
  step_ref: "step:n16-playwright-queue-execution",
  worker_code: "browser.readonly_scout",
  queue_status: "LOCKED",
  attempt_count: 1,
  max_attempts: 2,
  idempotency_key: "idempotency:n16-playwright-queue-execution",
  payload: { url: origin + "/" },
  evidence_refs: ["ev:n16-playwright-queue-execution"],
  locked_by: "ci-playwright-worker",
  lease_expires_at: null
};
const recorded = [];
let markSentCalls = 0;
const queue = {
  async claim(workerId, limit) {
    assert.equal(workerId, "ci-playwright-worker");
    assert.equal(limit, 1);
    return [dispatch];
  },
  async markSent() { markSentCalls += 1; throw new Error("read-only scout must never cross SENT"); },
  async recordResult(result) { recorded.push(result); return { action: "ACK" }; },
  async recoverExpiredSent() { return 0; },
  async deadLetterExhaustedLocked() { return 0; },
  async close() {}
};

try {
  const runner = new AuthenticatedWorkerRunner(queue, "ci-playwright-worker", registry);
  const summary = await runner.runOnce(1);
  if (summary.failed !== 0 || summary.succeeded !== 1) {
    console.error(JSON.stringify({
      schema: "kingsmen.n16.playwright-queue-execution.debug.v1",
      summary,
      recordedResults: recorded.map(({ workerStatus, failureClass, failureCode, payload }) => ({ workerStatus, failureClass, failureCode, payload }))
    }, null, 2));
  }
  assert.deepEqual(summary, {
    workerId: "ci-playwright-worker",
    claimed: 1,
    succeeded: 1,
    handedOff: 0,
    failed: 0,
    unknownHandler: 0
  });
  assert.equal(markSentCalls, 0, "read-only browser navigation must not cross external side-effect boundary");
  assert.equal(recorded.length, 1, "worker result must be durably recorded through queue adapter");
  const result = recorded[0];
  assert.equal(result.dispatchRef, dispatch.dispatch_ref);
  assert.equal(result.workerStatus, "SUCCEEDED");
  assert.equal(result.proposedState, "SAME");
  assert.deepEqual(result.evidenceRefs, dispatch.evidence_refs);
  assert.equal(result.payload.handler, "browser.readonly_scout");
  assert.equal(result.payload.httpStatus, 200);
  assert.equal(result.payload.readOnly, true);
  assert.equal(result.payload.contentCaptured, false);
  assert.equal(result.payload.screenshotsCaptured, false);
  assert.equal(typeof result.payload.titleSha256, "string");
  assert.equal(result.payload.titleSha256.length, 64);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("Kingsmen Local Browser Worker Fixture"), false, "raw title must not be recorded");
  assert.equal(serialized.includes("private test fixture text"), false, "page content must not be recorded");
  assert.equal(serialized.includes("blocked-pixel.png"), false, "external resource URL must not be recorded");
  await runner.close();
  console.log(JSON.stringify({
    schema: "kingsmen.n16.playwright-queue-execution.v1",
    status: "PASSED",
    queueClaimed: summary.claimed,
    workerSucceeded: summary.succeeded,
    resultRecorded: recorded.length === 1,
    externalSendBoundaryCrossed: markSentCalls > 0,
    rawPageContentRecorded: false
  }, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
