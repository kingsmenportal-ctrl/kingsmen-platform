import test from "node:test";
import assert from "node:assert/strict";
import { CandidateAuthService, clearCandidateSessionCookie, readCandidateSessionCookie, serializeCandidateSessionCookie } from "./candidate-auth-service";
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
