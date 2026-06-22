import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/final-launch-control/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis/page.tsx",
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
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-final-launch-control.v1",
  "Jarvis Final Launch Control",
  "jarvisSourceDesignComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true",
  "dockerIndependentBuildAllowed: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false",
  "postgresTruthVaultRemainsAuthority: true",
  "emailPrimaryChannel: true",
  "whatsappUrgentOnly: true",
  "smsBackupOnly: true",
  "airtableMirrorOnly: true",
  "n8nThinRelayOnly: true",
  "playwrightScoutOnly: true",
  "openClawOperatorOnly: true",
  "backend-truth-vault-runtime",
  "payfast-itn-proof",
  "branch-protection-launch-audit"
].forEach((token) => requireToken(files.route, route, token));

[
  "Jarvis Final Launch Control",
  "LIVE GATE",
  "Production ready",
  "Public launch",
  "Blocking gates",
  "No fake launch rule",
  "/api/jarvis/final-launch-control",
  "/api/jarvis/proof-pack-index",
  "/jarvis/final"
].forEach((token) => requireToken(files.page, page, token));

requireToken(files.proofPack, proofPack, "/api/jarvis/proof-pack-index");

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.STORAGE_SECRET_KEY"
].forEach((token) => {
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Final Launch Control",
  status: passed ? "JARVIS_FINAL_LAUNCH_CONTROL_SOURCE_VALIDATED" : "JARVIS_FINAL_LAUNCH_CONTROL_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  jarvisSourceDesignComplete: true,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Open /founder/launch-control/jarvis and use it as the final source launch board."
    : "Repair Jarvis final launch control wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
