import test from "node:test";
import assert from "node:assert/strict";
import {
  withCandidateBackendTransaction,
  type CandidateBackendPool,
  type CandidateBackendTransactionClient
} from "./candidate-backend-transaction";

function fakePool(failAt?: string): { pool: CandidateBackendPool; calls: Array<{sql: string; values?: readonly unknown[]}>; released: {value: boolean} } {
  const calls: Array<{sql: string; values?: readonly unknown[]}> = [];
  const released = { value: false };
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql: string, values?: readonly unknown[]) {
      calls.push({ sql, values });
      if (failAt === sql) throw new Error("db failure");
      return { rows: [] as T[] };
    },
    release() { released.value = true; }
  };
  return { pool: { async connect() { return client; } }, calls, released };
}

test("sets fixed backend RLS context transaction-locally and commits on same connection", async () => {
  const fake = fakePool();
  const result = await withCandidateBackendTransaction(fake.pool, async (db) => {
    await db.query("select candidate id", ["value"]);
    return "ok";
  });
  assert.equal(result, "ok");
  assert.deepEqual(fake.calls.map((call) => call.sql), [
    "BEGIN",
    "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
    "select candidate id",
    "COMMIT"
  ]);
  assert.deepEqual(fake.calls[1].values, ["service_role", "backend_api"]);
  assert.equal(fake.released.value, true);
});

test("rolls back and releases connection when operation fails", async () => {
  const fake = fakePool();
  await assert.rejects(
    withCandidateBackendTransaction(fake.pool, async () => { throw new Error("operation failed"); }),
    /operation failed/
  );
  assert.equal(fake.calls.at(-1)?.sql, "ROLLBACK");
  assert.equal(fake.released.value, true);
});

test("rolls back after query failure and preserves the original database error", async () => {
  const fake = fakePool("select broken");
  await assert.rejects(
    withCandidateBackendTransaction(fake.pool, async (db) => db.query("select broken")),
    /db failure/
  );
  assert.equal(fake.calls.at(-1)?.sql, "ROLLBACK");
  assert.equal(fake.released.value, true);
});

test("does not attempt rollback when BEGIN fails, but still releases the connection", async () => {
  const fake = fakePool("BEGIN");
  await assert.rejects(
    withCandidateBackendTransaction(fake.pool, async () => "unreachable"),
    /db failure/
  );
  assert.deepEqual(fake.calls.map((call) => call.sql), ["BEGIN"]);
  assert.equal(fake.released.value, true);
});
