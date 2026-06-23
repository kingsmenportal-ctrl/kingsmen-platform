import fs from "node:fs";

const files = {
  proofRoute: "apps/web/src/app/api/jarvis/docker-truth-vault-runtime-proof/route.ts",
  founderPage: "apps/web/src/app/founder/launch-control/jarvis-docker-runtime-proof/page.tsx",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  runbook: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  ledger: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  acceptance: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
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

const proofRoute = read(files.proofRoute);
const founderPage = read(files.founderPage);
const liveQueue = read(files.liveQueue);
const runbook = read(files.runbook);
const ledger = read(files.ledger);
const acceptance = read(files.acceptance);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-docker-truth-vault-runtime-proof.v1",
  "LIVE_PROOF_BATCH_1",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "runtimeProofAccepted: false",
  "BLOCKED_BY_LOCAL_DOCKER",
  "API health HTTP 200",
  "postgres_truth_vault",
  "command log write proof",
  "audit event write proof",
  "rawSecretsReturned: false",
  "directDatabaseAccessFromWeb: false"
].forEach((token) => requireToken(files.proofRoute, proofRoute, token));

[
  "Docker / API / Truth Vault Proof",
  "Runtime live",
  "Production",
  "Public launch",
  "/api/jarvis/docker-truth-vault-runtime-proof",
  "API health HTTP 200",
  "postgres_truth_vault"
].forEach((token) => requireToken(files.founderPage, founderPage, token));

[
  "proofRoute: \"/api/jarvis/docker-truth-vault-runtime-proof\"",
  "redacted runtime proof"
].forEach((token) => requireToken(files.liveQueue, liveQueue, token));

[
  "proofGateRoute: \"/api/jarvis/docker-truth-vault-runtime-proof\"",
  "dockerRuntimeProofGateConnected: true",
  "redacted runtime output"
].forEach((token) => requireToken(files.runbook, runbook, token));

[
  "proofGateRoute: \"/api/jarvis/docker-truth-vault-runtime-proof\"",
  "dockerRuntimeProofGateConnected: true",
  "reject if proof is only a static source route"
].forEach((token) => requireToken(files.ledger, ledger, token));

[
  "proofGateRoute: \"/api/jarvis/docker-truth-vault-runtime-proof\"",
  "dockerRuntimeProofGateConnected: true",
  "redacted runtime proof is captured"
].forEach((token) => requireToken(files.acceptance, acceptance, token));

[
  "scripts/validators/validate-jarvis-docker-truth-vault-runtime-proof.mjs",
  "manifests/jarvis/jarvis-docker-truth-vault-runtime-proof-v1.json",
  "/founder/launch-control/jarvis-docker-runtime-proof",
  "/api/jarvis/docker-truth-vault-runtime-proof",
  "jarvisDockerTruthVaultRuntimeProofIndexed: true"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.DATABASE_URL",
  "process.env.KINGSMEN_DATABASE_URL",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD"
].forEach((token) => {
  requireAbsent(files.proofRoute, proofRoute, token);
  requireAbsent(files.founderPage, founderPage, token);
  requireAbsent(files.liveQueue, liveQueue, token);
  requireAbsent(files.runbook, runbook, token);
  requireAbsent(files.ledger, ledger, token);
  requireAbsent(files.acceptance, acceptance, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Docker Truth Vault Runtime Proof Gate",
  status: passed ? "JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_PROOF_GATE_VALIDATED" : "JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_PROOF_GATE_FAILED",
  passed,
  runtimeProofAccepted: false,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build. Runtime proof remains blocked until Docker/API/Truth Vault evidence is captured."
    : "Repair Docker Truth Vault runtime proof gate wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
