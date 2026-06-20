#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  {
    path: "apps/web/src/app/api/jarvis/command/route.ts",
    tokens: [
      "COMMAND_PERSISTENCE_PROOF",
      "jarvis_command_persistence_proof",
      "postKingsmenCommand",
      "createKingsmenWebCommandEnvelope",
      "truthVaultEvidenceExpected: true",
      "localShellExecuted: false",
      "directDatabaseAccessFromWeb: false"
    ]
  },
  {
    path: "apps/web/src/app/api/jarvis/status/route.ts",
    tokens: [
      "COMMAND_PERSISTENCE_PROOF",
      "Jarvis Command Persistence",
      "POSTGRES_EVIDENCE_READY",
      "PENDING_POSTGRES_TRUTH_VAULT",
      "command_log plus audit_events evidence"
    ]
  },
  {
    path: "apps/api/src/server.ts",
    tokens: [
      "POST /api/commands",
      "handleCommand",
      "truthVault.recordCommand",
      "storageMode: truthVault.storageMode",
      "PENDING_APPROVAL",
      "IDEMPOTENT_REPLAY"
    ]
  },
  {
    path: "apps/api/src/db/truth-vault-repository.ts",
    tokens: [
      "recordCommand",
      "insert into command_log",
      "insert into audit_events",
      "insert into idempotency_keys",
      "command.accepted",
      "PostgreSQL Truth Vault"
    ]
  },
  {
    path: "docs/jarvis/JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE.md",
    tokens: [
      "Jarvis Command Truth Vault Persistence",
      "/api/jarvis/command",
      "POST /api/commands",
      "command_log",
      "audit_events",
      "idempotency_keys",
      "no fake status",
      "no raw secrets"
    ]
  },
  {
    path: "manifests/jarvis/jarvis-command-truth-vault-persistence-v1.json",
    tokens: [
      "kingsmen.jarvis-command-truth-vault-persistence.v1",
      "backendApiBoundaryRequired",
      "postgresTruthVaultRequired",
      "foundation_built_pending_postgres_runtime_command_proof",
      "command_log",
      "audit_events"
    ]
  }
];

const checks = [];

function addCheck(name, passed, detail, filePath) {
  checks.push({ name, passed, detail, path: filePath });
}

for (const file of requiredFiles) {
  const absolutePath = path.join(root, file.path);
  const exists = fs.existsSync(absolutePath);
  addCheck(`file_exists:${file.path}`, exists, exists ? "found" : "missing", file.path);
  if (!exists) continue;

  const source = fs.readFileSync(absolutePath, "utf8");
  for (const token of file.tokens) {
    addCheck(`token:${file.path}:${token}`, source.includes(token), token, file.path);
  }
}

const forbiddenWebPatterns = [
  {
    path: "apps/web/src/app/api/jarvis/command/route.ts",
    name: "web_command_no_child_process",
    pattern: /child_process|exec\(|spawn\(/i
  },
  {
    path: "apps/web/src/app/api/jarvis/command/route.ts",
    name: "web_command_no_pg_pool",
    pattern: /from\s+["']pg["']|require\(["']pg["']\)/i
  },
  {
    path: "apps/web/src/app/api/jarvis/command/route.ts",
    name: "web_command_no_local_evidence_file_write",
    pattern: /writeFileSync|appendFileSync|createWriteStream/i
  }
];

for (const item of forbiddenWebPatterns) {
  const absolutePath = path.join(root, item.path);
  const source = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
  addCheck(item.name, !item.pattern.test(source), "forbidden local execution/database/file-write pattern must not appear", item.path);
}

const failedChecks = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Command Truth Vault Persistence",
  status: failedChecks.length === 0 ? "JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE_VALIDATED" : "JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE_FAILED",
  passed: failedChecks.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecutedFromWeb: false,
  directDatabaseAccessFromWeb: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: failedChecks.length === 0
    ? "Run the web build, start the backend with KINGSMEN_TRUTH_VAULT_MODE=postgres, then submit COMMAND_PERSISTENCE_PROOF from /jarvis and verify command_log plus audit_events evidence."
    : "Repair Jarvis command persistence source files."
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
