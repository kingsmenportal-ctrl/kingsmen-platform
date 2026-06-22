import fs from "node:fs";

const files = {
  hudClient: "apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx",
  hudRoute: "apps/web/src/app/api/jarvis/final-command-hud/route.ts",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  launchGate: "apps/web/src/app/api/jarvis/source-launch-gate/route.ts",
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

const hudClient = read(files.hudClient);
const hudRoute = read(files.hudRoute);
const liveQueue = read(files.liveQueue);
const launchGate = read(files.launchGate);
const proofPack = read(files.proofPack);

[
  "LiveProofQueuePayload",
  "readJson<LiveProofQueuePayload>(\"/api/jarvis/live-proof-queue\")",
  "Live proof queue",
  "Live proof queue summary",
  "Queue blocked",
  "Queue creds",
  "Queue runtime",
  "/founder/launch-control/jarvis-live-proof-queue",
  "Runtime live: {String(liveQueue?.jarvisRuntimeLive ?? false)}",
  "Launch blocked: {String(liveQueue?.launchBlocked ?? true)}"
].forEach((token) => requireToken(files.hudClient, hudClient, token));

[
  "jarvisLiveProofQueueConnected: true",
  "live-proof-queue",
  "/api/jarvis/live-proof-queue",
  "Live proof queue and blocker tracker",
  "clear live proof queue blockers"
].forEach((token) => requireToken(files.hudRoute, hudRoute, token));

[
  "kingsmen.jarvis-live-proof-queue.v1",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "docker-api-truth-vault-runtime",
  "ai-provider-live-call",
  "email-primary-proof",
  "payfast-itn-proof",
  "branch-protection-proof"
].forEach((token) => requireToken(files.liveQueue, liveQueue, token));

[
  "jarvisLiveProofQueueConnected: true",
  "liveProofQueueRoute: \"/api/jarvis/live-proof-queue\"",
  "live-proof-queue-control",
  "Work the live proof queue"
].forEach((token) => requireToken(files.launchGate, launchGate, token));

[
  "jarvisLiveProofQueueIndexed: true",
  "scripts/validators/validate-jarvis-final-command-room-live-proof-queue.mjs",
  "manifests/jarvis/jarvis-live-proof-queue-v1.json",
  "/founder/launch-control/jarvis-live-proof-queue",
  "/api/jarvis/live-proof-queue",
  "Live proof queue not cleared"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD"
].forEach((token) => {
  requireAbsent(files.hudClient, hudClient, token);
  requireAbsent(files.hudRoute, hudRoute, token);
  requireAbsent(files.liveQueue, liveQueue, token);
  requireAbsent(files.launchGate, launchGate, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Final Command Room Live Proof Queue Wiring",
  status: passed ? "JARVIS_FINAL_COMMAND_ROOM_LIVE_PROOF_QUEUE_WIRING_VALIDATED" : "JARVIS_FINAL_COMMAND_ROOM_LIVE_PROOF_QUEUE_WIRING_FAILED",
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
    ? "Run web build and open /jarvis/final to view the live proof queue in the command room."
    : "Repair final Jarvis HUD live proof queue wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
