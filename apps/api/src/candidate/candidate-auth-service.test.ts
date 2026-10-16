import test from "node:test";
import assert from "node:assert/strict";
import { CANDIDATE_SESSION_COOKIE, CandidateAuthService, clearCandidateSessionCookie, readCandidateSessionCookie, serializeCandidateSessionCookie } from "./candidate-auth-service";
import { hashSessionToken } from "./candidate-auth";
import type { CandidateCredentialRepository } from "./candidate-credential-repository";
import type { CandidateSessionRepository } from "./candidate-session-repository";

const candidateId = "123e4567-e89b-42d3-a456-426614174000";
const sessionId = "223e4567-e89b-42d3-a456-426614174000";
const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

test("successful login persists only a token hash and returns the opaque token once", async () => {
  let savedHash = "";
  const credentials = {
    authenticate: async () => ({ ok: true as const, candidateId })
  } as unknown as CandidateCredentialRepository;
  const sessions = {
    createSession: async (id: string, tokenHash: string, expiresAt: string) => {
      assert.equal(id, candidateId);
      savedHash = tokenHash;
      assert.match(tokenHash, /^[a-f0-9]{64}$/);
      return { sessionId, candidateId, expiresAt };
    }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions, 3600);
  const result = await service.login("candidate@example.test", "test-only-password");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.candidateId, candidateId);
  assert.ok(result.token.length >= 40);
  assert.equal(savedHash, hashSessionToken(result.token));
  assert.notEqual(savedHash, result.token);
});

test("failed credentials do not create a session", async () => {
  let createCalled = false;
  const credentials = {
    authenticate: async () => ({ ok: false as const, reason: "INVALID_CREDENTIALS" as const })
  } as unknown as CandidateCredentialRepository;
  const sessions = {
    createSession: async () => { createCalled = true; throw new Error("should not run"); }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions);
  assert.deepEqual(await service.login("unknown@example.test", "bad-password"), { ok: false, reason: "INVALID_CREDENTIALS" });
  assert.equal(createCalled, false);
});

test("session validation hashes raw tokens and rejects malformed values", async () => {
  const seen: string[] = [];
  const credentials = {} as CandidateCredentialRepository;
  const sessions = {
    findActiveSession: async (hash: string) => {
      seen.push(hash);
      return { candidateId, sessionId, expiresAt: future };
    },
    revokeSession: async (hash: string, reason: string) => {
      seen.push(hash + ":" + reason);
      return true;
    }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions);
  assert.deepEqual(await service.authenticateToken("short"), { authenticated: false });
  const token = "a".repeat(43);
  assert.deepEqual(await service.authenticateToken(token), {
    authenticated: true, candidateId, sessionId, expiresAt: future
  });
  assert.equal(seen[0], hashSessionToken(token));
  assert.equal(await service.logout(token), true);
  assert.equal(seen[1], hashSessionToken(token) + ":LOGOUT");
  assert.equal(await service.logout(undefined), false);
});

test("session cookies are Secure, HttpOnly, SameSite and reject duplicate cookies", () => {
  const token = "a".repeat(43);
  const cookie = serializeCandidateSessionCookie(token, 3600);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(readCandidateSessionCookie(cookie), token);
  assert.equal(readCandidateSessionCookie(`${cookie}; ${cookie}`), null);
  assert.equal(readCandidateSessionCookie(undefined), null);
  assert.match(clearCandidateSessionCookie(), /Max-Age=0/);
  assert.throws(() => serializeCandidateSessionCookie("not-a-token", 3600));
  assert.throws(() => serializeCandidateSessionCookie(token, -1));
});


test("session TTL rejects unsafe, too-short, and excessive lifetimes", () => {
  const credentials = {} as CandidateCredentialRepository;
  const sessions = {} as CandidateSessionRepository;
  for (const ttl of [0, 299, 30 * 24 * 60 * 60 + 1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => new CandidateAuthService(credentials, sessions, ttl), /session TTL/i);
  }
  assert.doesNotThrow(() => new CandidateAuthService(credentials, sessions, 300));
  assert.doesNotThrow(() => new CandidateAuthService(credentials, sessions, 30 * 24 * 60 * 60));
});

test("session persistence failure never returns a usable token and propagates the failure", async () => {
  const credentials = {
    authenticate: async () => ({ ok: true as const, candidateId })
  } as unknown as CandidateCredentialRepository;
  let attemptedHash = "";
  const sessions = {
    createSession: async (_id: string, hash: string) => {
      attemptedHash = hash;
      throw new Error("database unavailable");
    }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions);
  await assert.rejects(service.login("candidate@example.test", "test-only-password"), /database unavailable/);
  assert.match(attemptedHash, /^[a-f0-9]{64}$/);
});

test("login passes bounded-session metadata through to durable persistence", async () => {
  const credentials = {
    authenticate: async () => ({ ok: true as const, candidateId })
  } as unknown as CandidateCredentialRepository;
  let received: unknown;
  const sessions = {
    createSession: async (_id: string, _hash: string, expiry: string, metadata: unknown) => {
      received = metadata;
      return { sessionId, candidateId, expiresAt: expiry };
    }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions, 300);
  const metadata = { deviceLabel: "test device", userAgent: "test agent" };
  const result = await service.login("candidate@example.test", "test-only-password", metadata);
  assert.equal(result.ok, true);
  assert.equal(received, metadata);
});

test("cookie reader rejects oversized headers, duplicate names, and malformed token values", () => {
  const token = "a".repeat(43);
  assert.equal(readCandidateSessionCookie("x".repeat(16_385)), null);
  assert.equal(readCandidateSessionCookie(`${CANDIDATE_SESSION_COOKIE}=${token}; ${CANDIDATE_SESSION_COOKIE}=broken`), null);
  assert.equal(readCandidateSessionCookie(`${CANDIDATE_SESSION_COOKIE}=bad.token`), null);
});


test("candidate account lifecycle persists, authenticates, and revokes one session end to end", async () => {
  const stored = new Map<string, { candidateId: string; sessionId: string; expiresAt: string; revoked: boolean }>();
  const credentials = {
    authenticate: async (email: string, password: string) => {
      assert.equal(email, "candidate@example.test");
      assert.equal(password, "test-only-password");
      return { ok: true as const, candidateId };
    }
  } as unknown as CandidateCredentialRepository;
  const sessions = {
    createSession: async (id: string, tokenHash: string, expiresAt: string) => {
      assert.equal(id, candidateId);
      assert.match(tokenHash, /^[a-f0-9]{64}$/);
      assert.equal(stored.has(tokenHash), false);
      stored.set(tokenHash, { candidateId: id, sessionId, expiresAt, revoked: false });
      return { candidateId: id, sessionId, expiresAt };
    },
    findActiveSession: async (tokenHash: string) => {
      const row = stored.get(tokenHash);
      if (!row || row.revoked || Date.parse(row.expiresAt) <= Date.now()) return null;
      return { candidateId: row.candidateId, sessionId: row.sessionId, expiresAt: row.expiresAt };
    },
    revokeSession: async (tokenHash: string, reason: string) => {
      assert.equal(reason, "LOGOUT");
      const row = stored.get(tokenHash);
      if (!row || row.revoked) return false;
      row.revoked = true;
      return true;
    }
  } as unknown as CandidateSessionRepository;

  const service = new CandidateAuthService(credentials, sessions, 300);
  const login = await service.login("candidate@example.test", "test-only-password");
  assert.equal(login.ok, true);
  if (!login.ok) return;
  const tokenHash = hashSessionToken(login.token);
  assert.ok(stored.has(tokenHash), "only the hash-derived lookup key should be persisted");
  assert.equal(stored.has(login.token), false, "raw session token must never be used as the storage key");

  assert.deepEqual(await service.authenticateToken(login.token), {
    authenticated: true,
    candidateId,
    sessionId,
    expiresAt: login.expiresAt
  });
  assert.equal(await service.logout(login.token), true);
  assert.deepEqual(await service.authenticateToken(login.token), { authenticated: false });
  assert.equal(await service.logout(login.token), false, "a revoked session cannot be revoked twice");
});

test("candidate authentication rejects expired sessions returned as inactive by persistence", async () => {
  const token = "b".repeat(43);
  const tokenHash = hashSessionToken(token);
  let lookupCount = 0;
  const credentials = {} as CandidateCredentialRepository;
  const sessions = {
    findActiveSession: async (hash: string) => {
      lookupCount += 1;
      assert.equal(hash, tokenHash);
      // Repository contract: expired rows must not be returned as active.
      return null;
    }
  } as unknown as CandidateSessionRepository;
  const service = new CandidateAuthService(credentials, sessions);
  assert.deepEqual(await service.authenticateToken(token), { authenticated: false });
  assert.equal(lookupCount, 1);
});
