import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/n8n-airtable-github-runtime-proof/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx"
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
  "kingsmen.jarvis-n8n-airtable-github-runtime-proof.v1",
  "providerToolProofAccepted: false",
  "n8nThinRelayAccepted: false",
  "airtableMirrorAccepted: false",
  "githubConnectorAccepted: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "n8nThinRelayOnly: true",
  "airtableMirrorOnly: true",
  "githubTokensMayBeReturned: false",
  "postgresTruthVaultRemainsAuthority: true",
  "noDirectProviderCallsFromWeb: true",
  "n8n-thin-relay-runtime-proof",
  "airtable-human-mirror-runtime-proof",
  "github-tool-connector-runtime-proof",
  "KINGSMEN_N8N_BASE_URL stored outside Git",
  "AIRTABLE_API_KEY stored outside Git",
  "redacted repo metadata proof"
].forEach((token) => requireToken(files.route, route, token));

[
  "Provider Tool Runtime Proof",
  "Runtime live",
  "Gate accepted",
  "n8n Thin Relay",
  "Airtable Human Mirror",
  "GitHub Connector",
  "Browser routes cannot call n8n, Airtable, or GitHub directly",
  "no secret values may be returned"
].forEach((token) => requireToken(files.page, page, token));

[
  "process.env.N8N",
  "process.env.AIRTABLE",
  "process.env.GITHUB_TOKEN",
  "process.env.KINGSMEN_N8N_API_KEY",
  "process.env.AIRTABLE_API_KEY",
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
  module: "Jarvis n8n Airtable GitHub Runtime Proof Gate",
  status: passed ? "JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF_GATE_VALIDATED" : "JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF_GATE_FAILED",
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
    ? "Capture real n8n, Airtable, and GitHub connector runtime evidence before acceptance."
    : "Repair provider tool runtime proof gate source."
}, null, 2));

process.exit(passed ? 0 : 1);
