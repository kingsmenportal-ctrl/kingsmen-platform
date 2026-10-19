#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const serverSource = readFileSync(join(root, "apps/api/src/server.ts"), "utf8");
const repository = readFileSync(join(root, "apps/api/src/db/truth-vault-repository.ts"), "utf8");
const failures = [];
const checks = [];
const protectedRoutes = [
  'pathname === "/api/jarvis/runtime-control"',
  'pathname === "/api/commands"',
  'pathname === "/api/workflow/result" || pathname === "/api/workflow-results"',
  'method === "GET" && candidateId',
  'method === "GET" && applicationId'
];
for (const route of protectedRoutes) {
  const at = serverSource.indexOf(route);
  if (at < 0) {
    failures.push(`Missing expected route branch: ${route}`);
    continue;
  }
  const nextBranch = serverSource.indexOf("\n      if (", at + route.length);
  const block = serverSource.slice(at, nextBranch < 0 ? serverSource.length : nextBranch);
  if (!block.includes("authorizeApiRequest(request, response")) failures.push(`Route is missing request authentication: ${route}`);
}
for (const marker of [
  'process.env.KINGSMEN_API_SERVICE_TOKEN',
  'process.env.KINGSMEN_WORKFLOW_SERVICE_TOKEN',
  'timingSafeEqual',
  'API_AUTH_NOT_CONFIGURED',
  'configuredToken.length < 32',
  'UNAUTHENTICATED'
]) {
  if (!serverSource.includes(marker)) failures.push(`Missing API authentication control: ${marker}`);
}
if (!repository.includes('private async withTransaction') || !repository.includes('client.query("ROLLBACK")')) {
  failures.push("Truth Vault command/workflow writes must use a transaction helper with rollback.");
}
if ((repository.match(/pg_advisory_xact_lock\(hashtext\(\$1\)\)/g) ?? []).length < 3) {
  failures.push("Expected transaction-scoped advisory locks for command idempotency and workflow idempotency/run identity.");
}
checks.push({ check: "source_auth_and_transaction_boundaries", passed: failures.length === 0 });

function cleanEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  for (const key of ["KINGSMEN_API_SERVICE_TOKEN", "KINGSMEN_WORKFLOW_SERVICE_TOKEN", "KINGSMEN_DATABASE_URL", "DATABASE_URL"]) {
    if (!(key in overrides)) delete env[key];
  }
  return env;
}

function runFailClosedProbe(label, overrides, expectedText) {
  const result = spawnSync(process.execPath, [join(root, "apps/api/dist/server.js")], {
    cwd: root,
    env: cleanEnv(overrides),
    encoding: "utf8",
    timeout: 10000
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const passed = result.status !== 0 && output.includes(expectedText);
  checks.push({ check: label, passed, exitCode: result.status, expectedFailureObserved: output.includes(expectedText) });
  if (!passed) failures.push(`${label}: runtime did not fail closed as expected.`);
}

async function getFreePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a local API test port.");
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return address.port;
}

async function runtimeAuthSmokeTest() {
  const port = await getFreePort();
  const child = spawn(process.execPath, [join(root, "apps/api/dist/server.js")], {
    cwd: root,
    env: cleanEnv({
      NODE_ENV: "development",
      KINGSMEN_TRUTH_VAULT_MODE: "memory",
      PORT: String(port),
      KINGSMEN_API_HOST: "127.0.0.1",
      KINGSMEN_API_SERVICE_TOKEN: "ci-api-service-token-0123456789-abcdef",
      KINGSMEN_WORKFLOW_SERVICE_TOKEN: "ci-workflow-service-token-0123456789-abcdef"
    }),
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  let health;
  try {
    let ready = false;
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`API exited before becoming ready: ${logs.slice(-1200)}`);
      try {
        const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) {
          health = await response.json();
          ready = true;
          break;
        }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (!ready) throw new Error(`API did not become ready: ${logs.slice(-1200)}`);
    const healthPassed = health.storageMode === "memory_development_only" && health.truthVault?.storageMode === "memory_development_only";
    checks.push({ check: "runtime_health_reports_development_memory_mode", passed: healthPassed });
    if (!healthPassed) failures.push("Runtime health did not accurately report development-only memory mode.");

    const cases = [
      { check: "commands_missing_auth_rejected", path: "/api/commands", method: "POST", expected: 401 },
      { check: "jarvis_missing_auth_rejected", path: "/api/jarvis/runtime-control", method: "POST", expected: 401 },
      { check: "candidate_read_missing_auth_rejected", path: "/api/candidates/ci-synthetic/status", method: "GET", expected: 401 },
      { check: "application_read_missing_auth_rejected", path: "/api/applications/ci-synthetic/workbench", method: "GET", expected: 401 },
      { check: "workflow_missing_auth_rejected", path: "/api/workflow/result", method: "POST", expected: 401 }
    ];
    for (const item of cases) {
      const response = await fetch(`${base}${item.path}`, {
        method: item.method,
        headers: { authorization: "Bearer deliberately-invalid-ci-token", "content-type": "application/json" },
        body: item.method === "POST" ? "{}" : undefined,
        signal: AbortSignal.timeout(2000)
      });
      const body = await response.json().catch(() => ({}));
      const passed = response.status === item.expected && body.code === "UNAUTHENTICATED";
      checks.push({ check: item.check, passed, status: response.status, responseCode: body.code ?? null });
      if (!passed) failures.push(`${item.check}: expected HTTP ${item.expected} UNAUTHENTICATED.`);
    }
  } finally {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise(resolve => child.once("exit", resolve)),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

const distServer = join(root, "apps/api/dist/server.js");
if (!existsSync(distServer)) failures.push("Compiled API server is missing; run npm run api:build before runtime boundary validation.");
else {
  runFailClosedProbe(
    "production_memory_mode_fails_closed",
    { NODE_ENV: "production", KINGSMEN_TRUTH_VAULT_MODE: "memory" },
    "Production requires PostgreSQL Truth Vault"
  );
  runFailClosedProbe(
    "postgres_mode_without_database_url_fails_closed",
    { NODE_ENV: "production", KINGSMEN_TRUTH_VAULT_MODE: "postgres" },
    "requires KINGSMEN_DATABASE_URL or DATABASE_URL"
  );
  try {
    await runtimeAuthSmokeTest();
  } catch (error) {
    failures.push(`Runtime authentication smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
    checks.push({ check: "runtime_authentication_smoke_test", passed: false });
  }
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.n02-n03.runtime-boundary-validation.v2",
  result: passed ? "N02_N03_RUNTIME_BOUNDARIES_VALIDATED" : "N02_N03_RUNTIME_BOUNDARIES_BLOCKED",
  passed,
  productionReady: false,
  protectedRoutesChecked: protectedRoutes.length,
  authIsServiceToServiceOnly: true,
  liveApiAuthTestExecuted: checks.some(item => item.check === "commands_missing_auth_rejected" && item.passed),
  transactionRollbackRuntimeTestExecuted: false,
  stagingPersistenceProofExecuted: false,
  checks,
  failures,
  nextAction: passed
    ? "Local runtime fail-closed/auth smoke tests passed. Still run the separately gated staging persistence, concurrency, rollback, and restart proofs against the approved staging API."
    : "Fix all source/runtime boundary failures and rerun the API build plus this validator."
};
const reportPath = join(root, "reports/api/n02-n03-runtime-boundary-source-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
