#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const target = process.env.KINGSMEN_TRUTH_VAULT_PROOF_TARGET;
const acknowledgement = process.env.KINGSMEN_TRUTH_VAULT_PROOF_ACK;
const apiBase = process.env.KINGSMEN_API_BASE_URL;
const apiServiceToken = process.env.KINGSMEN_API_SERVICE_TOKEN;
const workflowServiceToken = process.env.KINGSMEN_WORKFLOW_SERVICE_TOKEN;
const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;

function fail(message) {
  console.error(JSON.stringify({ result: "N02_N03_STAGING_PROOF_BLOCKED", productionReady: false, message }, null, 2));
  process.exit(1);
}

if (target !== "staging") fail("Set KINGSMEN_TRUTH_VAULT_PROOF_TARGET=staging explicitly.");
if (acknowledgement !== "I_CONFIRM_STAGING_WRITES") fail("Set KINGSMEN_TRUTH_VAULT_PROOF_ACK=I_CONFIRM_STAGING_WRITES only after confirming both URLs point to disposable/approved staging.");
if (!apiBase || !databaseUrl) fail("KINGSMEN_API_BASE_URL and KINGSMEN_DATABASE_URL (or DATABASE_URL) are required.");
if (!apiServiceToken) fail("KINGSMEN_API_SERVICE_TOKEN is required for authenticated backend API proof.");
let apiUrl;
try { apiUrl = new URL(apiBase); } catch { fail("KINGSMEN_API_BASE_URL must be a valid absolute URL."); }
if (!["https:", "http:"].includes(apiUrl.protocol)) fail("API URL must use HTTP(S).");
if (apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1" || apiUrl.hostname === "::1") {
  fail("This script is for a separately configured staging API, not localhost. Use a dedicated local integration test for local databases.");
}
if (apiUrl.pathname !== "/" || apiUrl.search || apiUrl.hash) fail("KINGSMEN_API_BASE_URL must be the origin/base path without query or fragment.");

const requireFromApi = createRequire(resolve("apps/api/package.json"));
let Pool;
try { ({ Pool } = requireFromApi("pg")); } catch { fail("Could not resolve the apps/api pg dependency. Install API workspace dependencies first."); }
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 1000,
  ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

const correlationId = `proof_corr_${randomUUID()}`;
const candidateId = `KM-PROOF-${randomUUID()}`;
const commandId = `proof_cmd_${randomUUID()}`;
const idempotencyKey = `proof_idem_${randomUUID()}`;
const createdAt = new Date().toISOString();
const command = {
  commandId,
  commandType: "candidate.intake.received",
  idempotencyKey,
  correlationId,
  actor: { type: "system", id: "n02-n03-staging-proof" },
  candidateId,
  source: "system",
  createdAt,
  payload: {
    displayName: "Synthetic N02 N03 Persistence Proof",
    email: `${candidateId.toLowerCase()}@example.invalid`,
    activePackageCode: null,
    proofOnly: true
  }
};

async function requestRaw(path, body, token) {
  const headers = { "x-correlation-id": correlationId };
  if (body) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(new URL(path, apiBase), {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`${path} returned non-JSON HTTP ${response.status}`); }
  return { status: response.status, body: json };
}

async function request(path, body, token) {
  const chosenToken = token === undefined
    ? (path === "/api/workflow/result" || path === "/api/workflow-results" ? workflowServiceToken : apiServiceToken)
    : token;
  const result = await requestRaw(path, body, chosenToken);
  if (result.status < 200 || result.status >= 300) throw new Error(`${path} returned HTTP ${result.status}: ${JSON.stringify(result.body).slice(0,500)}`);
  return result;
}

const checks = [];
try {
  const health = await request("/health", undefined, null);
  checks.push({ check: "health_endpoint", passed: health.body?.ok === true });
  checks.push({ check: "postgres_mode", passed: health.body?.storageMode === "postgres_truth_vault" && health.body?.truthVault?.storageMode === "postgres_truth_vault" });
  if (health.body?.storageMode !== "postgres_truth_vault" || health.body?.truthVault?.storageMode !== "postgres_truth_vault") {
    throw new Error("API health does not prove postgres_truth_vault mode; refusing to call command endpoint.");
  }

  const unauthenticated = await requestRaw("/api/commands", command, null);
  checks.push({ check: "command_endpoint_rejects_missing_auth", passed: unauthenticated.status === 401 || unauthenticated.status === 503 });
  if (unauthenticated.status !== 401 && unauthenticated.status !== 503) throw new Error("Command endpoint did not reject missing authentication.");

  const before = await pool.query("select count(*)::int as count from command_log where idempotency_key = $1", [idempotencyKey]);
  const first = await request("/api/commands", command);
  checks.push({ check: "command_accepted", passed: first.status === 202 && first.body?.ok === true });
  checks.push({ check: "command_reports_postgres", passed: first.body?.storageMode === "postgres_truth_vault" });

  const persisted = await pool.query(
    `select c.command_id, c.correlation_id, c.idempotency_key, c.status,
            i.status as idempotency_status, a.event_type
       from command_log c
       join idempotency_keys i on i.idempotency_key = c.idempotency_key
       join audit_events a on a.correlation_id = c.correlation_id and a.event_type = 'command.accepted'
      where c.idempotency_key = $1 and c.command_id = $2`,
    [idempotencyKey, commandId]
  );
  checks.push({ check: "command_idempotency_and_audit_persisted", passed: persisted.rowCount === 1 && persisted.rows[0]?.idempotency_status === "COMPLETED" });
  if (persisted.rowCount !== 1) throw new Error("Expected exactly one persisted command, completed idempotency key and matching audit event.");

  const readModel = await request(`/api/candidates/${encodeURIComponent(candidateId)}/status`);
  checks.push({ check: "candidate_read_model_from_postgres", passed: readModel.body?.candidate?.candidateId === candidateId && readModel.body?.candidate?.displayName === "Synthetic N02 N03 Persistence Proof" });

  const replay = await request("/api/commands", command);
  checks.push({ check: "idempotent_replay", passed: replay.status === 200 && replay.body?.status === "IDEMPOTENT_REPLAY" });

  const after = await pool.query("select count(*)::int as count from command_log where idempotency_key = $1", [idempotencyKey]);
  checks.push({ check: "replay_did_not_duplicate_command", passed: Number(after.rows[0]?.count) === Number(before.rows[0]?.count) + 1 });

  const failures = checks.filter(x => !x.passed);
  const report = {
    schema: "kingsmen.n02-n03.staging-runtime-proof.v1",
    result: failures.length ? "N02_N03_STAGING_PROOF_FAILED" : "N02_N03_STAGING_PROOF_PASSED",
    target: "staging",
    productionReady: false,
    runtimeProof: true,
    restartPersistenceProven: false,
    note: "This run proves the live configured API/database round trip and idempotent replay; persistence across a process restart still requires a separate restart-and-reread run.",
    generatedAtIso: new Date().toISOString(),
    correlationId,
    syntheticCandidateRef: candidateId,
    commandId,
    checks,
    failures
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({
    schema: "kingsmen.n02-n03.staging-runtime-proof.v1",
    result: "N02_N03_STAGING_PROOF_FAILED",
    target: "staging",
    productionReady: false,
    correlationId,
    syntheticCandidateRef: candidateId,
    error: error instanceof Error ? error.message : String(error),
    checks
  }, null, 2));
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => undefined);
}
