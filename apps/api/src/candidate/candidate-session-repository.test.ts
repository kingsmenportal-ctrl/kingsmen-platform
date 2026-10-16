import test from "node:test";
import assert from "node:assert/strict";
import { CandidateSessionRepository } from "./candidate-session-repository";

class FakeClient {
  statements: Array<{ sql: string; values?: readonly unknown[] }> = [];
  released = false;
  rowCount: number | null = 1;
  rows: Array<Record<string, unknown>> = [];

  async query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]) {
    this.statements.push({ sql, values });
    if (/returning id::text, candidate_id::text, expires_at::text/i.test(sql)) {
      return { rows: this.rows as T[], rowCount: this.rowCount };
    }
    return { rows: [] as T[], rowCount: this.rowCount };
  }

  release() { this.released = true; }
}

function setup() {
  const client = new FakeClient();
  const repository = new CandidateSessionRepository({ connect: async () => client });
  return { client, repository };
}

const candidateId = "123e4567-e89b-42d3-a456-426614174000";
const tokenHash = "a".repeat(64);

test("session creation stores only a token hash and scopes backend RLS claims to a transaction", async () => {
  const { client, repository } = setup();
  client.rows = [{
    id: "987e4567-e89b-42d3-a456-426614174000",
    candidate_id: candidateId,
    expires_at: new Date(Date.now() + 60_000).toISOString()
  }];

  const session = await repository.createSession(
    candidateId,
    tokenHash,
    new Date(Date.now() + 60_000).toISOString(),
    { deviceLabel: "Test browser", userAgent: "test-agent" }
  );

  assert.equal(session.candidateId, candidateId);
  const insert = client.statements.find((entry) => /insert into candidate_sessions/i.test(entry.sql));
  assert.ok(insert);
  assert.ok(insert.values?.includes(tokenHash));
  assert.ok(!insert.values?.includes("raw-session-token"));
  assert.ok(client.statements.some((entry) => /set_config\('app.kingsmen_role', 'service_role', true\)/i.test(entry.sql)));
  assert.ok(client.statements.some((entry) => /set_config\('app.service_context', 'backend_api', true\)/i.test(entry.sql)));
  assert.equal(client.statements.at(-1)?.sql, "commit");
  assert.equal(client.released, true);
});

test("active session lookup rejects malformed hashes without touching the database", async () => {
  const { client, repository } = setup();
  assert.equal(await repository.findActiveSession("not-a-hash"), null);
  assert.equal(client.statements.length, 0);
});

test("session revocation updates only an unrevoked matching token hash", async () => {
  const { client, repository } = setup();
  assert.equal(await repository.revokeSession(tokenHash, "LOGOUT"), true);
  const update = client.statements.find((entry) => /update candidate_sessions/i.test(entry.sql));
  assert.ok(update);
  assert.match(update!.sql, /revoked_at is null/i);
  assert.deepEqual(update!.values, [tokenHash, "LOGOUT"]);
  assert.equal(client.statements.at(-1)?.sql, "commit");
});

test("invalid candidate identities and expired sessions are rejected before database access", async () => {
  const { client, repository } = setup();
  await assert.rejects(
    repository.createSession("candidate-from-browser", tokenHash, new Date(Date.now() + 60_000).toISOString()),
    /Candidate identity is invalid/
  );
  await assert.rejects(
    repository.createSession(candidateId, tokenHash, new Date(Date.now() - 60_000).toISOString()),
    /Session expiry must be in the future/
  );
  assert.equal(client.statements.length, 0);
});


class FailureFakeClient extends FakeClient {
  failOn: RegExp | null = null;
  override async query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]) {
    this.statements.push({ sql, values });
    if (this.failOn?.test(sql)) throw new Error("simulated database failure");
    if (/returning id::text, candidate_id::text, expires_at::text/i.test(sql)) {
      return { rows: this.rows as T[], rowCount: this.rowCount };
    }
    return { rows: [] as T[], rowCount: this.rowCount };
  }
}

test("session creation validates token hash and metadata is bounded before persistence", async () => {
  const client = new FakeClient();
  const repository = new CandidateSessionRepository({ connect: async () => client });
  await assert.rejects(repository.createSession(candidateId, "raw-token", new Date(Date.now() + 60_000).toISOString()), /Session token hash is invalid/);
  assert.equal(client.statements.length, 0);
});

test("session creation bounds every optional metadata field and commits durable row", async () => {
  const { client, repository } = setup();
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  client.rows = [{ id: "987e4567-e89b-42d3-a456-426614174000", candidate_id: candidateId, expires_at: expiresAt }];
  await repository.createSession(candidateId, tokenHash, expiresAt, {
    deviceLabel: "d".repeat(200),
    deviceFingerprintHash: "f".repeat(300),
    ipHash: "i".repeat(300),
    userAgent: "u".repeat(600)
  });
  const insert = client.statements.find((entry) => /insert into candidate_sessions/i.test(entry.sql));
  assert.ok(insert);
  assert.equal((insert!.values?.[4] as string).length, 120);
  assert.equal((insert!.values?.[5] as string).length, 256);
  assert.equal((insert!.values?.[6] as string).length, 256);
  assert.equal((insert!.values?.[7] as string).length, 512);
  assert.equal(client.statements.at(-1)?.sql, "commit");
});

test("active session lookup constrains query to unrevoked, unexpired rows and touches last-seen", async () => {
  const { client, repository } = setup();
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  client.rows = [{ id: "987e4567-e89b-42d3-a456-426614174000", candidate_id: candidateId, expires_at: expiresAt }];
  const result = await repository.findActiveSession(tokenHash);
  assert.ok(result);
  const lookup = client.statements.find((entry) => /update candidate_sessions/i.test(entry.sql));
  assert.ok(lookup);
  assert.match(lookup!.sql, /revoked_at is null/i);
  assert.match(lookup!.sql, /expires_at > now\(\)/i);
  assert.match(lookup!.sql, /set last_seen_at = now\(\)/i);
  assert.deepEqual(lookup!.values, [tokenHash]);
});

test("revocation reports false when no session row was updated", async () => {
  const { client, repository } = setup();
  client.rowCount = 0;
  assert.equal(await repository.revokeSession(tokenHash, "LOGOUT"), false);
  assert.equal(client.statements.at(-1)?.sql, "commit");
});

test("session persistence failure rolls back and always releases the database connection", async () => {
  const client = new FailureFakeClient();
  client.failOn = /insert into candidate_sessions/i;
  const repository = new CandidateSessionRepository({ connect: async () => client });
  await assert.rejects(
    repository.createSession(candidateId, tokenHash, new Date(Date.now() + 60_000).toISOString()),
    /simulated database failure/
  );
  assert.ok(client.statements.some((entry) => entry.sql === "rollback"));
  assert.equal(client.statements.some((entry) => entry.sql === "commit"), false);
  assert.equal(client.released, true);
});

test("active-session lookup failure rolls back instead of committing a partial operation", async () => {
  const client = new FailureFakeClient();
  client.failOn = /update candidate_sessions/i;
  const repository = new CandidateSessionRepository({ connect: async () => client });
  await assert.rejects(repository.findActiveSession(tokenHash), /simulated database failure/);
  assert.ok(client.statements.some((entry) => entry.sql === "rollback"));
  assert.equal(client.statements.some((entry) => entry.sql === "commit"), false);
  assert.equal(client.released, true);
});
