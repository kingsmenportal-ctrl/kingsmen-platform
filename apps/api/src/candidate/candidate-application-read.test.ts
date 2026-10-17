import test from "node:test";
import assert from "node:assert/strict";
import {
  listApplicationsForVerifiedAuthUser,
  type CandidateApplicationDatabase
} from "./candidate-application-read";

const AUTH_USER_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

function fakeDatabase<T>(rows: T[], observe?: (sql: string, values: readonly unknown[]) => void): CandidateApplicationDatabase {
  return {
    async query<R>(sql: string, values: readonly unknown[] = []) {
      observe?.(sql, values);
      return { rows: rows as R[] };
    }
  };
}

const appRow = {
  verified_candidate_id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  application_id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
  route_type: "UNIVERSITY",
  route_name: "Example route",
  institution_or_provider: "Example institution",
  current_state: "NEW",
  source_confidence_band: "B",
  portal_health: "UNKNOWN",
  map_fallback_required: false,
  last_evidence_ref: null,
  updated_at: "2026-10-17T05:00:00.000Z"
};

test("retrieves only rows joined to the server-verified Auth identity", async () => {
  let sqlSeen = "";
  let valuesSeen: readonly unknown[] = [];
  const db = fakeDatabase([appRow], (sql, values) => {
    sqlSeen = sql;
    valuesSeen = values;
  });

  assert.deepEqual(await listApplicationsForVerifiedAuthUser(db, AUTH_USER_ID), [{
    applicationId: appRow.application_id,
    routeType: "UNIVERSITY",
    routeName: "Example route",
    institutionOrProvider: "Example institution",
    currentState: "NEW",
    sourceConfidenceBand: "B",
    portalHealth: "UNKNOWN",
    mapFallbackRequired: false,
    lastEvidenceRef: null,
    updatedAt: appRow.updated_at
  }]);
  assert.match(sqlSeen, /link\.supabase_user_id = \$1::uuid/);
  assert.match(sqlSeen, /link\.link_status = 'VERIFIED'/);
  assert.match(sqlSeen, /application\.candidate_id = candidate\.id/);
  assert.doesNotMatch(sqlSeen, /email/i);
  assert.deepEqual(valuesSeen, [AUTH_USER_ID]);
});

test("distinguishes no verified identity from a verified candidate with no applications", async () => {
  assert.equal(await listApplicationsForVerifiedAuthUser(fakeDatabase([]), AUTH_USER_ID), null);
  assert.deepEqual(await listApplicationsForVerifiedAuthUser(fakeDatabase([{
    ...appRow,
    application_id: null,
    route_type: null,
    route_name: null,
    institution_or_provider: null,
    current_state: null,
    source_confidence_band: null,
    portal_health: null,
    map_fallback_required: null,
    last_evidence_ref: null,
    updated_at: null
  }]), AUTH_USER_ID), []);
});

test("rejects malformed Auth IDs before database access", async () => {
  let queried = false;
  const db = fakeDatabase([], () => { queried = true; });
  assert.equal(await listApplicationsForVerifiedAuthUser(db, "candidate-id-from-client"), null);
  assert.equal(queried, false);
});

test("does not expose internal identity columns in the candidate response", async () => {
  const rows = await listApplicationsForVerifiedAuthUser(fakeDatabase([appRow]), AUTH_USER_ID);
  assert.ok(rows);
  assert.equal("verifiedCandidateId" in rows[0], false);
  assert.equal("candidateId" in rows[0], false);
});
