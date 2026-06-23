import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx"
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
  "kingsmen.jarvis-live-proof-acceptance-gate.v1",
  "Jarvis Live Proof Acceptance Gate",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "acceptanceDecision: \"BLOCK_LAUNCH\"",
  "launchBlocked: true",
  "ACCEPTED_SOURCE",
  "ACCEPTED_PREVIOUS_RUNTIME",
  "PENDING_EVIDENCE",
  "BLOCKED",
  "REJECTED_UNTIL_REAL_EVIDENCE",
  "docker-api-truth-vault-runtime",
  "ai-provider-live-call",
  "email-primary-proof",
  "payfast-itn-proof",
  "branch-protection-proof",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false",
  "noDirectProviderCallsFromWeb: true"
].forEach((token) => requireToken(files.route, route, token));

[
  "Live proof acceptance gate",
  "BLOCK LAUNCH UNTIL REAL EVIDENCE",
  "BLOCK_LAUNCH",
  "Return/cancel pages cannot mark paid",
  "protected branch",
  "does not expose secrets"
].forEach((token) => requireToken(files.page, page, token));

[
  "process.env.OPENAI_API_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.PAYFAST_PASSPHRASE",
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool"
].forEach((token) => {
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Proof Acceptance Gate",
  status: passed ? "JARVIS_LIVE_PROOF_ACCEPTANCE_GATE_SOURCE_VALIDATED" : "JARVIS_LIVE_PROOF_ACCEPTANCE_GATE_SOURCE_FAILED",
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
    ? "Wire this acceptance gate into final HUD and proof-pack index, then run web build."
    : "Repair Jarvis live proof acceptance gate source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
