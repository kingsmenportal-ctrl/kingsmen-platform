import assert from "node:assert/strict";
import { runLiveRlsApiBoundaryProbe, STAGING_PROJECT_HOST } from "./probe-live-rls-api-boundary.mjs";

const ids = {
  candidateAId: "11111111-1111-4111-8111-111111111111",
  candidateBId: "22222222-2222-4222-8222-222222222222",
  sessionAId: "session-a-test-fixture",
  sessionBId: "session-b-test-fixture",
  evidenceSafeAId: "33333333-3333-4333-8333-333333333333",
  evidenceSafeBId: "44444444-4444-4444-8444-444444444444",
  evidenceProtectedAId: "55555555-5555-4555-8555-555555555555",
  evidenceProtectedBId: "66666666-6666-4666-8666-666666666666",
  workflowAId: "77777777-7777-4777-8777-777777777777",
  workflowBId: "88888888-8888-4888-8888-888888888888",
  routeSourceVerifiedId: "99999999-9999-4999-8999-999999999999",
  routeSourceUnverifiedId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  routeSourceLowConfidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
};

function completeEnv(overrides = {}) {
  return {
    KINGSMEN_STAGING_SUPABASE_URL: `https://${STAGING_PROJECT_HOST}`,
    KINGSMEN_STAGING_SUPABASE_ANON_KEY: "anon-test-key",
    KINGSMEN_RLS_CANDIDATE_A_JWT: "candidate-a-test-jwt",
    KINGSMEN_RLS_CANDIDATE_B_JWT: "candidate-b-test-jwt",
    KINGSMEN_RLS_OPERATOR_JWT: "operator-test-jwt",
    KINGSMEN_RLS_FOUNDER_JWT: "founder-test-jwt",
    KINGSMEN_RLS_CANDIDATE_A_ID: ids.candidateAId,
    KINGSMEN_RLS_CANDIDATE_B_ID: ids.candidateBId,
    KINGSMEN_RLS_SESSION_A_ID: ids.sessionAId,
    KINGSMEN_RLS_SESSION_B_ID: ids.sessionBId,
    KINGSMEN_RLS_EVIDENCE_SAFE_A_ID: ids.evidenceSafeAId,
    KINGSMEN_RLS_EVIDENCE_SAFE_B_ID: ids.evidenceSafeBId,
    KINGSMEN_RLS_EVIDENCE_PROTECTED_A_ID: ids.evidenceProtectedAId,
    KINGSMEN_RLS_EVIDENCE_PROTECTED_B_ID: ids.evidenceProtectedBId,
    KINGSMEN_RLS_WORKFLOW_A_ID: ids.workflowAId,
    KINGSMEN_RLS_WORKFLOW_B_ID: ids.workflowBId,
    KINGSMEN_RLS_ROUTE_SOURCE_VERIFIED_ID: ids.routeSourceVerifiedId,
    KINGSMEN_RLS_ROUTE_SOURCE_UNVERIFIED_ID: ids.routeSourceUnverifiedId,
    KINGSMEN_RLS_ROUTE_SOURCE_LOW_CONFIDENCE_ID: ids.routeSourceLowConfidenceId,
    ...overrides
  };
}

const operatorFounder = ["operator", "founder"];
const fixtures = [
  { table: "candidate_credentials", idColumn: "candidate_id", id: ids.candidateAId, candidate_id: ids.candidateAId, visibleTo: operatorFounder },
  { table: "candidate_credentials", idColumn: "candidate_id", id: ids.candidateBId, candidate_id: ids.candidateBId, visibleTo: operatorFounder },
  { table: "candidate_sessions", idColumn: "id", id: ids.sessionAId, candidate_id: ids.candidateAId, visibleTo: ["candidateA", ...operatorFounder] },
  { table: "candidate_sessions", idColumn: "id", id: ids.sessionBId, candidate_id: ids.candidateBId, visibleTo: ["candidateB", ...operatorFounder] },
  { table: "evidence_ledger", idColumn: "id", id: ids.evidenceSafeAId, candidate_id: ids.candidateAId, protected_data: false, visibleTo: ["candidateA", ...operatorFounder] },
  { table: "evidence_ledger", idColumn: "id", id: ids.evidenceSafeBId, candidate_id: ids.candidateBId, protected_data: false, visibleTo: ["candidateB", ...operatorFounder] },
  { table: "evidence_ledger", idColumn: "id", id: ids.evidenceProtectedAId, candidate_id: ids.candidateAId, protected_data: true, visibleTo: operatorFounder },
  { table: "evidence_ledger", idColumn: "id", id: ids.evidenceProtectedBId, candidate_id: ids.candidateBId, protected_data: true, visibleTo: operatorFounder },
  { table: "workflow_runs", idColumn: "id", id: ids.workflowAId, candidate_id: ids.candidateAId, visibleTo: ["candidateA", ...operatorFounder] },
  { table: "workflow_runs", idColumn: "id", id: ids.workflowBId, candidate_id: ids.candidateBId, visibleTo: ["candidateB", ...operatorFounder] },
  { table: "route_sources", idColumn: "id", id: ids.routeSourceVerifiedId, status: "VERIFIED", confidence_band: "A", visibleTo: ["anonymous", "candidateA", "candidateB", ...operatorFounder] },
  { table: "route_sources", idColumn: "id", id: ids.routeSourceUnverifiedId, status: "DRAFT", confidence_band: "A", visibleTo: operatorFounder },
  { table: "route_sources", idColumn: "id", id: ids.routeSourceLowConfidenceId, status: "VERIFIED", confidence_band: "C", visibleTo: operatorFounder }
];

const tokenActor = new Map([
  ["anon-test-key", "anonymous"],
  ["candidate-a-test-jwt", "candidateA"],
  ["candidate-b-test-jwt", "candidateB"],
  ["operator-test-jwt", "operator"],
  ["founder-test-jwt", "founder"]
]);

function mockFetchFactory(options = {}) {
  const requests = [];
  const fetchImpl = async (urlValue, init = {}) => {
    const url = new URL(String(urlValue));
    requests.push({ url, init });
    assert.equal(url.hostname, STAGING_PROJECT_HOST, "The probe must target the explicit staging project only.");
    assert.equal(init.method, "GET", "The probe must never mutate staging data.");
    assert.equal(init.body, undefined, "The probe must not send a request body.");
    assert.equal(url.pathname.startsWith("/rest/v1/"), true, "The probe must use the PostgREST read boundary.");

    const table = url.pathname.split("/").at(-1);
    const select = (url.searchParams.get("select") ?? "").split(",");
    assert.ok(select.length > 0 && select.every(Boolean), "Queries must use explicit column lists.");
    assert.equal(select.some(column => /password_hash|token_hash|ip_hash|device_fingerprint_hash|payload|summary|metadata/i.test(column)), false,
      "The probe must never request secret or bulk payload columns.");
    assert.equal(url.searchParams.get("limit"), "2", "The probe must keep response reads bounded.");

    const actor = tokenActor.get(String(init.headers?.Authorization ?? "").replace(/^Bearer /, ""));
    assert.ok(actor, "Each request must use one known test actor.");
    const idFilter = [...url.searchParams.entries()].find(([key, value]) =>
      ["id", "candidate_id"].includes(key) && value.startsWith("eq.")
    );
    assert.ok(idFilter, "Each request must filter to one explicit fixture row.");
    const column = idFilter[0];
    const requestedId = idFilter[1].slice(3);
    let fixture = fixtures.find(item => item.table === table && item.idColumn === column && item.id === requestedId);

    if (options.hideOwnSessionA && table === "candidate_sessions" && requestedId === ids.sessionAId) fixture = null;
    const protectedFilter = url.searchParams.get("protected_data");
    const accessOverride = options.forceExposeSessionBToCandidateA &&
      table === "candidate_sessions" &&
      requestedId === ids.sessionBId &&
      actor === "candidateA";
    const visible = fixture && (
      fixture.visibleTo.includes(actor) || accessOverride
    ) && (
      !protectedFilter || protectedFilter === `eq.${String(fixture.protected_data)}`
    );

    const rows = visible
      ? [Object.fromEntries(select.map(field => [field, fixture[field]]))]
      : [];
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  return { fetchImpl, requests };
}

async function testSuccessfulAccessMatrix() {
  const { fetchImpl, requests } = mockFetchFactory();
  const report = await runLiveRlsApiBoundaryProbe({ env: completeEnv(), fetchImpl });
  assert.equal(report.status, "PASSED");
  assert.equal(report.passed, true);
  assert.equal(report.requestMethods.join(","), "GET");
  assert.equal(report.mutationsPerformed, false);
  assert.equal(report.credentialsLogged, false);
  assert.equal(report.sensitiveColumnsRequested, false);
  assert.equal(report.testCaseCount, 13);
  assert.equal(report.actorCount, 5);
  assert.equal(report.requestCount, 65);
  assert.equal(report.checks.length, 65);
  assert.equal(report.failures.length, 0);
  assert.equal(requests.length, 65);
  assert.ok(report.checks.some(item => item.name === "evidence_ledger:candidate_a_protected" && item.actor === "candidateA" && item.resultCode === "ROW_FILTER_DENIED"));
  assert.ok(report.checks.some(item => item.name === "route_sources:verified_a_band" && item.actor === "anonymous" && item.resultCode === "EXPECTED_FIXTURE_VISIBLE"));
  return "65 read-only actor/fixture checks pass under the simulated RLS visibility matrix";
}

async function testCrossCandidateLeakFails() {
  const { fetchImpl } = mockFetchFactory({ forceExposeSessionBToCandidateA: true });
  const report = await runLiveRlsApiBoundaryProbe({ env: completeEnv(), fetchImpl });
  assert.equal(report.status, "FAILED");
  assert.ok(report.failures.some(item =>
    item.name === "candidate_sessions:candidate_b_session" &&
    item.actor === "candidateA" &&
    item.resultCode === "UNEXPECTED_ROW_VISIBLE"
  ));
  return "cross-candidate session leak is detected";
}

async function testMissingCredentialsBlockWithoutRequests() {
  const { fetchImpl, requests } = mockFetchFactory();
  const env = completeEnv({ KINGSMEN_RLS_CANDIDATE_A_JWT: "" });
  const report = await runLiveRlsApiBoundaryProbe({ env, fetchImpl });
  assert.equal(report.status, "BLOCKED_REQUIRED_CONFIG_MISSING");
  assert.equal(report.passed, false);
  assert.equal(requests.length, 0);
  assert.ok(report.missingConfiguration.includes("KINGSMEN_RLS_CANDIDATE_A_JWT"));
  return "missing test actor credentials block the probe before network access";
}

async function testUnsafeTargetBlocksWithoutRequests() {
  const { fetchImpl, requests } = mockFetchFactory();
  const env = completeEnv({ KINGSMEN_STAGING_SUPABASE_URL: "https://production.example.com" });
  const report = await runLiveRlsApiBoundaryProbe({ env, fetchImpl });
  assert.equal(report.status, "BLOCKED_UNSAFE_TARGET");
  assert.equal(report.passed, false);
  assert.equal(requests.length, 0);
  return "non-staging targets are rejected before network access";
}

async function testMissingFixtureIsNotAFalsePass() {
  const { fetchImpl } = mockFetchFactory({ hideOwnSessionA: true });
  const report = await runLiveRlsApiBoundaryProbe({ env: completeEnv(), fetchImpl });
  assert.equal(report.status, "FAILED");
  assert.ok(report.failures.some(item =>
    item.name === "candidate_sessions:candidate_a_session" &&
    item.actor === "candidateA" &&
    item.resultCode === "EXPECTED_FIXTURE_NOT_VISIBLE"
  ));
  return "missing expected fixture rows fail instead of being recorded as successful denial";
}

async function testDuplicateFixtureIdsBlockBeforeRequests() {
  const { fetchImpl, requests } = mockFetchFactory();
  const env = completeEnv({ KINGSMEN_RLS_SESSION_B_ID: ids.sessionAId });
  const report = await runLiveRlsApiBoundaryProbe({ env, fetchImpl });
  assert.equal(report.status, "BLOCKED_INVALID_FIXTURE_IDS");
  assert.equal(requests.length, 0);
  return "duplicate fixture identifiers block the probe before network access";
}

async function testDuplicateActorTokensBlockBeforeRequests() {
  const { fetchImpl, requests } = mockFetchFactory();
  const env = completeEnv({ KINGSMEN_RLS_FOUNDER_JWT: "operator-test-jwt" });
  const report = await runLiveRlsApiBoundaryProbe({ env, fetchImpl });
  assert.equal(report.status, "BLOCKED_INVALID_ACTOR_TOKENS");
  assert.equal(requests.length, 0);
  return "shared actor tokens block the probe before network access";
}

const results = [];
for (const test of [
  testSuccessfulAccessMatrix,
  testCrossCandidateLeakFails,
  testMissingCredentialsBlockWithoutRequests,
  testUnsafeTargetBlocksWithoutRequests,
  testMissingFixtureIsNotAFalsePass,
  testDuplicateFixtureIdsBlockBeforeRequests,
  testDuplicateActorTokensBlockBeforeRequests
]) {
  results.push(await test());
}

console.log("LIVE_RLS_API_BOUNDARY_CONTRACT_TESTS_PASSED");
for (const result of results) console.log(`- ${result}`);
