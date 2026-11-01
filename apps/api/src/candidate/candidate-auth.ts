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
 * Creates a session record only for a well-formed candidate reference and a
 * future expiry. This helper does not authenticate a candidate by itself;
 * callers must bind candidateId to a verified identity before calling it.
 */
export function createCandidateSession(input: CandidateSessionRequest): CandidateSessionRecord {
  const candidateId = typeof input.candidateId === "string" ? input.candidateId.trim() : "";
  if (!candidateId) throw new Error("candidateId is required.");

  const expiry = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiry)) throw new Error("expiresAt must be a valid date-time.");
  if (expiry <= Date.now()) throw new Error("expiresAt must be in the future.");

  return {
    ...input,
    candidateId,
    sessionId: `sess_${randomUUID()}`,
    deviceLabel: input.deviceLabel?.trim() || "Unknown device",
    trustStatus: input.deviceFingerprintHash ? "TRUSTED" : "UNTRUSTED",
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
