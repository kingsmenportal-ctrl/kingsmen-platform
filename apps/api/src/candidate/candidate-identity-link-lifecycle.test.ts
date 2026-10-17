import test from "node:test";
import assert from "node:assert/strict";
import {
  createPendingCandidateIdentityLink,
  verifyPendingCandidateIdentityLink,
  revokeCandidateIdentityLink,
  type CandidateIdentityLinkActor,
  type CandidateIdentityLinkCommand
} from "./candidate-identity-link-lifecycle";
import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";

const AUTH = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const CANDIDATE = "6ba7b811-9dad-41d1-80b4-00c04fd430c8";
const COMMAND: CandidateIdentityLinkCommand = {
  supabaseUserId: AUTH, candidateId: CANDIDATE,
  reason: "Identity checked against approved onboarding evidence",
  correlationId: "test-correlation-001"
};
const OPERATOR: CandidateIdentityLinkActor = {
  actorId: "operator:staging-test",
  async isAuthorizedOperator(actorId) { return actorId === "operator:staging-test"; }
};

function fakeDb(options: { linkRows?: Array<{id:string;link_status:"PENDING"|"VERIFIED"|"REVOKED"}>; failAudit?: boolean } = {}) {
  const calls: Array<{sql:string;values?:readonly unknown[]}> = [];
  const db: CandidateBackendTransactionDatabase = {
    async query<T>(sql: string, values?: readonly unknown[]) {
      calls.push({sql, values});
      if (sql.includes("insert into public.audit_events") && options.failAudit) throw new Error("audit insert failed");
      if (sql.includes("candidate_auth_identity_links")) {
        return { rows: (options.linkRows ?? [{id:"6ba7b812-9dad-41d1-80b4-00c04fd430c8",link_status: sql.startsWith("insert") ? "PENDING" : sql.includes("set link_status = 'VERIFIED'") ? "VERIFIED" : "REVOKED"}]) as T[] };
      }
      return { rows: [] as T[] };
    }
  };
  return { db, calls };
}

test("creates pending link only after operator authorization and writes audit event", async () => {
  const f = fakeDb();
  const result = await createPendingCandidateIdentityLink(f.db, OPERATOR, COMMAND);
  assert.equal(result.status, "PENDING");
  assert.equal(f.calls.length, 2);
  assert.match(f.calls[0].sql, /candidate\.is_active = true/);
  assert.deepEqual(f.calls[0].values, [AUTH, CANDIDATE]);
  assert.match(f.calls[1].sql, /insert into public\.audit_events/);
  assert.equal(f.calls[1].values?.[4], OPERATOR.actorId);
});

test("rejects unauthorized actor before touching the database", async () => {
  const f = fakeDb();
  await assert.rejects(createPendingCandidateIdentityLink(f.db, {
    actorId: "candidate:untrusted", async isAuthorizedOperator() { return false; }
  }, COMMAND), /OPERATOR_REQUIRED/);
  assert.equal(f.calls.length, 0);
});

test("rejects malformed Auth UUID before touching the database", async () => {
  const f = fakeDb();
  await assert.rejects(createPendingCandidateIdentityLink(f.db, OPERATOR, {...COMMAND, supabaseUserId:"not-an-uuid"}), /INVALID_AUTH_USER/);
  assert.equal(f.calls.length, 0);
});

test("verification requires a pending link for the exact Auth user and candidate and records actor", async () => {
  const f = fakeDb();
  const result = await verifyPendingCandidateIdentityLink(f.db, OPERATOR, COMMAND);
  assert.equal(result.status, "VERIFIED");
  assert.match(f.calls[0].sql, /link\.link_status = 'PENDING'/);
  assert.deepEqual(f.calls[0].values, [AUTH, CANDIDATE, OPERATOR.actorId]);
  assert.match(f.calls[1].sql, /insert into public\.audit_events/);
});

test("revocation requires a reason and writes a same-transaction audit record", async () => {
  const f = fakeDb();
  const result = await revokeCandidateIdentityLink(f.db, OPERATOR, COMMAND);
  assert.equal(result.status, "REVOKED");
  assert.match(f.calls[0].sql, /link_status in \('PENDING', 'VERIFIED'\)/);
  assert.deepEqual(f.calls[0].values, [AUTH, CANDIDATE, COMMAND.reason]);
  assert.equal(f.calls[1].values?.[1], "CANDIDATE_IDENTITY_LINK_REVOKED");
});

test("empty reason is rejected and no database changes occur", async () => {
  const f = fakeDb();
  await assert.rejects(revokeCandidateIdentityLink(f.db, OPERATOR, {...COMMAND, reason:" "}), /INVALID_REASON/);
  assert.equal(f.calls.length, 0);
});

test("failed audit insert bubbles so caller transaction can roll back the state change", async () => {
  const f = fakeDb({failAudit:true});
  await assert.rejects(revokeCandidateIdentityLink(f.db, OPERATOR, COMMAND), /audit insert failed/);
  assert.equal(f.calls.length, 2);
});
