import test from "node:test";
import assert from "node:assert/strict";
import { hashCandidatePassword } from "./candidate-password";
import { CandidateCredentialRepository } from "./candidate-credential-repository";

class FakeClient {
  statements: Array<{ sql: string; values?: readonly unknown[] }> = [];
  released = false;
  rowCount: number | null = 1;
  rows: Array<Record<string, unknown>> = [];

  async query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]) {
    this.statements.push({ sql, values });
    if (/select cc\.candidate_id::text/i.test(sql)) return { rows: this.rows as T[], rowCount: this.rows.length };
    return { rows: [] as T[], rowCount: this.rowCount };
  }
  release() { this.released = true; }
}

function setup(row: Record<string, unknown>) {
  const client = new FakeClient();
  client.rows = [row];
  const repository = new CandidateCredentialRepository({ connect: async () => client });
  return { client, repository };
}

const activeRow = (passwordHash: string) => ({
  candidate_id: "123e4567-e89b-42d3-a456-426614174000",
  password_hash: passwordHash,
  auth_status: "ACTIVE",
  failed_login_attempts: 0,
  locked_until: null,
  candidate_active: true
});

test("credential verification normalizes email and clears failed attempts after success", async () => {
  const hash = await hashCandidatePassword("test-only-password-123!");
  const { client, repository } = setup(activeRow(hash));
  const result = await repository.authenticate(" Candidate@Example.test ", "test-only-password-123!");

  assert.deepEqual(result, { ok: true, candidateId: "123e4567-e89b-42d3-a456-426614174000" });
  const select = client.statements.find((entry) => /select cc\.candidate_id::text/i.test(entry.sql));
  assert.deepEqual(select?.values, ["candidate@example.test"]);
  assert.ok(client.statements.some((entry) => /failed_login_attempts = 0, locked_until = null/i.test(entry.sql)));
  assert.equal(client.statements.at(-1)?.sql, "commit");
  assert.equal(client.released, true);
});

test("bad passwords increment attempts and lock an account at the configured threshold", async () => {
  const hash = await hashCandidatePassword("test-only-password-123!");
  const { client, repository } = setup({ ...activeRow(hash), failed_login_attempts: 4 });
  const result = await repository.authenticate("candidate@example.test", "wrong-password-123!");
  assert.deepEqual(result, { ok: false, reason: "ACCOUNT_LOCKED" });
  const lock = client.statements.find((entry) => /set auth_status = 'LOCKED'/i.test(entry.sql));
  assert.ok(lock);
  assert.deepEqual(lock?.values, ["123e4567-e89b-42d3-a456-426614174000", 5, 15]);
});

test("unknown or malformed email does not reveal whether a candidate exists", async () => {
  const { client, repository } = setup(activeRow("unused"));
  assert.deepEqual(
    await repository.authenticate("not-an-email", "some-password-123!"),
    { ok: false, reason: "INVALID_CREDENTIALS" }
  );
  assert.equal(client.statements.length, 0);
});

test("non-active accounts cannot authenticate", async () => {
  const { client, repository } = setup({ ...activeRow("unused"), auth_status: "PENDING" });
  assert.deepEqual(
    await repository.authenticate("candidate@example.test", "some-password-123!"),
    { ok: false, reason: "ACCOUNT_UNAVAILABLE" }
  );
  assert.equal(client.statements.at(-1)?.sql, "commit");
});
