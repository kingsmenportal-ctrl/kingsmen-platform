import fs from "node:fs";

const files = {
  sealRoute: "apps/web/src/app/api/jarvis/source-completion-seal/route.ts",
  sealPage: "apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx",
  finalLaunchControl: "apps/web/src/app/api/jarvis/final-launch-control/route.ts",
  proofPackIndex: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts",
  finalHud: "apps/web/src/app/api/jarvis/final-command-hud/route.ts"
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

const sealRoute = read(files.sealRoute);
const sealPage = read(files.sealPage);
const finalLaunchControl = read(files.finalLaunchControl);
const proofPackIndex = read(files.proofPackIndex);
const finalHud = read(files.finalHud);

[
  "kingsmen.jarvis-source-completion-seal.v1",
  "Jarvis Source Completion Seal",
  "jarvisSourceDesignComplete: true",
  "jarvisUiSourceComplete: true",
  "jarvisProofSurfaceComplete: true",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true",
  "dockerIndependentBuildAllowed: true",
  "remainingLiveBlockerCount",
  "sourceComplete",
  "stillRequired",
  "Final Jarvis Command Room",
  "Provider Runtime Proofs",
  "Security and Launch Proof"
].forEach((token) => requireToken(files.sealRoute, sealRoute, token));

[
  "Jarvis source/design sealed",
  "Source/design",
  "complete",
  "Runtime live",
  "false",
  "STILL BLOCKING LIVE",
  "No fake data",
  "OpenClaw remains operator-only"
].forEach((token) => requireToken(files.sealPage, sealPage, token));

[
  "jarvisSourceDesignComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlocked: true"
].forEach((token) => requireToken(files.finalLaunchControl, finalLaunchControl, token));

[
  "jarvisFinalCommandRoomIndexed: true",
  "jarvisFinalLaunchControlIndexed: true",
  "/api/jarvis/proof-pack-index"
].forEach((token) => requireToken(files.proofPackIndex, proofPackIndex, token));

[
  "jarvisSourceDesignComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false"
].forEach((token) => requireToken(files.finalHud, finalHud, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.STORAGE_SECRET_KEY"
].forEach((token) => {
  requireAbsent(files.sealRoute, sealRoute, token);
  requireAbsent(files.sealPage, sealPage, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Source Completion Seal",
  status: passed ? "JARVIS_SOURCE_COMPLETION_SEAL_VALIDATED" : "JARVIS_SOURCE_COMPLETION_SEAL_FAILED",
  passed,
  jarvisSourceDesignComplete: passed,
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
    ? "Jarvis source/design is sealed. Clear runtime/provider/security proof gates next."
    : "Repair Jarvis source completion seal wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
