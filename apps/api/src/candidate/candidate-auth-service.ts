import { CandidateCredentialRepository } from "./candidate-credential-repository";
import { createOpaqueSessionToken, hashSessionToken } from "./candidate-auth";
import { CandidateSessionRepository, type CandidateSessionMetadata } from "./candidate-session-repository";

export const CANDIDATE_SESSION_COOKIE = "kingsmen_candidate_session";
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

export type CandidateLoginResult =
  | { ok: true; token: string; expiresAt: string; candidateId: string }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "ACCOUNT_UNAVAILABLE" | "ACCOUNT_LOCKED" };
export type CandidateSessionAuthResult =
  | { authenticated: true; candidateId: string; sessionId: string; expiresAt: string }
  | { authenticated: false };

/** Credential verification and persistent session lifecycle; HTTP/CSRF policy belongs in the route layer. */
export class CandidateAuthService {
  constructor(
    private readonly credentials: CandidateCredentialRepository,
    private readonly sessions: CandidateSessionRepository,
    private readonly sessionTtlSeconds = DEFAULT_SESSION_TTL_SECONDS
  ) {
    if (!Number.isSafeInteger(sessionTtlSeconds) || sessionTtlSeconds < 300 || sessionTtlSeconds > 30 * 24 * 60 * 60) {
      throw new Error("Candidate session TTL must be between 5 minutes and 30 days.");
    }
  }

  async login(email: string, password: string, metadata: CandidateSessionMetadata = {}): Promise<CandidateLoginResult> {
    const auth = await this.credentials.authenticate(email, password);
    if (!auth.ok) return auth;
    const { token, tokenHash } = createOpaqueSessionToken();
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000).toISOString();
    const session = await this.sessions.createSession(auth.candidateId, tokenHash, expiresAt, metadata);
    return { ok: true, token, expiresAt: session.expiresAt, candidateId: session.candidateId };
  }

  async authenticateToken(token: string | null | undefined): Promise<CandidateSessionAuthResult> {
    if (typeof token !== "string" || token.length < 32 || token.length > 512) return { authenticated: false };
    let tokenHash: string;
    try { tokenHash = hashSessionToken(token); } catch { return { authenticated: false }; }
    const session = await this.sessions.findActiveSession(tokenHash);
    return session
      ? { authenticated: true, candidateId: session.candidateId, sessionId: session.sessionId, expiresAt: session.expiresAt }
      : { authenticated: false };
  }

  async logout(token: string | null | undefined): Promise<boolean> {
    if (typeof token !== "string" || token.length < 32 || token.length > 512) return false;
    let tokenHash: string;
    try { tokenHash = hashSessionToken(token); } catch { return false; }
    return this.sessions.revokeSession(tokenHash, "LOGOUT");
  }
}

/** Production-safe cookie attributes; callers must enforce origin and CSRF checks on state-changing routes. */
export function serializeCandidateSessionCookie(token: string, maxAgeSeconds: number): string {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,128}$/.test(token)) throw new Error("Candidate session token is invalid.");
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 0 || maxAgeSeconds > 30 * 24 * 60 * 60) {
    throw new Error("Candidate session cookie max-age is invalid.");
  }
  return `${CANDIDATE_SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearCandidateSessionCookie(): string {
  return `${CANDIDATE_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readCandidateSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader || cookieHeader.length > 16_384) return null;
  const matches = cookieHeader.split(";").map((part) => part.trim())
    .filter((part) => part.startsWith(`${CANDIDATE_SESSION_COOKIE}=`));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(CANDIDATE_SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{40,128}$/.test(value) ? value : null;
}
