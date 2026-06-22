import fs from "node:fs";

const files = {
  ledgerRoute: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  ledgerPage: "apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx",
  hudRoute: "apps/web/src/app/api/jarvis/final-command-hud/route.ts",
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

const ledgerRoute = read(files.ledgerRoute);
const ledgerPage = read(files.ledgerPage);
const hudRoute = read(files.hudRoute);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-live-proof-evidence-ledger.v1",
  "Jarvis Live Proof Evidence Ledger",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true",
  "SOURCE_READY",
  "MISSING",
  "BLOCKED",
  "REJECTED",
  "ACCEPTED_PREVIOUSLY",
  "docker-api-truth-vault-evidence",
  "ai-live-call-evidence",
  "email-primary-evidence",
  "payfast-itn-evidence",
  "n8n-airtable-github-evidence",
  "branch-protection-launch-audit-evidence",
  "reject if return URL marks paid",
  "reject if raw API key is printed"
].forEach((token) => requireToken(files.ledgerRoute, ledgerRoute, token));

[
  "Live proof evidence ledger",
  "Evidence decides live",
  "Missing runtime/provider/security evidence keeps Jarvis blocked",
  "Runtime live",
  "Production ready",
  "Public launch",
  "Secrets returned"
].forEach((token) => requireToken(files.ledgerPage, ledgerPage, token));

[
  "jarvisLiveProofEvidenceLedgerConnected: true",
  "live-proof-evidence-ledger",
  "/founder/proof-centre/jarvis-live-proof-evidence-ledger",
  "Live proof evidence ledger"
].forEach((token) => requireToken(files.hudRoute, hudRoute, token));

[
  "jarvisLiveProofEvidenceLedgerIndexed: true",
  "scripts/validators/validate-jarvis-live-proof-evidence-ledger.mjs",
  "manifests/jarvis/jarvis-live-proof-evidence-ledger-v1.json",
  "/api/jarvis/live-proof-evidence-ledger",
  "/founder/proof-centre/jarvis-live-proof-evidence-ledger",
  "Live proof evidence ledger not accepted"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.STORAGE_SECRET_KEY"
].forEach((token) => {
  requireAbsent(files.ledgerRoute, ledgerRoute, token);
  requireAbsent(files.ledgerPage, ledgerPage, token);
  requireAbsent(files.hudRoute, hudRoute, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Proof Evidence Ledger",
  status: passed ? "JARVIS_LIVE_PROOF_EVIDENCE_LEDGER_SOURCE_VALIDATED" : "JARVIS_LIVE_PROOF_EVIDENCE_LEDGER_SOURCE_FAILED",
  passed,
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
    ? "Open /founder/proof-centre/jarvis-live-proof-evidence-ledger and keep clearing launch-critical evidence."
    : "Repair Jarvis live proof evidence ledger source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
