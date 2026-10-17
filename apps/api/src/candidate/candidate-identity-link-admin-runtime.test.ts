import test from "node:test";
import assert from "node:assert/strict";
import {
  CandidateIdentityLinkAdminRuntime,
  type CandidateIdentityLinkOperatorResolver
} from "./candidate-identity-link-admin-runtime";
import type { CandidateBackendPool, CandidateBackendTransactionClient } from "./candidate-backend-transaction";

const AUTH = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const CANDIDATE = "6ba7b811-9dad-41d1-80b4-00c04fd430c8";
const COMMAND = {
  supabaseUserId: AUTH,
  candidateId: CANDIDATE,
  reason: "approved test onboarding evidence",
  correlationId: "identity-admin-test"
};

function setup(principal: {actorId:string;permissions:string[]}|null) {
  const calls: Array<{sql:string;values?:readonly unknown[]}> = [];
  let released = false;
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql: string, values?: readonly unknown[]) {
      calls.push({sql,values});
      if (sql.includes("candidate_auth_identity_links")) {
        return {rows:[{id:"6ba7b812-9dad-41d1-80b4-00c04fd430c8",link_status:"PENDING"}] as T[]};
      }
      return {rows:[] as T[]};
    },
    release() { released = true; }
  };
  const pool: CandidateBackendPool = { async connect() { return client; } };
  const resolver: CandidateIdentityLinkOperatorResolver<{session:string}> = {
    async resolve(context) {
      assert.equal(context.session, "server-verified-session");
      return principal;
    }
  };
  return {runtime:new CandidateIdentityLinkAdminRuntime(pool,resolver),calls,get released(){return released;}};
}

test("admin runtime resolves trusted principal and establishes backend transaction before mutation", async () => {
  const f = setup({actorId:"operator:trusted-1",permissions:["candidate.identity_link.create"]});
  const result = await f.runtime.execute("create",{session:"server-verified-session"},COMMAND);
  assert.equal(result.status,"PENDING");
  assert.equal(f.calls[0].sql,"BEGIN");
  assert.match(f.calls[1].sql,/set_config\('app.kingsmen_role'/);
  assert.match(f.calls[2].sql,/insert into public\.candidate_auth_identity_links/);
  assert.match(f.calls[3].sql,/insert into public\.audit_events/);
  assert.equal(f.calls.at(-1)?.sql,"COMMIT");
  assert.equal(f.released,true);
});

test("missing trusted operator principal fails before connecting to the database", async () => {
  const f = setup(null);
  await assert.rejects(f.runtime.execute("create",{session:"server-verified-session"},COMMAND),/OPERATOR_REQUIRED/);
  assert.equal(f.calls.length,0);
  assert.equal(f.released,false);
});

test("permission is action-specific and fails closed", async () => {
  const f = setup({actorId:"operator:trusted-1",permissions:["candidate.identity_link.create"]});
  await assert.rejects(f.runtime.execute("verify",{session:"server-verified-session"},COMMAND),/PERMISSION_REQUIRED/);
  assert.equal(f.calls.length,0);
});

test("audit failure causes transaction rollback and releases connection", async () => {
  const calls: string[] = [];
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql: string) {
      calls.push(sql);
      if (sql.includes("insert into public.audit_events")) throw new Error("audit unavailable");
      if (sql.includes("candidate_auth_identity_links")) return {rows:[{id:"6ba7b812-9dad-41d1-80b4-00c04fd430c8",link_status:"PENDING"}] as T[]};
      return {rows:[] as T[]};
    },
    release() { calls.push("RELEASE"); }
  };
  const pool: CandidateBackendPool = {async connect(){return client;}};
  const runtime = new CandidateIdentityLinkAdminRuntime(pool,{
    async resolve(){return {actorId:"operator:trusted-1",permissions:["candidate.identity_link.create"]};}
  });
  await assert.rejects(runtime.execute("create",{},COMMAND),/audit unavailable/);
  assert.equal(calls.at(-2),"ROLLBACK");
  assert.equal(calls.at(-1),"RELEASE");
});


test("verify action requires its own permission and records a VERIFIED transition", async () => {
  const calls: Array<{sql:string;values?:readonly unknown[]}> = [];
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql:string, values?:readonly unknown[]) {
      calls.push({sql,values});
      if (sql.includes("update public.candidate_auth_identity_links")) {
        return {rows:[{id:"6ba7b812-9dad-41d1-80b4-00c04fd430c8",link_status:"VERIFIED"}] as T[]};
      }
      return {rows:[] as T[]};
    },
    release() {}
  };
  const runtime = new CandidateIdentityLinkAdminRuntime({async connect(){return client;}},{
    async resolve(){return {actorId:"operator:verifier",permissions:["candidate.identity_link.verify"]};}
  });
  const result = await runtime.execute("verify",{},COMMAND);
  assert.equal(result.status,"VERIFIED");
  const mutation = calls.find(c=>c.sql.includes("update public.candidate_auth_identity_links"));
  assert.match(mutation?.sql ?? "",/link_status = 'VERIFIED'/);
  assert.deepEqual(mutation?.values,[AUTH,CANDIDATE,"operator:verifier"]);
  assert.ok(calls.some(c=>c.sql.includes("insert into public.audit_events") && c.values?.[1] === "CANDIDATE_IDENTITY_LINK_VERIFIED"));
});

test("revoke action requires its own permission and records a reasoned REVOKED transition", async () => {
  const calls: Array<{sql:string;values?:readonly unknown[]}> = [];
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql:string, values?:readonly unknown[]) {
      calls.push({sql,values});
      if (sql.includes("update public.candidate_auth_identity_links")) {
        return {rows:[{id:"6ba7b812-9dad-41d1-80b4-00c04fd430c8",link_status:"REVOKED"}] as T[]};
      }
      return {rows:[] as T[]};
    },
    release() {}
  };
  const runtime = new CandidateIdentityLinkAdminRuntime({async connect(){return client;}},{
    async resolve(){return {actorId:"operator:revoker",permissions:["candidate.identity_link.revoke"]};}
  });
  const result = await runtime.execute("revoke",{},COMMAND);
  assert.equal(result.status,"REVOKED");
  const mutation = calls.find(c=>c.sql.includes("update public.candidate_auth_identity_links"));
  assert.match(mutation?.sql ?? "",/link_status = 'REVOKED'/);
  assert.deepEqual(mutation?.values,[AUTH,CANDIDATE,COMMAND.reason]);
  assert.ok(calls.some(c=>c.sql.includes("insert into public.audit_events") && c.values?.[1] === "CANDIDATE_IDENTITY_LINK_REVOKED"));
});

test("malformed identity IDs fail before a database mutation", async () => {
  let connects = 0;
  const runtime = new CandidateIdentityLinkAdminRuntime({async connect(){connects++; throw new Error("must not connect");}},{
    async resolve(){return {actorId:"operator:trusted-1",permissions:["candidate.identity_link.create"]};}
  });
  await assert.rejects(runtime.execute("create",{}, {...COMMAND,supabaseUserId:"not-a-uuid"}),/INVALID_AUTH_USER/);
  assert.equal(connects,0);
});
