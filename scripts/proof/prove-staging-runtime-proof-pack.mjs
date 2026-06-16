import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports", "staging", "staging-runtime-proof-pack-latest.json");

const requiredFiles = [
  "apps/api/src/ops/staging-runtime-proof-pack-boundary.ts",
  "manifests/launch/staging-runtime-proof-pack-v1.json",
  "docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md",
  "scripts/proof/prove-staging-runtime-proof-pack.mjs"
];

const requiredEvidenceReports = [
  "reports/staging/truth-vault-persistence-staging-latest.json",
  "reports/staging/web-backend-boundary-staging-latest.json",
  "reports/staging/rls-sql-isolation-staging-latest.json",
  "reports/staging/payfast-provider-sandbox-staging-latest.json",
  "reports/staging/backup-restore-drill-staging-latest.json",
  "reports/security/secrets-wiring-runtime-health-latest.json",
  "reports/staging/communications-provider-staging-latest.json",
  "reports/staging/observability-incident-staging-latest.json",
  "reports/staging/legal-privacy-publication-staging-latest.json",
  "reports/repo/main-branch-protection-apply-latest.json"
];

const requiredTokens = [
  "STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY",
  "truth_vault_persistence_staging",
  "web_backend_boundary_staging",
  "rls_sql_isolation_staging",
  "payfast_provider_sandbox_staging",
  "backup_restore_drill_staging",
  "secrets_runtime_health_staging",
  "communications_provider_staging",
  "observability_incident_staging",
  "legal_privacy_publication_staging",
  "branch_protection_applied"
];

const checks = [];
const runtimeEvidenceStatus = [];
function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(ROOT, file));
  check(`file_exists:${file}`, exists, file);
}

let boundary = "";
try {
  boundary = read("apps/api/src/ops/staging-runtime-proof-pack-boundary.ts");
} catch {
  boundary = "";
}

for (const token of requiredTokens) {
  check(`boundary_token:${token}`, boundary.includes(token), token);
}

let manifest = null;
try {
  manifest = JSON.parse(read("manifests/launch/staging-runtime-proof-pack-v1.json"));
  check("manifest_schema", manifest.schema === "kingsmen.staging-runtime-proof-pack.v1", manifest.schema);
  check("manifest_status", manifest.status === "foundation_built_pending_staging_evidence_capture", manifest.status);
  check("manifest_production_false", manifest.productionReady === false, String(manifest.productionReady));
  check("manifest_public_launch_false", manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed));
  check("manifest_runtime_pending_true", manifest.stagingRuntimeEvidencePending === true, String(manifest.stagingRuntimeEvidencePending));
  check("manifest_no_raw_secrets", manifest.rawSecretsAllowedInEvidence === false, String(manifest.rawSecretsAllowedInEvidence));
  check("manifest_no_raw_candidate_data", manifest.rawCandidateDataAllowedInEvidence === false, String(manifest.rawCandidateDataAllowedInEvidence));
  for (const report of requiredEvidenceReports) {
    check(`manifest_runtime_report:${report}`, manifest.requiredEvidenceReports?.includes(report) === true, report);
  }
} catch (error) {
  check("manifest_parse", false, error instanceof Error ? error.message : "manifest parse failed");
}

for (const report of requiredEvidenceReports) {
  const exists = fs.existsSync(path.join(ROOT, report));
  runtimeEvidenceStatus.push({ report, exists, required: true });
  check(`runtime_evidence_declared:${report}`, true, exists ? "present for review" : "pending staging run");
}

const passed = checks.every((item) => item.passed);
const report = {
  schema: "kingsmen.staging-runtime-proof-pack-report.v1",
  module: "Staging Runtime Proof Pack",
  status: passed ? "STAGING_RUNTIME_PROOF_PACK_SOURCE_PROOF_PASSED" : "STAGING_RUNTIME_PROOF_PACK_SOURCE_PROOF_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  stagingRuntimeEvidencePending: true,
  rawSecretsPrinted: false,
  rawCandidateDataPrinted: false,
  requiredEvidenceReports,
  runtimeEvidenceStatus,
  checks,
  failed: checks.filter((item) => !item.passed),
  generatedAt: new Date().toISOString(),
  nextAction: "Run staging runtime evidence capture outside Git, then attach redacted reports before opening final assembly."
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
