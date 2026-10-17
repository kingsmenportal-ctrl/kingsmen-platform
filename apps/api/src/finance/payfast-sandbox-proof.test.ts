import test from "node:test";
import assert from "node:assert/strict";
import { buildPayFastSandboxProofReport } from "./payfast-sandbox-proof";

const REQUIRED_SCENARIOS = [
  "sandbox_success_complete_itn",
  "sandbox_cancel_return_no_status_change",
  "sandbox_return_pending_until_itn",
  "sandbox_failed_payment_rejected",
  "sandbox_duplicate_itn_rejected",
  "sandbox_invalid_signature_rejected",
  "sandbox_amount_mismatch_rejected",
  "sandbox_replay_idempotency_rejected",
  "refund_requires_human_review",
  "secrets_redacted_from_evidence"
] as const;

test("PayFast sandbox proof report covers every required synthetic scenario", () => {
  const report = buildPayFastSandboxProofReport();
  assert.deepEqual(
    report.scenarios.map((item) => item.scenarioKey).sort(),
    [...REQUIRED_SCENARIOS].sort()
  );
  assert.equal(new Set(report.scenarios.map((item) => item.scenarioKey)).size, REQUIRED_SCENARIOS.length);
  assert.deepEqual(report.failedScenarioKeys, []);
  assert.equal(report.passed, true);
  assert.equal(report.status, "PAYFAST_SANDBOX_PROOF_PASSED");
});

test("PayFast source proof can never represent production readiness or a real charge", () => {
  const report = buildPayFastSandboxProofReport();
  assert.equal(report.productionReady, false);
  assert.equal(report.payfastEnvironment, "sandbox");
  assert.equal(report.livePaymentsEnabled, false);
  assert.equal(report.candidateCharged, false);
  assert.equal(report.refundsAutoApproved, false);
  assert.equal(report.paymentStatusChangesRequireAcceptedItn, true);
  assert.equal(report.secretsReturned, false);
});

test("each sandbox proof scenario emits explicitly sandbox-scoped evidence", () => {
  const report = buildPayFastSandboxProofReport();
  for (const item of report.scenarios) {
    assert.equal(item.evidence.proofPayload.productionReady, false, item.scenarioKey);
    assert.equal(item.evidence.proofPayload.payfastEnvironment, "sandbox", item.scenarioKey);
    assert.equal(item.evidence.proofPayload.livePaymentsEnabled, false, item.scenarioKey);
    assert.equal(item.evidence.proofPayload.candidateCharged, false, item.scenarioKey);
  }
});

test("secret-redaction scenario proves merchant key and passphrase are absent", () => {
  const report = buildPayFastSandboxProofReport();
  const scenario = report.scenarios.find((item) => item.scenarioKey === "secrets_redacted_from_evidence");
  assert.ok(scenario);
  assert.equal(scenario.passed, true);
  assert.equal(scenario.evidence.proofPayload.merchantKeyReturned, false);
  assert.equal(scenario.evidence.proofPayload.passphraseReturned, false);
  assert.equal(Object.prototype.hasOwnProperty.call(scenario.evidence.proofPayload, "merchant_key"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(scenario.evidence.proofPayload, "passphrase"), false);
});

test("proof scenarios disclose synthetic expectations instead of claiming provider execution", () => {
  const report = buildPayFastSandboxProofReport();
  for (const item of report.scenarios) {
    assert.equal(typeof item.expectedOutcome, "string");
    assert.ok(item.expectedOutcome.length > 0);
    assert.equal(typeof item.actualOutcome, "string");
    assert.ok(item.actualOutcome.length > 0);
  }
  assert.equal(report.productionReady, false);
});
