import test from "node:test";
import assert from "node:assert/strict";
import {
  readCandidateApplicationsInTrustedTransaction
} from "./candidate-application-runtime";
import type {
  CandidateBackendPool,
  CandidateBackendTransactionClient
} from "./candidate-backend-transaction";

const AUTH_USER_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

test("candidate application runtime establishes trusted context before the owner-scoped query", async () => {
  const statements: string[] = [];
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql: string, values?: readonly unknown[]) {
      statements.push(sql);
      if (sql.includes("from public.candidate_auth_identity_links")) {
        assert.deepEqual(values, [AUTH_USER_ID]);
        return { rows: [{
          verified_candidate_id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
          application_id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
          route_type: "UNIVERSITY",
          route_name: "Example route",
          institution_or_provider: null,
          current_state: "NEW",
          source_confidence_band: "B",
          portal_health: "UNKNOWN",
          map_fallback_required: false,
          last_evidence_ref: null,
          updated_at: "2026-10-17T05:00:00.000Z"
        }] as T[] };
      }
      return { rows: [] as T[] };
    },
    release() { statements.push("RELEASE"); }
  };
  const pool: CandidateBackendPool = { async connect() { return client; } };

  const result = await readCandidateApplicationsInTrustedTransaction(pool, AUTH_USER_ID);
  assert.equal(result?.length, 1);
  assert.equal(result?.[0].routeName, "Example route");
  assert.ok(statements.indexOf("select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)") < statements.findIndex((sql) => sql.includes("from public.candidate_auth_identity_links")));
  assert.equal(statements[0], "BEGIN");
  assert.equal(statements.at(-2), "COMMIT");
  assert.equal(statements.at(-1), "RELEASE");
});

test("malformed Auth UUID never queries identity tables", async () => {
  let identityQuerySeen = false;
  const client: CandidateBackendTransactionClient = {
    async query<T>(sql: string) {
      if (sql.includes("from public.candidate_auth_identity_links")) identityQuerySeen = true;
      return { rows: [] as T[] };
    },
    release() {}
  };
  const pool: CandidateBackendPool = { async connect() { return client; } };
  assert.equal(await readCandidateApplicationsInTrustedTransaction(pool, "not-a-uuid"), null);
  assert.equal(identityQuerySeen, false);
});
