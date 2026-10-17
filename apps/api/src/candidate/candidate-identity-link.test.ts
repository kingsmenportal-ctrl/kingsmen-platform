import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveVerifiedCandidateIdentity,
  type CandidateIdentityDatabase
} from "./candidate-identity-link";

const AUTH_USER_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const CANDIDATE_ID = "6ba7b811-9dad-41d1-80b4-00c04fd430c8";

function fakeDatabase(rows: Array<{ candidate_id: string; public_ref: string }>, observe?: (sql: string, values: readonly unknown[]) => void): CandidateIdentityDatabase {
  return {
    async query<T>(sql: string, values: readonly unknown[] = []) {
      observe?.(sql, values);
      return { rows: rows as T[] };
    }
  };
}

test("resolves only an explicit verified Auth UUID mapping", async () => {
  let observedSql = "";
  let observedValues: readonly unknown[] = [];
  const db = fakeDatabase([{ candidate_id: CANDIDATE_ID, public_ref: "KM-TEST-001" }], (sql, values) => {
    observedSql = sql;
    observedValues = values;
  });

  assert.deepEqual(await resolveVerifiedCandidateIdentity(db, AUTH_USER_ID), {
    candidateId: CANDIDATE_ID,
    publicRef: "KM-TEST-001"
  });
  assert.match(observedSql, /link\.link_status = 'VERIFIED'/);
  assert.match(observedSql, /candidate\.is_active = true/);
  assert.doesNotMatch(observedSql, /email/i);
  assert.deepEqual(observedValues, [AUTH_USER_ID]);
});

test("returns no identity for missing, pending, revoked, or inactive mapping", async () => {
  assert.equal(await resolveVerifiedCandidateIdentity(fakeDatabase([]), AUTH_USER_ID), null);
  assert.equal(await resolveVerifiedCandidateIdentity(fakeDatabase([
    { candidate_id: "", public_ref: "" },
    { candidate_id: CANDIDATE_ID, public_ref: "KM-TEST-001" }
  ]), AUTH_USER_ID), null);
});

test("rejects malformed identifiers without querying the database", async () => {
  let called = false;
  const db = fakeDatabase([], () => { called = true; });
  assert.equal(await resolveVerifiedCandidateIdentity(db, "not-a-uuid"), null);
  assert.equal(called, false);
});

test("fails closed if the query unexpectedly returns more than one row", async () => {
  const db = fakeDatabase([
    { candidate_id: CANDIDATE_ID, public_ref: "KM-TEST-001" },
    { candidate_id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8", public_ref: "KM-TEST-002" }
  ]);
  assert.equal(await resolveVerifiedCandidateIdentity(db, AUTH_USER_ID), null);
});
