#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(new URL("../package.json", import.meta.url));
const { Pool } = require("pg");
const baseUrl = process.env.KINGSMEN_API_BASE_URL ?? "http://127.0.0.1:8080";
const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("KINGSMEN_DATABASE_URL or DATABASE_URL is required; no database value is printed.");
const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
  connectionTimeoutMillis: 10000,
  ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});
const suffix = `ci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const candidateId = `KM-TV-${suffix}`;
const applicationId = `APP-TV-${suffix}`;
const commandId = `cmd-tv-${suffix}`;
const idempotencyKey = `idem-tv-${suffix}`;
const correlationId = `corr-tv-${suffix}`;
const workflowRunId = `wf-tv-${suffix}`;
const workflowIdempotencyKey = `idem-wf-tv-${suffix}`;
const workflowCorrelationId = `corr-wf-tv-${suffix}`;
const checks = [];
function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
  assert.ok(passed, `${name}: ${detail}`);
}
async function jsonRequest(path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`${path} returned non-JSON HTTP ${response.status}`); }
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}: ${data.code ?? data.status ?? "request failed"}`);
  return { status: response.status, data };
}
try {
  const health = await jsonRequest("/health");
  check("health_ok", health.data.ok === true, "health endpoint reports ok");
  check("postgres_storage_mode", health.data.storageMode === "postgres_truth_vault", "health endpoint identifies PostgreSQL Truth Vault");
  check("postgres_probe_ok", health.data.truthVault?.ok === true, "Truth Vault health probe passed");

  const command = {
    commandId, commandType: "candidate.intake.received", idempotencyKey, correlationId,
    actor: { type: "system", id: "integrated-release-ci" }, candidateId, source: "system",
    createdAt: new Date().toISOString(),
    payload: { displayName: "Synthetic CI Candidate", email: `${suffix}@example.invalid`, activePackageCode: "CI_TEST_ONLY" }
  };
  const firstCommand = await jsonRequest("/api/commands", command);
  check("command_accepted", firstCommand.status === 202 && firstCommand.data.ok === true, "first command accepted");
  const replayCommand = await jsonRequest("/api/commands", command);
  check("command_idempotent_replay", replayCommand.status === 200 && replayCommand.data.status === "IDEMPOTENT_REPLAY", "duplicate command was replayed");

  const candidateRead = await jsonRequest(`/api/candidates/${encodeURIComponent(candidateId)}/status`);
  check("candidate_read_after_write", candidateRead.data.candidate?.candidateId === candidateId, "candidate read model persisted");
  check("candidate_state", candidateRead.data.candidate?.currentState === "INTAKE_PENDING", "candidate state persisted");

  const workflow = {
    workflowRunId, workflow: "W01", candidateId, applicationId,
    idempotencyKey: workflowIdempotencyKey, correlationId: workflowCorrelationId,
    previousState: "INTAKE_PENDING", finalState: "EVALUATION_PENDING", status: "SUCCESS",
    evidenceRef: `ev-${suffix}`, message: "Synthetic Truth Vault integration proof.", createdAt: new Date().toISOString(),
    payload: { synthetic: true, purpose: "release-integration-proof" }
  };
  const firstWorkflow = await jsonRequest("/api/workflow/result", workflow);
  check("workflow_result_accepted", firstWorkflow.status === 202 && firstWorkflow.data.ok === true, "first workflow result accepted");
  const replayWorkflow = await jsonRequest("/api/workflow/result", workflow);
  check("workflow_idempotent_replay", replayWorkflow.status === 200 && replayWorkflow.data.status === "IDEMPOTENT_WORKFLOW_REPLAY", "duplicate workflow result was replayed");

  const applicationRead = await jsonRequest(`/api/applications/${encodeURIComponent(applicationId)}/workbench`);
  check("application_read_after_workflow", applicationRead.data.application?.applicationId === applicationId, "application workbench persisted");
  check("application_evidence_reference", applicationRead.data.application?.lastEvidenceRef === workflow.evidenceRef, "evidence reference carried to application read model");

  const persisted = await pool.query(
    `select
       (select count(*)::int from command_log where command_id = $1) as commands,
       (select count(*)::int from idempotency_keys where idempotency_key = $2 and status = 'COMPLETED') as command_idempotency,
       (select count(*)::int from workflow_runs where workflow_run_id = $3) as workflows,
       (select count(*)::int from evidence_ledger where evidence_ref = $4) as evidence,
       (select count(*)::int from audit_events where correlation_id in ($5,$6)) as audit_events,
       (select count(*)::int from applications where metadata->>'applicationRef' = $7) as applications,
       (select count(*)::int from idempotency_keys where idempotency_key = $8 and status = 'COMPLETED') as workflow_idempotency`,
    [commandId, idempotencyKey, workflowRunId, workflow.evidenceRef, correlationId, workflowCorrelationId, applicationId, workflowIdempotencyKey]
  );
  const row = persisted.rows[0];
  check("db_command_row", row.commands === 1, "exactly one command row");
  check("db_command_idempotency_completed", row.command_idempotency === 1, "command idempotency key completed");
  check("db_workflow_row", row.workflows === 1, "exactly one workflow row");
  check("db_workflow_idempotency_completed", row.workflow_idempotency === 1, "workflow idempotency key completed");
  check("db_evidence_row", row.evidence === 1, "workflow evidence persisted");
  check("db_audit_rows", row.audit_events >= 2, "command and workflow audit events persisted");
  check("db_application_row", row.applications === 1, "application workbench row persisted");

  console.log(JSON.stringify({
    schema: "kingsmen.truth-vault.runtime-integration.v1",
    status: "PASSED",
    productionReady: false,
    generatedAtIso: new Date().toISOString(),
    storageMode: health.data.storageMode,
    syntheticReferences: { candidateId, applicationId, commandId, workflowRunId, evidenceRef: workflow.evidenceRef },
    summary: { checks: checks.length, failed: 0 },
    checks,
    note: "This verifies API-to-PostgreSQL writes and idempotent replays. It is not candidate-auth/RLS isolation proof or a production release approval."
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    schema: "kingsmen.truth-vault.runtime-integration.v1",
    status: "FAILED",
    productionReady: false,
    generatedAtIso: new Date().toISOString(),
    summary: { checks: checks.length, failed: checks.filter(x => !x.passed).length + 1 },
    checks,
    error: error instanceof Error ? error.message : "Unknown runtime integration failure",
    note: "Connection strings and credentials are intentionally omitted."
  }, null, 2));
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => undefined);
}
