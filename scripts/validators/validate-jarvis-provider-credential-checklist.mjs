import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/provider-credential-checklist/route.ts",
  page: "apps/web/src/app/founder/providers/jarvis-credentials/page.tsx",
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

const route = read(files.route);
const page = read(files.page);
const packageJson = read(files.packageJson);

[
  "kingsmen.jarvis-provider-credential-checklist.v1",
  "Jarvis Provider Credential Checklist",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "dockerIndependentBuildAllowed: true",
  "secretValuesReturned: false",
  "credentialsStoredInGit: false",
  "noDirectProviderCallsFromWeb: true",
  "OPENAI_API_KEY",
  "KINGSMEN_N8N_API_KEY",
  "AIRTABLE_API_KEY",
  "SMTP_PASSWORD",
  "PAYFAST_MERCHANT_KEY",
  "WHATSAPP_BUSINESS_TOKEN",
  "STORAGE_SECRET_KEY"
].forEach((token) => requireToken(files.route, route, token));

[
  "Provider credential checklist",
  "No secrets on screen",
  "Production readiness stays false",
  "OPENAI_API_KEY",
  "KINGSMEN_N8N_WEBHOOK_SECRET",
  "PAYFAST_PASSPHRASE",
  "STORAGE_SECRET_KEY"
].forEach((token) => requireToken(files.page, page, token));

requireToken(files.packageJson, packageJson, "jarvis:validate:provider-credential-checklist");

[
  "process.env.OPENAI_API_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.STORAGE_SECRET_KEY",
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
  module: "Jarvis Provider Credential Checklist",
  status: passed ? "JARVIS_PROVIDER_CREDENTIAL_CHECKLIST_SOURCE_VALIDATED" : "JARVIS_PROVIDER_CREDENTIAL_CHECKLIST_SOURCE_FAILED",
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
    ? "Run web build and open /founder/providers/jarvis-credentials with only the web server running."
    : "Repair Jarvis provider credential checklist source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
