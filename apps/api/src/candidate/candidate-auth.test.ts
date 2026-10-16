import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertCandidateCanLogin,
  createCandidateSession,
  shouldRequireAccountRecovery
} from "./candidate-auth";

test("candidate session IDs use UUID-backed randomness", () => {
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  const first = createCandidateSession({ candidateId: " candidate-1 ", expiresAt });
  const second = createCandidateSession({ candidateId: "candidate-1", expiresAt });

  assert.match(first.sessionId, /^sess_[0-9a-f-]{36}$/i);
  assert.notEqual(first.sessionId, second.sessionId);
  assert.equal(first.candidateId, "candidate-1");
});

test("device fingerprint alone never marks a device trusted", () => {
  const session = createCandidateSession({
    candidateId: "candidate-1",
    deviceFingerprintHash: "client-controlled-hash",
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  });
  assert.equal(session.trustStatus, "UNTRUSTED");
});

test("session creation rejects missing identities and invalid or expired expiry", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  assert.throws(() => createCandidateSession({ candidateId: "  ", expiresAt: future }), /candidateId is required/);
  assert.throws(() => createCandidateSession({ candidateId: "candidate-1", expiresAt: "not-a-date" }), /valid ISO-compatible/);
  assert.throws(() => createCandidateSession({ candidateId: "candidate-1", expiresAt: new Date(Date.now() - 1_000).toISOString() }), /must be in the future/);
});

test("only active accounts pass the login status guard", () => {
  assert.doesNotThrow(() => assertCandidateCanLogin("ACTIVE"));
  for (const status of ["PENDING", "LOCKED", "RECOVERY_REQUIRED", "DISABLED"] as const) {
    assert.throws(() => assertCandidateCanLogin(status), new RegExp(status));
  }
});

test("recovery is required for locked, disabled, and recovery-required accounts", () => {
  assert.equal(shouldRequireAccountRecovery("LOCKED"), true);
  assert.equal(shouldRequireAccountRecovery("DISABLED"), true);
  assert.equal(shouldRequireAccountRecovery("RECOVERY_REQUIRED"), true);
  assert.equal(shouldRequireAccountRecovery("ACTIVE"), false);
});
