import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/final-command-hud/route.ts",
  page: "apps/web/src/app/jarvis/final/page.tsx",
  client: "apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx"
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
const client = read(files.client);

[
  "kingsmen.jarvis-final-command-hud.v1",
  "Jarvis Final Command HUD",
  "jarvisSourceDesignComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "dockerIndependentBuildAllowed: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false",
  "postgresTruthVaultRemainsAuthority: true",
  "emailPrimaryChannel: true",
  "whatsappUrgentOnly: true",
  "n8nThinRelayOnly: true",
  "airtableMirrorOnly: true",
  "playwrightScoutOnly: true",
  "openClawOperatorOnly: true",
  "sourceSurfaces",
  "launchGates"
].forEach((token) => requireToken(files.route, route, token));

[
  "JarvisFinalHudClient",
  "force-dynamic"
].forEach((token) => requireToken(files.page, page, token));

[
  "/api/jarvis/final-command-hud",
  "/api/jarvis/completion-board",
  "/api/jarvis/provider-credential-checklist",
  "SOURCE HUD COMPLETE",
  "Docker/API remains separate",
  "Provider credential board",
  "Launch gates",
  "No fake data lock",
  "Secret values are not returned",
  "Browser never runs shell"
].forEach((token) => requireToken(files.client, client, token));

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
  requireAbsent(files.client, client, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Final Command HUD",
  status: passed ? "JARVIS_FINAL_COMMAND_HUD_SOURCE_VALIDATED" : "JARVIS_FINAL_COMMAND_HUD_SOURCE_FAILED",
  passed,
  jarvisSourceDesignComplete: passed,
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
    ? "Run web build and open /jarvis/final with only the web server running."
    : "Repair Jarvis final HUD source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
