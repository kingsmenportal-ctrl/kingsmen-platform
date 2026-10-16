import { randomUUID } from "node:crypto";

export type CandidateAuthStatus = "PENDING" | "ACTIVE" | "LOCKED" | "RECOVERY_REQUIRED" | "DISABLED";
export type DeviceTrustStatus = "TRUSTED" | "UNTRUSTED" | "BLOCKED";

export interface CandidateSessionRequest {
  candidateId: string;
  deviceLabel?: string;
  deviceFingerprintHash?: string;
  ipHash?: string;
  userAgent?: string;
  expiresAt: string;
}

export interface CandidateSessionRecord extends CandidateSessionRequest {
  sessionId: string;
  trustStatus: DeviceTrustStatus;
  createdAt: string;
}

/**
 * Creates a session record only; it does not authenticate a candidate or persist
 * a session. Device metadata is not proof of identity or device trust.
 */
export function createCandidateSession(input: CandidateSessionRequest): CandidateSessionRecord {
  if (typeof input.candidateId !== "string" || !input.candidateId.trim()) {
    throw new Error("candidateId is required.");
  }

  const expiresAtMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    throw new Error("expiresAt must be a valid ISO-compatible timestamp.");
  }
  if (expiresAtMs <= Date.now()) {
    throw new Error("expiresAt must be in the future.");
  }

  return {
    ...input,
    candidateId: input.candidateId.trim(),
    sessionId: `sess_${randomUUID()}`,
    deviceLabel: input.deviceLabel ?? "Unknown device",
    // A fingerprint hash is client/device metadata, not a verified trust signal.
    trustStatus: "UNTRUSTED",
    createdAt: new Date().toISOString()
  };
}

export function shouldRequireAccountRecovery(status: CandidateAuthStatus): boolean {
  return status === "RECOVERY_REQUIRED" || status === "LOCKED" || status === "DISABLED";
}

export function assertCandidateCanLogin(status: CandidateAuthStatus): void {
  if (status !== "ACTIVE") {
    throw new Error(`Candidate account cannot login while status is ${status}.`);
  }
}
