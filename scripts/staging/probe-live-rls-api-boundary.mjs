import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const STAGING_PROJECT_HOST = "euhubhhnumtibbyufghm.supabase.co";
const STAGING_PROJECT_REF = "euhubhhnumtibbyufghm";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const reportPath = resolve(repoRoot, "reports/security/rls-api-boundary-probe-latest.json");

const ENV_KEYS = {
  url: "KINGSMEN_STAGING_SUPABASE_URL",
  anonKey: "KINGSMEN_STAGING_SUPABASE_ANON_KEY",
  candidateAJwt: "KINGSMEN_RLS_CANDIDATE_A_JWT",
  candidateBJwt: "KINGSMEN_RLS_CANDIDATE_B_JWT",
  operatorJwt: "KINGSMEN_RLS_OPERATOR_JWT",
  founderJwt: "KINGSMEN_RLS_FOUNDER_JWT",
  candidateAId: "KINGSMEN_RLS_CANDIDATE_A_ID",
  candidateBId: "KINGSMEN_RLS_CANDIDATE_B_ID",
  sessionAId: "KINGSMEN_RLS_SESSION_A_ID",
  sessionBId: "KINGSMEN_RLS_SESSION_B_ID",
  evidenceSafeAId: "KINGSMEN_RLS_EVIDENCE_SAFE_A_ID",
  evidenceSafeBId: "KINGSMEN_RLS_EVIDENCE_SAFE_B_ID",
  evidenceProtectedAId: "KINGSMEN_RLS_EVIDENCE_PROTECTED_A_ID",
  evidenceProtectedBId: "KINGSMEN_RLS_EVIDENCE_PROTECTED_B_ID",
  workflowAId: "KINGSMEN_RLS_WORKFLOW_A_ID",
  workflowBId: "KINGSMEN_RLS_WORKFLOW_B_ID",
  routeSourceVerifiedId: "KINGSMEN_RLS_ROUTE_SOURCE_VERIFIED_ID",
  routeSourceUnverifiedId: "KINGSMEN_RLS_ROUTE_SOURCE_UNVERIFIED_ID",
  routeSourceLowConfidenceId: "KINGSMEN_RLS_ROUTE_SOURCE_LOW_CONFIDENCE_ID"
};

const UUID_KEYS = [
  "candidateAId", "candidateBId",
  "evidenceSafeAId", "evidenceSafeBId",
  "evidenceProtectedAId", "evidenceProtectedBId",
  "workflowAId", "workflowBId",
  "routeSourceVerifiedId", "routeSourceUnverifiedId", "routeSourceLowConfidenceId"
];

const ACTOR_NAMES = ["anonymous", "candidateA", "candidateB", "operator", "founder"];

function makeCases(ids) {
  const row = (name, table, idColumn, idValue, allowedActors, extraFilters = {}) => ({
    name,
    table,
    idColumn,
    idValue,
    filters: { [idColumn]: idValue, ...extraFilters },
    allowedActors
  });

  const operatorAndFounder = ["operator", "founder"];
  const candidateSessionsAllowed = (candidate) => [candidate, ...operatorAndFounder];
  const evidenceAllowed = (candidate) => [candidate, ...operatorAndFounder];

  return [
    row("candidate_credentials:candidate_a_row", "candidate_credentials", "candidate_id", ids.candidateAId, operatorAndFounder),
    row("candidate_credentials:candidate_b_row", "candidate_credentials", "candidate_id", ids.candidateBId, operatorAndFounder),

    row("candidate_sessions:candidate_a_session", "candidate_sessions", "id", ids.sessionAId, candidateSessionsAllowed("candidateA")),
    row("candidate_sessions:candidate_b_session", "candidate_sessions", "id", ids.sessionBId, candidateSessionsAllowed("candidateB")),

    row("evidence_ledger:candidate_a_safe", "evidence_ledger", "id", ids.evidenceSafeAId, evidenceAllowed("candidateA"), { protected_data: "eq.false" }),
    row("evidence_ledger:candidate_b_safe", "evidence_ledger", "id", ids.evidenceSafeBId, evidenceAllowed("candidateB"), { protected_data: "eq.false" }),
    row("evidence_ledger:candidate_a_protected", "evidence_ledger", "id", ids.evidenceProtectedAId, operatorAndFounder, { protected_data: "eq.true" }),
    row("evidence_ledger:candidate_b_protected", "evidence_ledger", "id", ids.evidenceProtectedBId, operatorAndFounder, { protected_data: "eq.true" }),

    row("workflow_runs:candidate_a_run", "workflow_runs", "id", ids.workflowAId, candidateSessionsAllowed("candidateA")),
    row("workflow_runs:candidate_b_run", "workflow_runs", "id", ids.workflowBId, candidateSessionsAllowed("candidateB")),

    row("route_sources:verified_a_band", "route_sources", "id", ids.routeSourceVerifiedId, ACTOR_NAMES),
    row("route_sources:unverified_hidden", "route_sources", "id", ids.routeSourceUnverifiedId, operatorAndFounder),
    row("route_sources:low_confidence_hidden", "route_sources", "id", ids.routeSourceLowConfidenceId, operatorAndFounder)
  ];
}

function configuration(env) {
  const missing = Object.values(ENV_KEYS).filter((key) => !String(env[key] ?? "").trim());
  if (missing.length) return { ok: false, status: "BLOCKED_REQUIRED_CONFIG_MISSING", missing };

  let parsed;
  try {
    parsed = new URL(env[ENV_KEYS.url]);
  } catch {
    return { ok: false, status: "BLOCKED_UNSAFE_TARGET", missing: [], reason: "INVALID_URL" };
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== STAGING_PROJECT_HOST ||
    parsed.pathname !== "/" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    return { ok: false, status: "BLOCKED_UNSAFE_TARGET", missing: [], reason: "URL_NOT_APPROVED_STAGING_PROJECT" };
  }

  for (const key of UUID_KEYS) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(env[ENV_KEYS[key]])) {
      return { ok: false, status: "BLOCKED_INVALID_FIXTURE_IDS", missing: [], reason: "UUID_FIXTURE_INVALID" };
    }
  }

  const distinctFixtureGroups = [
    [env[ENV_KEYS.candidateAId], env[ENV_KEYS.candidateBId]],
    [env[ENV_KEYS.sessionAId], env[ENV_KEYS.sessionBId]],
    [env[ENV_KEYS.evidenceSafeAId], env[ENV_KEYS.evidenceSafeBId], env[ENV_KEYS.evidenceProtectedAId], env[ENV_KEYS.evidenceProtectedBId]],
    [env[ENV_KEYS.workflowAId], env[ENV_KEYS.workflowBId]],
    [env[ENV_KEYS.routeSourceVerifiedId], env[ENV_KEYS.routeSourceUnverifiedId], env[ENV_KEYS.routeSourceLowConfidenceId]]
  ];
  if (distinctFixtureGroups.some((group) => new Set(group).size !== group.length)) {
    return { ok: false, status: "BLOCKED_INVALID_FIXTURE_IDS", missing: [], reason: "FIXTURE_IDS_MUST_BE_DISTINCT_WITHIN_GROUP" };
  }

  const roleTokens = [
    env[ENV_KEYS.candidateAJwt],
    env[ENV_KEYS.candidateBJwt],
    env[ENV_KEYS.operatorJwt],
    env[ENV_KEYS.founderJwt]
  ];
  if (new Set(roleTokens).size !== roleTokens.length || roleTokens.includes(env[ENV_KEYS.anonKey])) {
    return { ok: false, status: "BLOCKED_INVALID_ACTOR_TOKENS", missing: [], reason: "ACTOR_TOKENS_MUST_BE_DISTINCT" };
  }

  return {
    ok: true,
    url: parsed.origin,
    anonKey: env[ENV_KEYS.anonKey],
    ids: Object.fromEntries(Object.entries(ENV_KEYS)
      .filter(([name]) => name.endsWith("Id"))
      .map(([name, envKey]) => [name, env[envKey]])),
    actors: {
      anonymous: env[ENV_KEYS.anonKey],
      candidateA: env[ENV_KEYS.candidateAJwt],
      candidateB: env[ENV_KEYS.candidateBJwt],
      operator: env[ENV_KEYS.operatorJwt],
      founder: env[ENV_KEYS.founderJwt]
    }
  };
}

function failReport(status, nextAction, extra = {}) {
  return {
    schema: "kingsmen.staging-rls-api-boundary.v1",
    targetProjectRef: STAGING_PROJECT_REF,
    status,
    passed: false,
    proofLevel: "live_read_only_postgrest",
    requestMethods: [],
    mutationsPerformed: false,
    credentialsLogged: false,
    checkedAt: new Date().toISOString(),
    checks: [],
    failures: [],
    nextAction,
    ...extra
  };
}

function allowedColumns(table) {
  switch (table) {
    case "candidate_credentials": return "candidate_id";
    case "candidate_sessions": return "id,candidate_id";
    case "evidence_ledger": return "id,candidate_id,protected_data";
    case "workflow_runs": return "id,candidate_id";
    case "route_sources": return "id,status,confidence_band";
    default: throw new Error("Unsupported table in fixed RLS probe.");
  }
}

async function probeOne({ url, anonKey, actors, testCase, actorName, fetchImpl, timeoutMs }) {
  const expectedAccess = testCase.allowedActors.includes(actorName) ? "allow_one_fixture_row" : "deny";
  const query = new URLSearchParams({
    select: allowedColumns(testCase.table),
    limit: "2"
  });
  for (const [column, value] of Object.entries(testCase.filters)) {
    query.set(column, value.startsWith("eq.") ? value : `eq.${value}`);
  }

  const requestUrl = `${url}/rest/v1/${testCase.table}?${query.toString()}`;
  let response;
  try {
    response = await fetchImpl(requestUrl, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${actors[actorName]}`,
        Accept: "application/json"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    return {
      name: testCase.name,
      table: testCase.table,
      actor: actorName,
      expectedAccess,
      httpStatus: null,
      visibleRows: null,
      passed: false,
      resultCode: "NETWORK_OR_TIMEOUT_ERROR"
    };
  }

  if (expectedAccess === "deny" && [401, 403].includes(response.status)) {
    return {
      name: testCase.name,
      table: testCase.table,
      actor: actorName,
      expectedAccess,
      httpStatus: response.status,
      visibleRows: 0,
      passed: true,
      resultCode: "ACCESS_DENIED"
    };
  }

  if (response.status !== 200) {
    return {
      name: testCase.name,
      table: testCase.table,
      actor: actorName,
      expectedAccess,
      httpStatus: response.status,
      visibleRows: null,
      passed: false,
      resultCode: "UNEXPECTED_HTTP_STATUS"
    };
  }

  let rows;
  try {
    rows = await response.json();
  } catch {
    rows = null;
  }

  if (!Array.isArray(rows)) {
    return {
      name: testCase.name,
      table: testCase.table,
      actor: actorName,
      expectedAccess,
      httpStatus: response.status,
      visibleRows: null,
      passed: false,
      resultCode: "RESPONSE_NOT_ROW_ARRAY"
    };
  }

  const expectedId = testCase.filters[testCase.idColumn].replace(/^eq\./, "");
  const expectedRow = rows.length === 1 && String(rows[0]?.[testCase.idColumn] ?? "") === expectedId;
  const passed = expectedAccess === "allow_one_fixture_row"
    ? expectedRow
    : rows.length === 0;

  return {
    name: testCase.name,
    table: testCase.table,
    actor: actorName,
    expectedAccess,
    httpStatus: response.status,
    visibleRows: rows.length,
    passed,
    resultCode: passed
      ? (expectedAccess === "deny" ? "ROW_FILTER_DENIED" : "EXPECTED_FIXTURE_VISIBLE")
      : (expectedAccess === "deny" ? "UNEXPECTED_ROW_VISIBLE" : "EXPECTED_FIXTURE_NOT_VISIBLE")
  };
}

export async function runLiveRlsApiBoundaryProbe({
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000
} = {}) {
  const config = configuration(env);
  if (!config.ok) {
    return failReport(
      config.status,
      config.missing?.length
        ? "Provide the named non-production staging actor tokens and pre-existing, reviewed test fixture IDs; this probe will not create fixtures."
        : "Correct the staging target or fixture configuration, then rerun the read-only probe.",
      {
        missingConfiguration: config.missing ?? [],
        configurationError: config.reason ?? null,
        mutationsPerformed: false
      }
    );
  }

  const checks = [];
  for (const testCase of makeCases(config.ids)) {
    for (const actorName of ACTOR_NAMES) {
      checks.push(await probeOne({
        url: config.url,
        anonKey: config.anonKey,
        actors: config.actors,
        testCase,
        actorName,
        fetchImpl,
        timeoutMs
      }));
    }
  }

  const failures = checks.filter((item) => !item.passed);
  return {
    schema: "kingsmen.staging-rls-api-boundary.v1",
    targetProjectRef: STAGING_PROJECT_REF,
    status: failures.length === 0 ? "PASSED" : "FAILED",
    passed: failures.length === 0,
    proofLevel: "live_read_only_postgrest",
    requestMethods: ["GET"],
    requestCount: checks.length,
    testCaseCount: makeCases(config.ids).length,
    actorCount: ACTOR_NAMES.length,
    mutationsPerformed: false,
    credentialsLogged: false,
    sensitiveColumnsRequested: false,
    checks,
    failures,
    checkedAt: new Date().toISOString(),
    nextAction: failures.length === 0
      ? "Attach this redacted report to the staging security evidence pack and rerun after any RLS, grant, or policy change."
      : "Keep the release gate blocked. Review the table/actor result codes and repair the access boundary or fixture setup before retrying."
  };
}

async function main() {
  const report = await runLiveRlsApiBoundaryProbe();
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = report.status.startsWith("BLOCKED_") ? 2 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
