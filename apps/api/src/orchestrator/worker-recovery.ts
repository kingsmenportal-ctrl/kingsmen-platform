export type FailureClass = "TRANSIENT" | "AUTHENTICATION" | "POLICY" | "INVALID_PAYLOAD" | "PORTAL_BLOCKED" | "DUPLICATE" | "UNKNOWN";
export type RecoveryAction = "RETRY" | "DEAD_LETTER" | "MANUAL_HANDOFF" | "STOP";
export type QueueState = "READY" | "LOCKED" | "SENT" | "ACKED" | "FAILED" | "CANCELLED" | "DEAD_LETTER";
export interface RecoveryInput { failureClass: FailureClass; attemptCount: number; maxAttempts: number; baseDelayMs?: number; maxDelayMs?: number; nowMs?: number; idempotencyKey: string; evidenceRefs: string[]; cancelled?: boolean; portalIssue?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "MANUAL_ONLY"; }
export interface RecoveryDecision { action: RecoveryAction; retryAt?: string; delayMs?: number; reasonCode: string; requiresManualReview: boolean; }

/** Pure policy only: the durable queue must persist decisions transactionally. */
export function decideWorkerRecovery(input: RecoveryInput): RecoveryDecision {
  if (!input.idempotencyKey.trim()) throw new Error("RECOVERY_IDEMPOTENCY_KEY_REQUIRED");
  if (input.evidenceRefs.length === 0) throw new Error("RECOVERY_EVIDENCE_REQUIRED");
  if (!Number.isInteger(input.attemptCount) || input.attemptCount < 0) throw new Error("RECOVERY_ATTEMPT_COUNT_INVALID");
  if (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 0 || input.maxAttempts > 20) throw new Error("RECOVERY_MAX_ATTEMPTS_INVALID");
  if (input.cancelled) return { action: "STOP", reasonCode: "RUN_CANCELLED", requiresManualReview: false };
  if (input.portalIssue) return { action: "MANUAL_HANDOFF", reasonCode: `PORTAL_${input.portalIssue}`, requiresManualReview: true };
  switch (input.failureClass) {
    case "AUTHENTICATION": return { action: "STOP", reasonCode: "AUTHENTICATION_FAILURE_NOT_RETRYABLE", requiresManualReview: true };
    case "POLICY": return { action: "STOP", reasonCode: "POLICY_FAILURE_NOT_RETRYABLE", requiresManualReview: true };
    case "INVALID_PAYLOAD": return { action: "STOP", reasonCode: "INVALID_PAYLOAD_NOT_RETRYABLE", requiresManualReview: true };
    case "PORTAL_BLOCKED": return { action: "MANUAL_HANDOFF", reasonCode: "PORTAL_BLOCKED_REQUIRES_MAP_OR_OPERATOR", requiresManualReview: true };
    case "DUPLICATE": return { action: "STOP", reasonCode: "DUPLICATE_IDEMPOTENTLY_SUPPRESSED", requiresManualReview: false };
    case "TRANSIENT": case "UNKNOWN": break;
  }
  if (input.attemptCount >= input.maxAttempts) return { action: "DEAD_LETTER", reasonCode: "RETRY_BUDGET_EXHAUSTED", requiresManualReview: true };
  const base = clamp(input.baseDelayMs ?? 2000, 100, 60000);
  const cap = clamp(input.maxDelayMs ?? 900000, base, 900000);
  const delayMs = Math.min(cap, base * (2 ** Math.min(input.attemptCount, 16)));
  return { action: "RETRY", retryAt: new Date((input.nowMs ?? Date.now()) + delayMs).toISOString(), delayMs, reasonCode: "TRANSIENT_FAILURE_RETRY_SCHEDULED", requiresManualReview: false };
}

export interface LeaseRecoveryInput { queueState: QueueState; lockedAt?: string | null; nowMs: number; leaseMs: number; }
/** Expired LOCKED leases may be reclaimed; expired SENT work is ambiguous and requires manual reconciliation, never auto-replay. */
export function decideExpiredLease(input: LeaseRecoveryInput): "RECLAIM" | "RECONCILE_MANUALLY" | "NO_ACTION" {
  if (!Number.isFinite(input.nowMs) || !Number.isFinite(input.leaseMs) || input.leaseMs <= 0) throw new Error("LEASE_CLOCK_OR_DURATION_INVALID");
  if (input.queueState !== "LOCKED" && input.queueState !== "SENT") return "NO_ACTION";
  if (!input.lockedAt) return input.queueState === "SENT" ? "RECONCILE_MANUALLY" : "NO_ACTION";
  const lockedMs = Date.parse(input.lockedAt);
  if (!Number.isFinite(lockedMs)) throw new Error("LEASE_TIMESTAMP_INVALID");
  if (input.nowMs - lockedMs < input.leaseMs) return "NO_ACTION";
  return input.queueState === "LOCKED" ? "RECLAIM" : "RECONCILE_MANUALLY";
}
function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) throw new Error("RECOVERY_DELAY_INVALID");
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}
