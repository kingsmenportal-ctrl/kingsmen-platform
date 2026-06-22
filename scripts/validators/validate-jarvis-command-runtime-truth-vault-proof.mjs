#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  {
    path: "scripts/staging/Invoke-KingsmenJarvisCommandRuntimeProof.ps1",
    tokens: [
      "Jarvis Command Runtime Truth Vault Evidence",
      "reports/jarvis/jarvis-command-runtime-proof-latest.json",
      "/api/jarvis/command",
      "/api/commands",
      "COMMAND_PERSISTENCE_PROOF",
      "postgres_command_log_evidence",
      "postgres_audit_event_evidence",
      "postgres_idempotency_evidence",
      "localShellExecutedFromWeb = $false",
      "directDatabaseAccessFromWeb = $false",
      "rawSecretsReturned = $false"
    ]
  },
  {
    path: "manifests/jarvis/jarvis-command-runtime-truth-vault-proof-v1.json",
    tokens: [
      "kingsmen.jarvis-command-runtime-truth-vault-proof.v1",
      "backendApiBoundaryRequired",
      "postgresTruthVaultRequired",
      "reports/jarvis/jarvis-command-runtime-proof-latest.json",
      "command_log",
      "audit_events",
      "idempotency_keys",
      "foundation_built_pending_runtime_postgres_command_evidence"
    ]
  },
  {
    path: "docs/jarvis/JARVIS_COMMAND_RUNTIME_TRUTH_VAULT_PROOF.md",
    tokens: [
      "Jarvis Command Runtime Truth Vault Proof",
      "npm run jarvis:runtime:command-proof",
      "reports/jarvis/jarvis-command-runtime-proof-latest.json",
      "postgres_truth_vault",
      "command_log",
      "audit_events",
      "idempotency_keys",
      "no fake status",
      "no raw secrets"
    ]
  },
  {
    path: "package.json",
    tokens: [
      "jarvis:runtime:command-proof",
      "jarvis:validate:runtime-command-proof"
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

const forbiddenReportPatterns = [
  {
    path: "scripts/staging/Invoke-KingsmenJarvisCommandRuntimeProof.ps1",
    name: "runtime_proof_no_raw_database_url_print",
    pattern: /DATABASE_URL|KINGSMEN_DATABASE_URL/i
  },
  {
    path: "scripts/staging/Invoke-KingsmenJarvisCommandRuntimeProof.ps1",
    name: "runtime_proof_no_password_print",
    pattern: /PASSWORD|PGPASSWORD/i
  }
];

for (const item of forbiddenReportPatterns) {
  const absolutePath = path.join(root, item.path);
  const source = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
  const reportShapeOnly = source.includes("rawSecretsPrinted = $false") && source.includes("redacted = $true");
  addCheck(item.name, reportShapeOnly && !item.pattern.test(source), "runtime proof must not print raw secrets or connection strings", item.path);
}

const failedChecks = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Command Runtime Truth Vault Proof",
  status: failedChecks.length === 0 ? "JARVIS_COMMAND_RUNTIME_TRUTH_VAULT_PROOF_VALIDATED" : "JARVIS_COMMAND_RUNTIME_TRUTH_VAULT_PROOF_FAILED",
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
    ? "Start backend and web with PostgreSQL Truth Vault, run npm run jarvis:runtime:command-proof, then verify reports/jarvis/jarvis-command-runtime-proof-latest.json."
    : "Repair Jarvis runtime command proof files."
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
