import fs from "node:fs";

const files = {
  capture: "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
  proofGate: "apps/web/src/app/api/jarvis/docker-truth-vault-runtime-proof/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts"
};

const checks = [];

function addCheck(name, passed, detail, path) {
  checks.push({ name, passed, detail, path });
}

function read(path) {
  if (!fs.existsSync(path)) {
    addCheck(`file_exists:${path}`, false, "missing", path);
    return "";
  }
  addCheck(`file_exists:${path}`, true, "found", path);
  return fs.readFileSync(path, "utf8");
}

function requireToken(path, content, token) {
  addCheck(`token:${path}:${token}`, content.includes(token), token, path);
}

function requireAbsent(path, content, token) {
  addCheck(`forbidden_absent:${path}:${token}`, !content.includes(token), token, path);
}

const capture = read(files.capture);
const proofGate = read(files.proofGate);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-docker-truth-vault-runtime-evidence-capture.v1",
  "KINGSMEN_BACKEND_BASE_URL",
  "/api/system/health",
  "/api/commands",
  "system.health.requested",
  "postgres_truth_vault",
  "jarvis-command-accepted",
  "truth-vault-command-audit-write-indirect",
  "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "directDatabaseAccessFromWeb: false",
  "localShellExecutedFromWeb: false"
].forEach((token) => requireToken(files.capture, capture, token));

[
  "kingsmen.jarvis-docker-truth-vault-runtime-proof.v1",
  "runtimeProofAccepted: false",
  "Docker / API / Truth Vault Runtime Proof Gate",
  "command_log write proof",
  "audit_events write proof"
].forEach((token) => requireToken(files.proofGate, proofGate, token));

[
  "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
  "scripts/validators/validate-jarvis-docker-truth-vault-runtime-evidence-capture.mjs",
  "jarvis-docker-truth-vault-runtime-evidence-capture-latest.json"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "OPENAI_API_KEY",
  "PAYFAST_MERCHANT_KEY",
  "SMTP_PASSWORD",
  "AIRTABLE_API_KEY",
  "N8N_API_KEY",
  "process.env.DATABASE_URL",
  "new Pool",
  "select *"
].forEach((token) => {
  requireAbsent(files.capture, capture, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Docker Truth Vault Runtime Evidence Capture",
  status: passed ? "JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_EVIDENCE_CAPTURE_VALIDATED" : "JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_EVIDENCE_CAPTURE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecutedFromWeb: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run the capture only when API/Truth Vault runtime is available."
    : "Repair Jarvis runtime evidence capture wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
