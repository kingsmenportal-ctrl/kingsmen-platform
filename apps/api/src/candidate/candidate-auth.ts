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

export function createCandidateSession(input: CandidateSessionRequest): CandidateSessionRecord {
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.expiresAt) throw new Error("expiresAt is required.");

  return {
    ...input,
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
    deviceLabel: input.deviceLabel ?? "Unknown device",
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