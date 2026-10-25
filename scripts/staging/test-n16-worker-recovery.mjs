import assert from "node:assert/strict";
import { decideExpiredLease, decideWorkerRecovery } from "../../apps/api/dist/orchestrator/worker-recovery.js";
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log("PASS", name); }
const base = { attemptCount: 0, maxAttempts: 3, idempotencyKey: "idem-123", evidenceRefs: ["ev:test"], nowMs: Date.parse("2026-10-25T12:00:00.000Z") };
test("transient failure schedules bounded retry", () => { const d = decideWorkerRecovery({ ...base, failureClass: "TRANSIENT" }); assert.equal(d.action, "RETRY"); assert.equal(d.delayMs, 2000); assert.equal(d.retryAt, "2026-10-25T12:00:02.000Z"); });
test("exponential delay is capped", () => { const d = decideWorkerRecovery({ ...base, failureClass: "UNKNOWN", attemptCount: 18, maxAttempts: 20, baseDelayMs: 2000, maxDelayMs: 5000 }); assert.equal(d.action, "RETRY"); assert.equal(d.delayMs, 5000); });
test("retry budget exhaustion dead-letters", () => assert.equal(decideWorkerRecovery({ ...base, failureClass: "TRANSIENT", attemptCount: 3 }).action, "DEAD_LETTER"));
test("authentication failures are never retried", () => { const d = decideWorkerRecovery({ ...base, failureClass: "AUTHENTICATION" }); assert.equal(d.action, "STOP"); assert.equal(d.requiresManualReview, true); });
test("policy failures are never retried", () => assert.equal(decideWorkerRecovery({ ...base, failureClass: "POLICY" }).action, "STOP"));
test("invalid payload failures are never retried", () => assert.equal(decideWorkerRecovery({ ...base, failureClass: "INVALID_PAYLOAD" }).action, "STOP"));
test("CAPTCHA creates manual handoff", () => assert.equal(decideWorkerRecovery({ ...base, failureClass: "TRANSIENT", portalIssue: "CAPTCHA" }).action, "MANUAL_HANDOFF"));
test("cancelled run stops without retry", () => assert.equal(decideWorkerRecovery({ ...base, failureClass: "TRANSIENT", cancelled: true }).action, "STOP"));
test("missing idempotency key fails closed", () => assert.throws(() => decideWorkerRecovery({ ...base, idempotencyKey: "", failureClass: "TRANSIENT" }), /IDEMPOTENCY_KEY_REQUIRED/));
test("missing evidence fails closed", () => assert.throws(() => decideWorkerRecovery({ ...base, evidenceRefs: [], failureClass: "TRANSIENT" }), /EVIDENCE_REQUIRED/));
test("expired LOCKED lease is reclaimable", () => assert.equal(decideExpiredLease({ queueState: "LOCKED", lockedAt: "2026-10-25T11:00:00.000Z", nowMs: Date.parse("2026-10-25T12:00:00.000Z"), leaseMs: 30000 }), "RECLAIM"));
test("expired SENT lease requires reconciliation, never replay", () => assert.equal(decideExpiredLease({ queueState: "SENT", lockedAt: "2026-10-25T11:00:00.000Z", nowMs: Date.parse("2026-10-25T12:00:00.000Z"), leaseMs: 30000 }), "RECONCILE_MANUALLY"));
test("non-active queue states need no lease recovery", () => assert.equal(decideExpiredLease({ queueState: "ACKED", lockedAt: "2026-10-25T11:00:00.000Z", nowMs: Date.parse("2026-10-25T12:00:00.000Z"), leaseMs: 30000 }), "NO_ACTION"));
console.log(`N16 worker recovery tests: ${passed}/${passed} passed`);
