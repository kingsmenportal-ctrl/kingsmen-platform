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

function parseStrictIsoDateTime(value: string): number {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|([+-])(\d{2}):(\d{2}))$/i
  );
  if (!match) throw new Error("expiresAt must be an ISO 8601 date-time with an explicit timezone.");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const zoneHour = Number(match[10] ?? "0");
  const zoneMinute = Number(match[11] ?? "0");

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 || month > 12 ||
    day < 1 || day > daysPerMonth[month - 1] ||
    hour > 23 || minute > 59 || second > 59 ||
    zoneHour > 23 || zoneMinute > 59
  ) {
    throw new Error("expiresAt must be a valid ISO 8601 calendar date-time.");
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error("expiresAt must be a valid ISO 8601 calendar date-time.");
  return timestamp;
}

/**
 * Creates a session record only for a well-formed candidate reference and a
 * future expiry. This helper does not authenticate a candidate by itself;
 * callers must bind candidateId to a verified identity before calling it.
 */
export function createCandidateSession(input: CandidateSessionRequest): CandidateSessionRecord {
  const candidateId = typeof input.candidateId === "string" ? input.candidateId.trim() : "";
  if (!candidateId) throw new Error("candidateId is required.");

  const expiryText = typeof input.expiresAt === "string" ? input.expiresAt.trim() : "";
  const expiry = parseStrictIsoDateTime(expiryText);
  if (expiry <= Date.now()) throw new Error("expiresAt must be in the future.");

  return {
    ...input,
    candidateId,
    sessionId: `sess_${randomUUID()}`,
    deviceLabel: input.deviceLabel?.trim() || "Unknown device",
    // A supplied fingerprint is client-provided evidence, not proof that this
    // device was previously enrolled or cryptographically verified. New
    // sessions therefore start UNTRUSTED; a separate server-side device
    // verification workflow must promote trust.
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
