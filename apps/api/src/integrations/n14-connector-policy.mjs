/**
 * N14 connector policy helpers.
 * This module makes trust, retry, idempotency and worker limits explicit.
 * It deliberately does not call external providers or claim that a connector is live.
 */
export const STANDARD_WORKFLOW_NODE_COUNT = 8;
export const ALLOWED_SIGNATURE_STATES = new Set(["VERIFIED", "UNVERIFIED", "INVALID", "MISSING"]);

export function assessWebhookEnvelope(envelope) {
  const reasons = [];
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return { accepted: false, reasons: ["ENVELOPE_NOT_OBJECT"] };
  }
  for (const key of ["connectorKey", "eventId", "idempotencyKey", "payloadHash"]) {
    if (typeof envelope[key] !== "string" || !envelope[key].trim()) reasons.push(`MISSING_${key.toUpperCase()}`);
  }
  if (typeof envelope.payloadHash === "string" && !/^[a-f0-9]{64}$/i.test(envelope.payloadHash)) {
    reasons.push("INVALID_PAYLOAD_HASH");
  }
  if (!ALLOWED_SIGNATURE_STATES.has(envelope.signatureStatus)) reasons.push("UNKNOWN_SIGNATURE_STATUS");
  if (envelope.signatureStatus !== "VERIFIED") reasons.push("SIGNATURE_NOT_VERIFIED");
  if (!envelope.payload || typeof envelope.payload !== "object" || Array.isArray(envelope.payload)) {
    reasons.push("PAYLOAD_NOT_OBJECT");
  }
  return { accepted: reasons.length === 0, reasons };
}

export function classifyConnectorFailure({ failureClass, attemptCount = 0, maxAttempts = 3 } = {}) {
  const attempts = Number.isInteger(attemptCount) && attemptCount >= 0 ? attemptCount : 0;
  const limit = Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : 3;
  if (failureClass === "AUTH" || failureClass === "POLICY" || failureClass === "INVALID_PAYLOAD") {
    return { action: "BLOCK", retry: false, reason: "NON_RETRYABLE_TRUST_OR_POLICY_FAILURE" };
  }
  if (failureClass === "TRANSIENT" && attempts < limit) {
    return { action: "RETRY", retry: true, reason: "TRANSIENT_FAILURE_WITH_BUDGET" };
  }
  return { action: "DLQ", retry: false, reason: attempts >= limit
    ? "RETRY_BUDGET_EXHAUSTED"
    : "UNKNOWN_OR_UNCLASSIFIED_FAILURE" };
}

export function validateWorkflowResult(result) {
  const reasons = [];
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { accepted: false, reasons: ["RESULT_NOT_OBJECT"] };
  }
  if (result.workerNodeCount !== STANDARD_WORKFLOW_NODE_COUNT) reasons.push("WORKER_NODE_COUNT_NOT_EIGHT");
  if (!Number.isInteger(result.airtableWriteCount) || result.airtableWriteCount < 0 || result.airtableWriteCount > 1) {
    reasons.push("AIRTABLE_WRITE_LIMIT_EXCEEDED");
  }
  if (result.backendResultPostCount !== 1) reasons.push("BACKEND_RESULT_POST_COUNT_NOT_ONE");
  if (result.stateChangeAllowed !== true) reasons.push("STATE_TRANSITION_NOT_AUTHORISED");
  if (!Array.isArray(result.evidenceRefs) || result.evidenceRefs.length === 0 ||
      result.evidenceRefs.some(ref => typeof ref !== "string" || !ref.trim())) {
    reasons.push("EVIDENCE_REFERENCE_REQUIRED");
  }
  if (typeof result.idempotencyKey !== "string" || !result.idempotencyKey.trim()) {
    reasons.push("IDEMPOTENCY_KEY_REQUIRED");
  }
  return { accepted: reasons.length === 0, reasons };
}

export function portalFallbackDecision(portalHealth) {
  const known = new Set(["OPEN", "OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY", "UNKNOWN"]);
  if (!known.has(portalHealth)) {
    return { route: "MAP_MANUAL_REVIEW", reason: "UNRECOGNISED_PORTAL_STATE_FAIL_CLOSED" };
  }
  if (portalHealth === "OPEN") return { route: "PROBE_ONLY", reason: "OPEN_PORTAL_DOES_NOT_AUTHORISE_AUTOMATED_SUBMISSION" };
  return { route: "MAP_MANUAL_REVIEW", reason: `${portalHealth}_REQUIRES_MANUAL_FALLBACK` };
}
