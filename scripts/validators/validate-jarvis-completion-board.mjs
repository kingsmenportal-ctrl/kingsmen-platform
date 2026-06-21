import fs from "node:fs";

const files = {
  completionBoard: "apps/web/src/app/api/jarvis/completion-board/route.ts",
  liveIndex: "apps/web/src/app/api/jarvis/live-index/route.ts",
  package: "package.json"
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

const completionBoard = read(files.completionBoard);
const liveIndex = read(files.liveIndex);
const pkg = read(files.package);

[
  "kingsmen.jarvis-completion-board.v1",
  "Jarvis Completion Board",
  "dockerIndependentBuildAllowed: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "noFakeData: true",
  "rawSecretsReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false",
  "postgresTruthVaultRemainsAuthority: true",
  "airtableMirrorOnly: true",
  "n8nThinRelayOnly: true",
  "playWrightScoutOnly: true",
  "whatsappUrgentOnly: true",
  "emailPrimaryChannel: true",
  "openclaw-operator-policy",
  "playwright-scout-map-fallback",
  "n8n-thin-relay",
  "github-tool-connector",
  "airtable-human-mirror",
  "email-primary-channel",
  "whatsapp-urgent-sms-backup",
  "payfast-provider-proof-queue",
  "ai-provider-router",
  "local-docker-runtime",
  "BLOCKED_BY_LOCAL_DOCKER",
  "Keep Docker/API runtime proof separate from source completion"
].forEach((token) => requireToken(files.completionBoard, completionBoard, token));

[
  "jarvis-completion-board",
  "/api/jarvis/completion-board",
  "dockerIndependentBuildAllowed",
  "runtimeBlocker",
  "LOCAL_DOCKER_OR_API_RUNTIME_NOT_AVAILABLE",
  "github-tool-connector",
  "airtable-human-mirror",
  "n8n-thin-relay",
  "playwright-scout-map-fallback",
  "payfast-provider-proof-queue",
  "whatsapp-urgent-sms-backup",
  "npm run jarvis:validate:completion-board"
].forEach((token) => requireToken(files.liveIndex, liveIndex, token));

[
  "jarvis:validate:completion-board"
].forEach((token) => requireToken(files.package, pkg, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "writeFile",
  "new Pool",
  "OPENCLAW_SECRET",
  "process.env.OPENCLAW_SECRET"
].forEach((token) => {
  requireAbsent(files.completionBoard, completionBoard, token);
  requireAbsent(files.liveIndex, liveIndex, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Docker-Independent Completion Board",
  status: passed ? "JARVIS_COMPLETION_BOARD_SOURCE_VALIDATED" : "JARVIS_COMPLETION_BOARD_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  dockerIndependentBuildAllowed: true,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build and open /api/jarvis/completion-board while Docker/API runtime is blocked."
    : "Repair Jarvis completion board source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
