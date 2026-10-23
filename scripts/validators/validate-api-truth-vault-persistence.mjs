#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const reportPath = join(root, "reports/api/api-truth-vault-persistence-latest.json");

const requiredFiles = [
  "apps/api/src/db/truth-vault-repository.ts",
  "apps/api/src/server.ts",
  "apps/api/package.json",
  "db/migrations/0001_n03_truth_vault.sql",
  "docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md"
];

const requiredTokens = {
  "apps/api/src/db/truth-vault-repository.ts": [
    "fromEnvironment",
    "NODE_ENV",
    "Memory-only Truth Vault is forbidden in NODE_ENV=production",
    "KINGSMEN_TRUTH_VAULT_MODE",
    "KINGSMEN_DATABASE_URL",
    "postgres_truth_vault",
    "recordCommand",
    "recordWorkflowResult",
    "readCandidateStatus",
    "readApplicationWorkbench",
    "createDeadLetter",
    "createApprovalRequest",
    "idempotency_keys",
    "command_log",
    "workflow_runs",
    "evidence_ledger",
    "audit_events",
    "worker_heartbeats",
    "dead_letter_queue",
    "approval_requests",
    "metadata->>'applicationRef'",
    "await this.pool"
  ],
  "apps/api/src/server.ts": [
    "TruthVaultRepository",
    "truthVault.storageMode",
    "truthVault.recordCommand",
    "truthVault.recordWorkflowResult",
    "truthVault.readCandidateStatus",
    "truthVault.readApplicationWorkbench",
    "truthVault.healthCheck"
  ],
  "apps/api/package.json": [
    "\"pg\"",
    "\"build\": \"tsc -p tsconfig.json\""
  ],
  "db/migrations/0001_n03_truth_vault.sql": [
    "CREATE TABLE IF NOT EXISTS idempotency_keys",
    "CREATE TABLE IF NOT EXISTS command_log",
    "CREATE TABLE IF NOT EXISTS workflow_runs",
    "CREATE TABLE IF NOT EXISTS evidence_ledger",
    "CREATE TABLE IF NOT EXISTS audit_events",
    "CREATE TABLE IF NOT EXISTS worker_heartbeats",
    "CREATE TABLE IF NOT EXISTS dead_letter_queue",
    "CREATE TABLE IF NOT EXISTS approval_requests",
    "metadata jsonb NOT NULL DEFAULT '{}'::jsonb"
  ],
  "docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md": [
    "KINGSMEN_TRUTH_VAULT_MODE=postgres",
    "applications.metadata.applicationRef",
    "postgres_truth_vault",
    "Remaining before public production"
  ]
};

const forbiddenTokens = {
  "apps/api/src/db/truth-vault-repository.ts": [
    "prepared for PostgreSQL persistence."
  ],
  "docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md": [
    "Production ready: **true**"
  ]
};

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function check(name, passed, detail = "") {
  return { name, passed, detail };
}

const checks = [];

for (const file of requiredFiles) {
  const full = join(root, file);
  checks.push(check(`file_exists:${file}`, existsSync(full), file));
}

for (const [file, tokens] of Object.entries(requiredTokens)) {
  const full = join(root, file);
  if (!existsSync(full)) continue;
  const content = read(file);
  for (const token of tokens) {
    checks.push(check(`contains:${file}:${token}`, content.includes(token), token));
  }
}

for (const [file, tokens] of Object.entries(forbiddenTokens)) {
  const full = join(root, file);
  if (!existsSync(full)) continue;
  const content = read(file);
  for (const token of tokens) {
    checks.push(check(`forbidden_absent:${file}:${token}`, !content.includes(token), token));
  }
}

try {
  const packageJson = JSON.parse(read("apps/api/package.json"));
  checks.push(check("package_json_has_pg_dependency", Boolean(packageJson.dependencies?.pg), JSON.stringify(packageJson.dependencies ?? {})));
} catch (error) {
  checks.push(check("package_json_parse", false, error instanceof Error ? error.message : String(error)));
}

const failed = checks.filter((item) => !item.passed);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.api-truth-vault-persistence.validation.v1",
  module: "API Truth Vault Persistence",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  productionReady: false,
  storageModes: ["memory_development_only", "postgres_truth_vault"],
  generatedAtIso: new Date().toISOString(),
  summary: {
    checks: checks.length,
    failed: failed.length
  },
  failedChecks: failed,
  checks,
  nextAction: passed
    ? "Run apps/api build and then execute staging PostgreSQL integration proof with KINGSMEN_TRUTH_VAULT_MODE=postgres."
    : "Repair Truth Vault persistence files before moving to the next launch blocker."
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
process.exitCode = passed ? 0 : 1;
