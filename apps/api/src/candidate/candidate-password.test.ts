import test from "node:test";
import assert from "node:assert/strict";
import { hashCandidatePassword, verifyCandidatePassword } from "./candidate-password";

test("password hashing uses salted scrypt hashes and verifies the original password", async () => {
  const password = "test-only-password-123!";
  const first = await hashCandidatePassword(password);
  const second = await hashCandidatePassword(password);

  assert.match(first, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyCandidatePassword(password, first), true);
  assert.equal(await verifyCandidatePassword("incorrect-password-123!", first), false);
});

test("password hashing rejects weak or invalid inputs", async () => {
  await assert.rejects(hashCandidatePassword("short"), /between 12 and 1024/);
  await assert.rejects(hashCandidatePassword("            "), /must not be blank/);
  await assert.rejects(hashCandidatePassword("x".repeat(1025)), /between 12 and 1024/);
});

test("password verification fails closed for malformed or unsupported hashes", async () => {
  assert.equal(await verifyCandidatePassword("some-password", "plaintext-password"), false);
  assert.equal(await verifyCandidatePassword("some-password", "scrypt$999999999$8$1$bad$bad"), false);
  assert.equal(await verifyCandidatePassword("", "scrypt$16384$8$1$bad$bad"), false);
  assert.equal(await verifyCandidatePassword("x".repeat(1025), "scrypt$16384$8$1$bad$bad"), false);
});
