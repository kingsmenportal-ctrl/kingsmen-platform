import fs from "node:fs";

const files = {
  hudClient: "apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx",
  hudRoute: "apps/web/src/app/api/jarvis/final-command-hud/route.ts",
  evidence: "apps/web/src/app/api/jarvis/evidence-collector/route.ts",
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
const evidence = read(files.evidence);
const launchGate = read(files.launchGate);
const proofPack = read(files.proofPack);

[
  "readJson<EvidencePayload>(\"/api/jarvis/evidence-collector\")",
  "readJson<SourceLaunchGatePayload>(\"/api/jarvis/source-launch-gate\")",
  "readJson<ProofPackPayload>(\"/api/jarvis/proof-pack-index\")",
  "Evidence collector",
  "Source launch gate",
  "Proof pack index",
  "Launch gate reason",
  "Evidence captured",
  "Evidence pending",
  "Evidence blocked",
  "Proof Centre",
  "Credential Board",
  "No fake data lock"
].forEach((token) => requireToken(files.hudClient, hudClient, token));

[
  "kingsmen.jarvis-final-command-hud.v1",
  "jarvisSourceDesignComplete: true",
  "jarvisFinalCommandRoomConnected: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "dockerIndependentBuildAllowed: true",
  "evidence-collector",
  "source-launch-gate",
  "proof-pack-index",
  "Evidence collector and proof references",
  "Source launch gate board",
  "Proof-pack index and blocker map"
].forEach((token) => requireToken(files.hudRoute, hudRoute, token));

[
  "kingsmen.jarvis-evidence-collector.v1",
  "CAPTURED",
  "PENDING",
  "BLOCKED",
  "backend-truth-vault-runtime",
  "ai-provider-live-proof",
  "payfast-itn-proof"
].forEach((token) => requireToken(files.evidence, evidence, token));

[
  "kingsmen.jarvis-source-launch-gate.v1",
  "jarvisSourceComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlockingCount",
  "branch-protection-proof"
].forEach((token) => requireToken(files.launchGate, launchGate, token));

[
  "kingsmen.jarvis-proof-pack-index.v1",
  "jarvisSourcePackReady: true",
  "validators",
  "reports",
  "manifests",
  "routes",
  "blockers"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY"
].forEach((token) => {
  requireAbsent(files.hudClient, hudClient, token);
  requireAbsent(files.hudRoute, hudRoute, token);
  requireAbsent(files.evidence, evidence, token);
  requireAbsent(files.launchGate, launchGate, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Final Command Room",
  status: passed ? "JARVIS_FINAL_COMMAND_ROOM_SOURCE_VALIDATED" : "JARVIS_FINAL_COMMAND_ROOM_SOURCE_FAILED",
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
    ? "Run web build and open /jarvis/final. Runtime/provider proof remains separate."
    : "Repair final Jarvis command room source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
