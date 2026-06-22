import fs from "node:fs";

const files = {
  dashboard: "apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx",
  completionBoard: "apps/web/src/app/api/jarvis/completion-board/route.ts",
  liveIndex: "apps/web/src/app/api/jarvis/live-index/route.ts",
  packageJson: "package.json"
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

const dashboard = read(files.dashboard);
const completionBoard = read(files.completionBoard);
const liveIndex = read(files.liveIndex);
const packageJson = read(files.packageJson);

[
  "CompletionBoardPayload",
  "LiveIndexPayload",
  "CompletionItem",
  "LiveIndexEntry",
  "readJson<CompletionBoardPayload>(\"/api/jarvis/completion-board\")",
  "readJson<LiveIndexPayload>(\"/api/jarvis/live-index\")",
  "Jarvis completion board",
  "Live index map",
  "Next source batches",
  "dockerIndependentBuildAllowed",
  "BLOCKED_BY_LOCAL_DOCKER",
  "RUNTIME_PASSED",
  "PENDING_CREDENTIALS",
  "local-docker-runtime",
  "Completion JSON",
  "Live index JSON",
  "No placeholder data is substituted",
  "Anything unavailable stays unavailable"
].forEach((token) => requireToken(files.dashboard, dashboard, token));

[
  "jarvis-completion-board",
  "/api/jarvis/completion-board",
  "dockerIndependentBuildAllowed",
  "runtimeBlocker",
  "LOCAL_DOCKER_OR_API_RUNTIME_NOT_AVAILABLE"
].forEach((token) => requireToken(files.liveIndex, liveIndex, token));

[
  "kingsmen.jarvis-completion-board.v1",
  "dockerIndependentBuildAllowed: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "local-docker-runtime",
  "BLOCKED_BY_LOCAL_DOCKER"
].forEach((token) => requireToken(files.completionBoard, completionBoard, token));

[
  "jarvis:validate:completion-board",
  "jarvis:validate:dashboard-completion-board"
].forEach((token) => requireToken(files.packageJson, packageJson, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "OPENCLAW_SECRET",
  "process.env.OPENCLAW_SECRET"
].forEach((token) => {
  requireAbsent(files.dashboard, dashboard, token);
  requireAbsent(files.completionBoard, completionBoard, token);
  requireAbsent(files.liveIndex, liveIndex, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Dashboard Completion Board Wiring",
  status: passed ? "JARVIS_DASHBOARD_COMPLETION_BOARD_WIRING_VALIDATED" : "JARVIS_DASHBOARD_COMPLETION_BOARD_WIRING_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build and open /jarvis with only the web server running."
    : "Repair Jarvis dashboard completion board wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
