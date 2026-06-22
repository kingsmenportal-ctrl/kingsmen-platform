import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx"
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

[
  "kingsmen.jarvis-live-proof-queue.v1",
  "Jarvis Live Proof Queue",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true",
  "dockerIndependentBuildAllowed: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false",
  "noDirectProviderCallsFromWeb: true",
  "docker-api-truth-vault-runtime",
  "ai-provider-live-call",
  "email-primary-proof",
  "payfast-itn-proof",
  "n8n-thin-relay-proof",
  "airtable-human-mirror-proof",
  "github-tool-runtime-proof",
  "branch-protection-proof"
].forEach((token) => requireToken(files.route, route, token));

[
  "What still blocks LIVE",
  "Runtime live",
  "Production ready",
  "Public launch",
  "BLOCKED_BY_LOCAL_DOCKER",
  "BLOCKED_BY_PROVIDER_EVIDENCE",
  "BLOCKED_BY_SECURITY_GATE"
].forEach((token) => requireToken(files.page, page, token));

[
  "process.env",
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "writeFile"
].forEach((token) => {
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Proof Queue",
  status: passed ? "JARVIS_LIVE_PROOF_QUEUE_SOURCE_VALIDATED" : "JARVIS_LIVE_PROOF_QUEUE_SOURCE_FAILED",
  passed,
  jarvisRuntimeLive: false,
  productionReady: false,
  publicLaunchAllowed: false,
  launchBlocked: true,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Use this queue to clear live blockers one by one."
    : "Repair Jarvis live proof queue source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
