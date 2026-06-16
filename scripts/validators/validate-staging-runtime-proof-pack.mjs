import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VALIDATION_PATH = path.join(ROOT, "reports", "staging", "staging-runtime-proof-pack-validation-latest.json");
const PROOF_PATH = path.join(ROOT, "reports", "staging", "staging-runtime-proof-pack-latest.json");

const requiredFiles = [
  "apps/api/src/ops/staging-runtime-proof-pack-boundary.ts",
  "manifests/launch/staging-runtime-proof-pack-v1.json",
  "docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md",
  "scripts/proof/prove-staging-runtime-proof-pack.mjs",
  "scripts/validators/validate-staging-runtime-proof-pack.mjs",
  "package.json",
  ".github/workflows/kingsmen-source-guard.yml",
  "docs/launch/KINGSMEN_LAUNCH_READINESS.md",
  "manifests/launch/kingsmen-launch-readiness-v1.json",
  "scripts/validators/validate-kingsmen-launch-readiness.mjs"
];

const requiredTokensByFile = {
  "apps/api/src/ops/staging-runtime-proof-pack-boundary.ts": [
    "STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY",
    "truth_vault_persistence_staging",
    "payfast_provider_sandbox_staging",
    "legal_privacy_publication_staging",
    "branch_protection_applied"
  ],
  "manifests/launch/staging-runtime-proof-pack-v1.json": [
    "kingsmen.staging-runtime-proof-pack.v1",
    "foundation_built_pending_staging_evidence_capture",
    "reports/staging/payfast-provider-sandbox-staging-latest.json",
    "reports/security/secrets-wiring-runtime-health-latest.json"
  ],
  "docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md": [
    "Staging runtime proof pack",
    "Production ready: **false**",
    "npm run staging:validate:pack",
    "reports/staging/truth-vault-persistence-staging-latest.json"
  ],
  "scripts/proof/prove-staging-runtime-proof-pack.mjs": [
    "STAGING_RUNTIME_PROOF_PACK_SOURCE_PROOF_PASSED",
    "stagingRuntimeEvidencePending: true"
  ],
  "package.json": [
    "staging:prove:pack",
    "staging:validate:pack"
  ],
  ".github/workflows/kingsmen-source-guard.yml": [
    "npm run staging:prove:pack",
    "npm run staging:validate:pack"
  ],
  "docs/launch/KINGSMEN_LAUNCH_READINESS.md": [
    "staging runtime proof pack",
    "npm run staging:validate:pack"
  ],
  "manifests/launch/kingsmen-launch-readiness-v1.json": [
    "staging-runtime-proof-pack-v1",
    "foundation_built_pending_staging_evidence_capture"
  ],
  "scripts/validators/validate-kingsmen-launch-readiness.mjs": [
    "staging:validate:pack",
    "STAGING_RUNTIME_EVIDENCE_PACK_REQUIRED"
  ]
};

const checks = [];
function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT, file);
  const exists = fs.existsSync(fullPath);
  check(`file_exists:${file}`, exists, file);
  if (exists) check(`file_nonempty:${file}`, fs.statSync(fullPath).size > 0, file);
}

for (const [file, tokens] of Object.entries(requiredTokensByFile)) {
  let content = "";
  try { content = read(file); } catch { content = ""; }
  for (const token of tokens) {
    check(`token:${file}:${token}`, content.includes(token), token);
  }
}

let proof = null;
try {
  proof = JSON.parse(read("reports/staging/staging-runtime-proof-pack-latest.json"));
  check("proof_passed", proof.passed === true, String(proof.passed));
  check("proof_status", proof.status === "STAGING_RUNTIME_PROOF_PACK_SOURCE_PROOF_PASSED", String(proof.status));
  check("proof_runtime_pending", proof.stagingRuntimeEvidencePending === true, String(proof.stagingRuntimeEvidencePending));
  check("proof_no_raw_secrets", proof.rawSecretsPrinted === false, String(proof.rawSecretsPrinted));
  check("proof_no_raw_candidate_data", proof.rawCandidateDataPrinted === false, String(proof.rawCandidateDataPrinted));
} catch (error) {
  check("proof_parse", false, error instanceof Error ? error.message : "proof parse failed");
}

const passed = checks.every((item) => item.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Staging Runtime Proof Pack",
  status: passed ? "STAGING_RUNTIME_PROOF_PACK_VALIDATED" : "STAGING_RUNTIME_PROOF_PACK_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  STAGING_RUNTIME_EVIDENCE_PACK_REQUIRED: true,
  failed_checks: checks.filter((item) => !item.passed).map(({ name, detail }) => ({ name, detail })),
  checks,
  generated_at: new Date().toISOString(),
  next_action: "Run the staging runtime evidence pack outside Git and keep public launch blocked until redacted evidence exists."
};

fs.mkdirSync(path.dirname(VALIDATION_PATH), { recursive: true });
fs.writeFileSync(VALIDATION_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
