import assert from "node:assert/strict";
import { assessWebhookEnvelope, classifyConnectorFailure, validateWorkflowResult, portalFallbackDecision } from "../../apps/api/src/integrations/n14-connector-policy.mjs";

const envelope = { connectorKey: "email-primary", eventId: "event-1", idempotencyKey: "key-1", payloadHash: "b".repeat(64), signatureStatus: "VERIFIED", payload: { purpose: "transactional" } };
assert.equal(assessWebhookEnvelope(envelope).accepted, true);
assert.equal(assessWebhookEnvelope({ ...envelope, signatureStatus: "INVALID" }).accepted, false);
assert.equal(assessWebhookEnvelope({ ...envelope, signatureStatus: "MISSING" }).accepted, false);
assert.equal(assessWebhookEnvelope({ ...envelope, payloadHash: "not-a-hash" }).accepted, false);
assert.equal(assessWebhookEnvelope({ ...envelope, idempotencyKey: "" }).accepted, false);
assert.equal(classifyConnectorFailure({ failureClass: "AUTH" }).action, "BLOCK");
assert.equal(classifyConnectorFailure({ failureClass: "POLICY" }).retry, false);
assert.equal(classifyConnectorFailure({ failureClass: "TRANSIENT", attemptCount: 0, maxAttempts: 3 }).action, "RETRY");
assert.equal(classifyConnectorFailure({ failureClass: "TRANSIENT", attemptCount: 3, maxAttempts: 3 }).action, "DLQ");
assert.equal(classifyConnectorFailure({ failureClass: "OTHER", attemptCount: 0 }).action, "DLQ");
const result = { workerNodeCount: 8, airtableWriteCount: 0, backendResultPostCount: 1, stateChangeAllowed: true, evidenceRefs: ["proof://workflow/1"], idempotencyKey: "key-1" };
assert.equal(validateWorkflowResult(result).accepted, true);
assert.equal(validateWorkflowResult({ ...result, workerNodeCount: 7 }).accepted, false);
assert.equal(validateWorkflowResult({ ...result, airtableWriteCount: 2 }).accepted, false);
assert.equal(validateWorkflowResult({ ...result, backendResultPostCount: 0 }).accepted, false);
assert.equal(validateWorkflowResult({ ...result, stateChangeAllowed: false }).accepted, false);
assert.equal(validateWorkflowResult({ ...result, evidenceRefs: [] }).accepted, false);
assert.equal(portalFallbackDecision("OPEN").route, "PROBE_ONLY");
for (const state of ["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY", "UNKNOWN", "TYPO"]) {
  assert.equal(portalFallbackDecision(state).route, "MAP_MANUAL_REVIEW");
}
console.log("N14 connector contract regression tests passed (23 assertions).");
