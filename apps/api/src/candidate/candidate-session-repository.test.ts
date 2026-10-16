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
