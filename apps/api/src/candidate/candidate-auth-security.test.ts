import assert from "node:assert/strict";
import test from "node:test";
import {
  createOpaqueSessionToken,
  hashSessionToken,
  verifySessionToken
} from "./candidate-auth";
import {
  CANDIDATE_SESSION_COOKIE,
  clearCandidateSessionCookie,
  readCandidateSessionCookie,
  serializeCandidateSessionCookie
} from "./candidate-auth-service";
import { hashCandidatePassword, verifyCandidatePassword } from "./candidate-password";

test("opaque session tokens are URL-safe, random-looking, and stored as SHA-256 hashes", () => {
  const first = createOpaqueSessionToken();
  const second = createOpaqueSessionToken();

  assert.match(first.token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(first.tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, first.tokenHash);
  assert.notEqual(first.token, second.token);
  assert.equal(first.tokenHash, hashSessionToken(first.token));
  assert.equal(verifySessionToken(first.token, first.tokenHash), true);
  assert.equal(verifySessionToken(second.token, first.tokenHash), false);
});

test("session token hashing rejects short and excessively long inputs", () => {
  assert.throws(() => hashSessionToken("short"));
  assert.throws(() => hashSessionToken("x".repeat(513)));
  assert.equal(verifySessionToken("short", "0".repeat(64)), false);
  assert.equal(verifySessionToken("a".repeat(43), "not-a-hash"), false);
});

test("session cookie serialization enforces HttpOnly, Secure, SameSite and a bounded age", () => {
  const { token } = createOpaqueSessionToken();
  const cookie = serializeCandidateSessionCookie(token, 3600);

  assert.ok(cookie.startsWith(`${CANDIDATE_SESSION_COOKIE}=${token};`));
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Max-Age=3600$/);
  assert.throws(() => serializeCandidateSessionCookie("invalid", 60));
  assert.throws(() => serializeCandidateSessionCookie(token, -1));
  assert.throws(() => serializeCandidateSessionCookie(token, 30 * 24 * 60 * 60 + 1));
});

test("session cookie clearing preserves secure attributes and expires the cookie immediately", () => {
  const cookie = clearCandidateSessionCookie();
  assert.ok(cookie.startsWith(`${CANDIDATE_SESSION_COOKIE}=;`));
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Max-Age=0$/);
});

test("cookie parser accepts exactly one well-formed candidate session cookie", () => {
  const { token } = createOpaqueSessionToken();
  assert.equal(readCandidateSessionCookie(`other=ok; ${CANDIDATE_SESSION_COOKIE}=${token}`), token);
  assert.equal(readCandidateSessionCookie(undefined), null);
  assert.equal(readCandidateSessionCookie(""), null);
  assert.equal(readCandidateSessionCookie(`${CANDIDATE_SESSION_COOKIE}=short`), null);
  assert.equal(readCandidateSessionCookie(`${CANDIDATE_SESSION_COOKIE}=${token}; ${CANDIDATE_SESSION_COOKIE}=${token}`), null);
  assert.equal(readCandidateSessionCookie(`prefix_${CANDIDATE_SESSION_COOKIE}=${token}`), null);
  assert.equal(readCandidateSessionCookie(` ${CANDIDATE_SESSION_COOKIE}=${token}; other=ok`), token);
});

test("cookie parser rejects oversized headers rather than parsing ambiguous input", () => {
  assert.equal(readCandidateSessionCookie(`other=${"x".repeat(16_385)}`), null);
});

test("password hashes are salted and only verify the original password", async () => {
  const password = "Kingsmen-test-password-2026";
  const first = await hashCandidatePassword(password);
  const second = await hashCandidatePassword(password);

  assert.match(first, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyCandidatePassword(password, first), true);
  assert.equal(await verifyCandidatePassword("different-password", first), false);
  assert.equal(await verifyCandidatePassword(password, "not-a-hash"), false);
});

test("password hashing rejects weak or oversized values and verification rejects oversized input", async () => {
  await assert.rejects(() => hashCandidatePassword("short"));
  await assert.rejects(() => hashCandidatePassword("            "));
  await assert.rejects(() => hashCandidatePassword("x".repeat(1025)));
  assert.equal(await verifyCandidatePassword("", "not-a-hash"), false);
  assert.equal(await verifyCandidatePassword("x".repeat(1025), "not-a-hash"), false);
  assert.equal(await verifyCandidatePassword("password", "scrypt$999999$8$1$salt$key"), false);
});
