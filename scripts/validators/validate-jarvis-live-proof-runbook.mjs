import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-live-proof-runbook/page.tsx",
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

const route = read(files.route);
const page = read(files.page);
const hudRoute = read(files.hudRoute);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-live-proof-runbook.v1",
  "Jarvis Live Proof Runbook",
  "jarvisSourceDesignComplete: true",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true",
  "dockerIndependentBuildAllowed: true",
  "secretValuesReturned: false",
  "source-seal-validate",
  "docker-api-truth-vault-runtime",
  "ai-provider-live-proof",
  "email-primary-proof",
  "payfast-itn-proof",
  "n8n-airtable-github-runtime",
  "branch-protection-launch-audit",
  "Do not skip failed gates"
].forEach((token) => requireToken(files.route, route, token));

[
  "Live proof runbook",
  "CLEAR THE LIVE QUEUE",
  "does not run commands from the browser",
  "Runtime live",
  "Production ready",
  "Public launch",
  "BLOCKED_BY_LOCAL_DOCKER",
  "BLOCKED_BY_PROVIDER_EVIDENCE",
  "BLOCKED_BY_SECURITY_GATE"
].forEach((token) => requireToken(files.page, page, token));

[
  "jarvisLiveProofRunbookConnected: true",
  "live-proof-runbook",
  "/founder/launch-control/jarvis-live-proof-runbook",
  "Live proof runbook"
].forEach((token) => requireToken(files.hudRoute, hudRoute, token));

[
  "jarvisLiveProofRunbookIndexed: true",
  "scripts/validators/validate-jarvis-live-proof-runbook.mjs",
  "manifests/jarvis/jarvis-live-proof-runbook-v1.json",
  "/founder/launch-control/jarvis-live-proof-runbook",
  "/api/jarvis/live-proof-runbook"
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
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
  requireAbsent(files.hudRoute, hudRoute, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Proof Runbook",
  status: passed ? "JARVIS_LIVE_PROOF_RUNBOOK_SOURCE_VALIDATED" : "JARVIS_LIVE_PROOF_RUNBOOK_SOURCE_FAILED",
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
    ? "Open /founder/launch-control/jarvis-live-proof-runbook and clear phases only with real evidence."
    : "Repair Jarvis live proof runbook wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
