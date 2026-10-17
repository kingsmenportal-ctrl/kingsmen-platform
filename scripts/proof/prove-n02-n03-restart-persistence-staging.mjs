#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const target = process.env.KINGSMEN_TRUTH_VAULT_PROOF_TARGET;
const apiBase = process.env.KINGSMEN_API_BASE_URL;
const apiToken = process.env.KINGSMEN_API_SERVICE_TOKEN;
const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
const priorReportPath = join(process.cwd(), "reports/api/n02-n03-staging-runtime-proof-latest.json");
const reportPath = join(process.cwd(), "reports/api/n02-n03-staging-restart-proof-latest.json");

function redactError(value) {
  return String(value)
    .replace(/(?:postgres(?:ql)?|https?):\/\/[^\s"' ]+/gi, "[REDACTED_URL]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/(password|token|secret|key)=\S+/gi, "$1=[REDACTED]");
}

function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
}

function blocked(message) {
  const report = {
    schema: "kingsmen.n02-n03.staging-restart-proof.v1",
    result: "N02_N03_RESTART_PROOF_BLOCKED",
    target: "staging",
    productionReady: false,
    runtimeProofExecuted: false,
    message,
    secretsRedacted: true,
    generatedAtIso: new Date().toISOString()
  };
  writeReport(report);
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (target !== "staging") blocked("Set KINGSMEN_TRUTH_VAULT_PROOF_TARGET=staging explicitly.");
if (!apiBase || !apiToken || !databaseUrl) blocked("KINGSMEN_API_BASE_URL, KINGSMEN_API_SERVICE_TOKEN, and KINGSMEN_DATABASE_URL (or DATABASE_URL) are required.");
let apiUrl;
try { apiUrl = new URL(apiBase); } catch { blocked("KINGSMEN_API_BASE_URL must be a valid absolute URL."); }
if (apiUrl.protocol !== "https:" || apiUrl.pathname !== "/" || apiUrl.search || apiUrl.hash) blocked("Use the approved HTTPS staging API origin without a path, query, or fragment.");
if (!readFileSync) blocked("File runtime unavailable.");
let prior;
try { prior = JSON.parse(readFileSync(priorReportPath, "utf8")); } catch { blocked("A prior successful reports/api/n02-n03-staging-runtime-proof-latest.json is required."); }
if (prior.result !== "N02_N03_STAGING_PROOF_PASSED" || prior.target !== "staging") blocked("The prior staging persistence proof did not pass; refusing to claim restart persistence.");
for (const key of ["preRestartStartedAtIso", "syntheticCandidateRef", "commandId", "idempotencyKey", "workflowRunId", "workflowIdempotencyKey", "applicationId"]) {
  if (!prior[key]) blocked(`Prior proof artifact is missing required reference: ${key}`);
}

const requireFromApi = createRequire(resolve("apps/api/package.json"));
let Pool;
try { ({ Pool } = requireFromApi("pg")); } catch { blocked("Could not resolve apps/api pg dependency. Install API workspace dependencies first."); }
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 1000,
  ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});
const checks = [];

async function request(path) {
  const response = await fetch(new URL(path, apiBase), {
    headers: { authorization: `Bearer ${apiToken}` },
    signal: AbortSignal.timeout(15000)
  });
  const raw = await response.text();
  let body;
  try { body = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`${path} returned non-JSON HTTP ${response.status}`); }
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}: ${JSON.stringify(body).slice(0,400)}`);
  return body;
}

try {
  const health = await request("/health");
  checks.push({ check: "postgres_mode_after_restart", passed: health.storageMode === "postgres_truth_vault" && health.truthVault?.storageMode === "postgres_truth_vault" });
  checks.push({ check: "api_process_restarted", passed: Boolean(health.startedAtIso) && health.startedAtIso !== prior.preRestartStartedAtIso });

  const candidate = await request(`/api/candidates/${encodeURIComponent(prior.syntheticCandidateRef)}/status`);
  checks.push({ check: "candidate_read_model_survives_restart", passed: candidate.candidate?.candidateId === prior.syntheticCandidateRef && candidate.storageMode === "postgres_truth_vault" });

  const application = await request(`/api/applications/${encodeURIComponent(prior.applicationId)}/workbench`);
  checks.push({ check: "application_workbench_survives_restart", passed: application.application?.applicationId === prior.applicationId && application.application?.candidateId === prior.syntheticCandidateRef });

  const persisted = await pool.query(
    `select
       (select count(*)::int from candidates where public_ref = $1) as candidate_count,
       (select count(*)::int from command_log where command_id = $2 and idempotency_key = $3) as command_count,
       (select count(*)::int from idempotency_keys where idempotency_key = $3 and status = 'COMPLETED') as command_idempotency_count,
       (select count(*)::int from workflow_runs where workflow_run_id = $4 and idempotency_key = $5) as workflow_count,
       (select count(*)::int from idempotency_keys where idempotency_key = $5 and status = 'COMPLETED') as workflow_idempotency_count,
       (select count(*)::int from applications where metadata->>'applicationRef' = $6) as application_count`,
    [prior.syntheticCandidateRef, prior.commandId, prior.idempotencyKey, prior.workflowRunId, prior.workflowIdempotencyKey, prior.applicationId]
  );
  const row = persisted.rows[0] ?? {};
  checks.push({
    check: "database_rows_survive_process_restart",
    passed: Number(row.candidate_count) >= 1 &&
      Number(row.command_count) === 1 &&
      Number(row.command_idempotency_count) === 1 &&
      Number(row.workflow_count) === 1 &&
      Number(row.workflow_idempotency_count) === 1 &&
      Number(row.application_count) === 1
  });

  const failures = checks.filter(x => !x.passed);
  const report = {
    schema: "kingsmen.n02-n03.staging-restart-proof.v1",
    result: failures.length ? "N02_N03_RESTART_PROOF_FAILED" : "N02_N03_RESTART_PROOF_PASSED",
    target: "staging",
    productionReady: false,
    runtimeProofExecuted: true,
    restartPersistenceProven: failures.length === 0,
    priorProcessStartedAtIso: prior.preRestartStartedAtIso,
    postRestartProcessStartedAtIso: health.startedAtIso,
    syntheticCandidateRef: prior.syntheticCandidateRef,
    commandId: prior.commandId,
    workflowRunId: prior.workflowRunId,
    applicationId: prior.applicationId,
    checks,
    failures,
    secretsRedacted: true,
    generatedAtIso: new Date().toISOString()
  };
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  const report = {
    schema: "kingsmen.n02-n03.staging-restart-proof.v1",
    result: "N02_N03_RESTART_PROOF_FAILED",
    target: "staging",
    productionReady: false,
    runtimeProofExecuted: true,
    restartPersistenceProven: false,
    error: redactError(error instanceof Error ? error.message : String(error)),
    checks,
    secretsRedacted: true,
    generatedAtIso: new Date().toISOString()
  };
  writeReport(report);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => undefined);
}
