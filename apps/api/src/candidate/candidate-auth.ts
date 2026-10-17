import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

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


/**
 * Creates an opaque session credential. Persist only its SHA-256 hash; never
 * persist or log the returned raw token. This helper does not create a session.
 */
export function createOpaqueSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

/** Hashes an opaque session token for storage; rejects empty or malformed input. */
export function hashSessionToken(token: string): string {
  if (typeof token !== "string" || token.length < 32 || token.length > 512) {
    throw new Error("Session token is invalid.");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison for fixed-length stored token hashes. */
export function verifySessionToken(token: string, expectedHash: string): boolean {
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash)) return false;
  let actualHash: string;
  try {
    actualHash = hashSessionToken(token);
  } catch {
    return false;
  }
  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}
