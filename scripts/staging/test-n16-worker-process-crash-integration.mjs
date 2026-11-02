#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const allow = process.env.KINGSMEN_N16_TEST_ALLOW_MUTATION === "true";
const host = process.env.KINGSMEN_N16_TEST_HOST ?? "";
const port = Number(process.env.KINGSMEN_N16_TEST_PORT ?? "5432");
const adminUser = process.env.KINGSMEN_N16_TEST_ADMIN_USER ?? "postgres";
const adminPassword = process.env.PGPASSWORD ?? "";
const rolePassword = process.env.KINGSMEN_N16_TEST_SERVICE_PASSWORD ?? "";
const database = process.env.KINGSMEN_N16_TEST_DATABASE ?? "";
const workerEntry = path.join(root, "apps/api/dist/orchestrator/worker-main.js");

if (!allow) throw new Error("KINGSMEN_N16_TEST_ALLOW_MUTATION=true is required.");
if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error("N16 integration test refuses non-loopback hosts.");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid N16 test database port.");
if (!adminPassword || rolePassword.length < 20) throw new Error("Disposable PostgreSQL admin and service role credentials are required.");
if (database !== "kingsmen_n16_worker_test") throw new Error("N16 integration test requires the exact disposable database name.");

const require = createRequire(import.meta.url);
const pgPath = require.resolve("pg", { paths: [path.join(root, "apps/api")] });
const { Client } = require(pgPath);
const admin = new Client({ host, port, user: adminUser, password: adminPassword, database, connectionTimeoutMillis: 5000 });
const passwordLiteral = "'" + rolePassword.replace(/'/g, "''") + "'";
const workerUrl = "postgres://" + encodeURIComponent("kingsmen_n16_worker_login") + ":+"
  encodeURIComponent(rolePassword) + "@" + host + ":" + port + "/" + database;

function startWorker(workerId, preSentDelayMs, postSentDelayMs) {
  const child = spawn(process.execPath, [workerEntry], {
    cwd: root,
    env: {
      ...process.env,
      KINGSMEN_WORKER_ENABLED: "true",
      KINGSMEN_TRUTH_VAULT_MODE: "postgres",
      KINGSMEN_DATABASE_URL: workerUrl,
      KINGSMEN_WORKER_ID: workerId,
      KINGSMEN_WORKER_ENV: "staging",
      KINGSMEN_N16_ENABLE_SYNTHETIC_PROBE: "true",
      KINGSMEN_N16_PRE_SENT_DELAY_MS: String(preSentDelayMs),
      KINGSMEN_N16_POST_SENT_DELAY_MS: String(postSentDelayMs),
      KINGSMEN_WORKER_POLL_MS: "1000",
      KINGSMEN_WORKER_BATCH_SIZE: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  return { child, get output() { return output; } };
}
async function killWorker(worker) {
  if (worker.child.exitCode !== null || worker.child.signalCode !== null) return;
  worker.child.kill("SIGKILL");
  await Promise.race([
    new Promise((resolve) => worker.child.once("close", resolve)),
    delay(5000).then(() => { throw new Error("N16 worker did not terminate after SIGKILL."); })
  ]);
}
async function waitForStatus(dispatchRef, expected, timeoutMs = 20000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const result = await admin.query(
      "select queue_status, locked_by, attempt_count from public.orchestrator_dispatch_queue where dispatch_ref=$1",
      [dispatchRef]
    );
    if (result.rows[0]?.queue_status === expected) return result.rows[0];
    await delay(50);
  }
  const result = await admin.query(
    "select queue_status, locked_by, attempt_count from public.orchestrator_dispatch_queue where dispatch_ref=$1",
    [dispatchRef]
  );
  throw new Error("Timed out waiting for " + dispatchRef + " => " + expected + "; actual=" + JSON.stringify(result.rows[0]));
}
async function insertSynthetic(dispatchRef) {
  const evidenceRef = "ev:" + dispatchRef;
  const insertSql = [
    "insert into public.orchestrator_dispatch_queue",
    "(dispatch_ref,run_ref,step_ref,worker_code,queue_status,priority_lane,dispatch_after,attempt_count,max_attempts,payload,evidence_refs)",
    "values ($1,$2,$3,'n16.staging-recovery-probe','READY','NORMAL',clock_timestamp(),0,3,$4::jsonb,$5::text[])"
  ].join(" ");
  await admin.query(insertSql, [
    dispatchRef,
    "run:" + dispatchRef,
    "step:" + dispatchRef,
    JSON.stringify({ syntheticOnly: true, approvalGranted: true, approvalEvidenceRef: evidenceRef }),
    [evidenceRef]
  ]);
}

let adminConnected = false;
let preSentWorker;
let postSentWorker;
let recoveryWorker;
let claimClientA;
let claimClientB;
try {
  await admin.connect();
  adminConnected = true;
  const identity = await admin.query("select current_database() as name");
  assert.equal(identity.rows[0].name, database);
  const tablesExist = await admin.query(
    "select count(*)::int as n from pg_tables where schemaname='public' and tablename='orchestrator_dispatch_queue'"
  );
  assert.equal(tablesExist.rows[0].n, 0, "N16 fixture database must start without orchestrator tables.");

  const roles = ["anon", "authenticated", "service_role"];
  for (const role of roles) {
    const found = await admin.query("select 1 from pg_roles where rolname=$1", [role]);
    if (found.rowCount === 0) await admin.query("create role " + role + " nologin");
  }
  await admin.query("alter role service_role with login bypassrls password " + passwordLiteral);
  await admin.query("grant connect on database " + database + " to service_role");

  const migrationPaths = [
    "db/migrations/0014_n16_orchestrator_execution.sql",
    "db/migrations/202610250001_n16_durable_worker_recovery.sql",
    "db/migrations/202610250002_n16_worker_send_boundary.sql",
    "db/migrations/202610250003_n16_exhausted_lease_recovery.sql",
    "db/migrations/202611020001_n16_worker_least_privilege_role.sql"
  ];
  for (const migrationPath of migrationPaths) {
    const sql = await readFile(path.join(root, migrationPath), "utf8");
    await admin.query(sql);
  }
  await admin.query("grant usage on schema public to service_role");
  await admin.query("drop role if exists kingsmen_n16_worker_login");
  await admin.query("create role kingsmen_n16_worker_login login password " + passwordLiteral);
  await admin.query("grant kingsmen_n16_worker to kingsmen_n16_worker_login");
  await admin.query("grant connect on database " + database + " to kingsmen_n16_worker_login");

  const access = await admin.query([
    "select",
    "has_function_privilege('anon','public.n16_claim_dispatches(text,integer,integer)','EXECUTE') as anon_claim,",
    "has_function_privilege('authenticated','public.n16_claim_dispatches(text,integer,integer)','EXECUTE') as auth_claim,",
    "has_function_privilege('service_role','public.n16_claim_dispatches(text,integer,integer)','EXECUTE') as service_claim,",
    "has_function_privilege('kingsmen_n16_worker_login','public.n16_mark_dispatch_sent(text,text,integer)','EXECUTE') as worker_mark_sent,",
    "has_function_privilege('kingsmen_n16_worker_login','public.n16_record_dispatch_result(text,text,text,text,jsonb,text[],text,text,integer,integer)','EXECUTE') as worker_result,",
    "has_function_privilege('kingsmen_n16_worker_login','public.n16_reconcile_expired_sent(integer)','EXECUTE') as worker_recovery,",
    "has_function_privilege('kingsmen_n16_worker_login','public.n16_deadletter_exhausted_locked(integer)','EXECUTE') as worker_deadletter,",
    "has_table_privilege('anon','public.orchestrator_dispatch_queue','SELECT') as anon_select,",
    "has_table_privilege('authenticated','public.orchestrator_dispatch_queue','SELECT') as auth_select,",
    "has_table_privilege('service_role','public.orchestrator_dispatch_queue','SELECT') as service_select,",
    "has_table_privilege('kingsmen_n16_worker_login','public.orchestrator_dispatch_queue','SELECT') as worker_select,",
    "has_table_privilege('kingsmen_n16_worker_login','public.orchestrator_dispatch_queue','INSERT') as worker_insert,",
    "has_table_privilege('kingsmen_n16_worker_login','public.orchestrator_dispatch_queue','UPDATE') as worker_update,",
    "has_table_privilege('kingsmen_n16_worker_login','public.orchestrator_dispatch_queue','DELETE') as worker_delete"
  ].join(" "));
  assert.equal(access.rows[0].anon_claim, false);
  assert.equal(access.rows[0].auth_claim, false);
  assert.equal(access.rows[0].service_claim, true);
  assert.equal(access.rows[0].worker_mark_sent, true);
  assert.equal(access.rows[0].worker_result, true);
  assert.equal(access.rows[0].worker_recovery, true);
  assert.equal(access.rows[0].worker_deadletter, true);
  assert.equal(access.rows[0].anon_select, false);
  assert.equal(access.rows[0].auth_select, false);
  assert.equal(access.rows[0].service_select, true);
  assert.equal(access.rows[0].worker_select, false);
  assert.equal(access.rows[0].worker_insert, false);
  assert.equal(access.rows[0].worker_update, false);
  assert.equal(access.rows[0].worker_delete, false);

  // Independent database sessions verify concurrent claim single-winner.
  await insertSynthetic("n16-concurrent-claim");
  claimClientA = new Client({ host, port, user: "kingsmen_n16_worker_login", password: rolePassword, database, connectionTimeoutMillis: 5000 });
  claimClientB = new Client({ host, port, user: "kingsmen_n16_worker_login", password: rolePassword, database, connectionTimeoutMillis: 5000 });
  await Promise.all([claimClientA.connect(), claimClientB.connect()]);
  const claimSql = "select dispatch_ref from public.n16_claim_dispatches($1,1,60)";
  const claims = await Promise.all([
    claimClientA.query(claimSql, ["claim-worker-a"]),
    claimClientB.query(claimSql, ["claim-worker-b"])
  ]);
  assert.equal(claims[0].rowCount + claims[1].rowCount, 1, "concurrent claim must have one winner");
  const winner = claims[0].rows[0] ?? claims[1].rows[0];
  await admin.query(
    "select public.n16_record_dispatch_result($1,$2,'SUCCEEDED','SAME','{}'::jsonb,$3::text[])",
    [winner.dispatch_ref, "n16-concurrent-result", ["ev:n16-concurrent-claim"]]
  );
  assert.equal((await waitForStatus("n16-concurrent-claim", "ACKED")).queue_status, "ACKED");
  await Promise.all([claimClientA.end(), claimClientB.end()]);
  claimClientA = null;
  claimClientB = null;

  // Crash 1: terminate the real OS worker after claim but before SENT.
  await insertSynthetic("n16-process-crash-before-sent");
  preSentWorker = startWorker("n16-pre-sent-crash-worker", 20000, 0);
  const locked = await waitForStatus("n16-process-crash-before-sent", "LOCKED");
  assert.equal(locked.locked_by, "n16-pre-sent-crash-worker");
  await delay(300);
  assert.equal(preSentWorker.child.exitCode, null);
  await killWorker(preSentWorker);
  preSentWorker = null;

  await admin.query(
    "update public.orchestrator_dispatch_queue set lease_expires_at=clock_timestamp()-interval '1 second' where dispatch_ref=$1 and queue_status='LOCKED'",
    ["n16-process-crash-before-sent"]
  );
  recoveryWorker = startWorker("n16-pre-sent-recovery-worker", 0, 0);
  try {
    await waitForStatus("n16-process-crash-before-sent", "ACKED");
  } finally {
    await killWorker(recoveryWorker);
    recoveryWorker = null;
  }
  const beforeSent = await admin.query(
    "select attempt_count from public.orchestrator_dispatch_queue where dispatch_ref=$1",
    ["n16-process-crash-before-sent"]
  );
  assert.equal(beforeSent.rows[0].attempt_count, 2);
  const beforeSentResults = await admin.query(
    "select count(*)::int as n from public.orchestrator_worker_results where run_ref=$1",
    ["run:n16-process-crash-before-sent"]
  );
  assert.equal(beforeSentResults.rows[0].n, 1);

  // Crash 2: terminate the real OS worker after SENT; quarantine, never replay.
  await insertSynthetic("n16-process-crash-after-sent");
  postSentWorker = startWorker("n16-post-sent-crash-worker", 0, 20000);
  const sent = await waitForStatus("n16-process-crash-after-sent", "SENT");
  assert.equal(sent.locked_by, "n16-post-sent-crash-worker");
  await delay(300);
  assert.equal(postSentWorker.child.exitCode, null);
  await killWorker(postSentWorker);
  postSentWorker = null;

  await admin.query(
    "update public.orchestrator_dispatch_queue set lease_expires_at=clock_timestamp()-interval '1 second' where dispatch_ref=$1 and queue_status='SENT'",
    ["n16-process-crash-after-sent"]
  );
  const quarantined = await admin.query("select public.n16_reconcile_expired_sent(50) as n");
  assert.equal(Number(quarantined.rows[0].n), 1);
  const afterSent = await admin.query(
    "select queue_status, attempt_count from public.orchestrator_dispatch_queue where dispatch_ref=$1",
    ["n16-process-crash-after-sent"]
  );
  assert.equal(afterSent.rows[0].queue_status, "FAILED");
  assert.equal(afterSent.rows[0].attempt_count, 1);
  const handoff = await admin.query(
    "select count(*)::int as n from public.orchestrator_manual_handoffs where handoff_ref=$1",
    ["n16_sent_lease:n16-process-crash-after-sent"]
  );
  assert.equal(handoff.rows[0].n, 1);
  const results = await admin.query(
    "select count(*)::int as n from public.orchestrator_worker_results where run_ref=$1",
    ["run:n16-process-crash-after-sent"]
  );
  assert.equal(results.rows[0].n, 0);
  const noReplay = await admin.query("select * from public.n16_claim_dispatches('n16-no-replay-worker',1,60)");
  assert.equal(noReplay.rowCount, 0);

  process.stdout.write(JSON.stringify({
    schema: "kingsmen.n16.worker-process-crash-integration.v1",
    status: "PASSED",
    passed: true,
    serverVersion: (await admin.query("show server_version")).rows[0].server_version,
    migrationsAppliedInIsolatedDatabase: migrationPaths,
    concurrentClaimSingleWinner: true,
    preSentProcessKilled: true,
    expiredLockedLeaseReclaimed: true,
    preSentResultCount: 1,
    postSentProcessKilled: true,
    expiredSentQuarantined: true,
    manualHandoffCreated: true,
    postSentAutoReplay: false,
    anonAuthenticatedAccessDenied: true,
    workerHasOnlyApprovedRpcAccess: true,
    workerDirectQueueTableAccess: false,
    stagingDatabaseTouched: false,
    externalProviderAction: false,
    productionWorkerProven: false
  }, null, 2) + "\n");
} finally {
  if (preSentWorker) await killWorker(preSentWorker).catch(() => {});
  if (postSentWorker) await killWorker(postSentWorker).catch(() => {});
  if (recoveryWorker) await killWorker(recoveryWorker).catch(() => {});
  if (claimClientA) await claimClientA.end().catch(() => {});
  if (claimClientB) await claimClientB.end().catch(() => {});
  if (adminConnected) {
    await admin.query(
      "select pg_terminate_backend(pid) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()"
    ).catch(() => {});
    await admin.end().catch(() => {});
  }
}
