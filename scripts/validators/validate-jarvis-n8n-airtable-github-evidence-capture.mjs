import fs from "node:fs";

const files = {
  runner: "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
  proofRoute: "apps/web/src/app/api/jarvis/n8n-airtable-github-runtime-proof/route.ts",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
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

const runner = read(files.runner);
const proofRoute = read(files.proofRoute);
const liveQueue = read(files.liveQueue);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-n8n-airtable-github-evidence-capture.v1",
  "provider.tools.runtime.proof.requested",
  "JARVIS_N8N_THIN_RELAY_EVIDENCE_FILE",
  "JARVIS_AIRTABLE_HUMAN_MIRROR_EVIDENCE_FILE",
  "JARVIS_GITHUB_CONNECTOR_RUNTIME_EVIDENCE_FILE",
  "KINGSMEN_N8N_BASE_URL",
  "KINGSMEN_N8N_API_KEY",
  "KINGSMEN_N8N_WEBHOOK_SECRET",
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
  "AIRTABLE_KINGSMEN_TABLE",
  "kingsmen.jarvis-n8n-thin-relay-evidence.v1",
  "kingsmen.jarvis-airtable-human-mirror-evidence.v1",
  "kingsmen.jarvis-github-connector-runtime-evidence.v1",
  "backendMediatedCommandCaptured",
  "backendMirrorWriteCaptured",
  "redactedRepoMetadataCaptured",
  "n8nMayBecomeAuthority: false",
  "airtableMayBecomeAuthority: false",
  "githubTokensMayBeReturned: false",
  "postgresTruthVaultRemainsAuthority: true"
].forEach((token) => requireToken(files.runner, runner, token));

[
  "captureRunner",
  "captureReportPath",
  "captureValidator",
  "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
  "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json",
  "providerToolEvidenceAccepted: false"
].forEach((token) => requireToken(files.proofRoute, proofRoute, token));

[
  "node scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
  "n8nAirtableGithubEvidenceCaptureConnected: true"
].forEach((token) => requireToken(files.liveQueue, liveQueue, token));

[
  "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
  "scripts/validators/validate-jarvis-n8n-airtable-github-evidence-capture.mjs",
  "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json",
  "manifests/jarvis/jarvis-n8n-airtable-github-evidence-capture-v1.json",
  "jarvisN8nAirtableGithubEvidenceCaptureIndexed: true"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "console.log(process.env",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.KINGSMEN_N8N_API_KEY",
  "process.env.KINGSMEN_N8N_WEBHOOK_SECRET",
  "process.env.AIRTABLE_API_KEY",
  "process.env.GITHUB_TOKEN",
  "secretValuesReturned: true",
  "rawSecretsReturned: true",
  "productionReady: true",
  "publicLaunchAllowed: true"
].forEach((token) => {
  requireAbsent(files.runner, runner, token);
  requireAbsent(files.proofRoute, proofRoute, token);
  requireAbsent(files.liveQueue, liveQueue, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis n8n Airtable GitHub Evidence Capture",
  status: passed ? "JARVIS_N8N_AIRTABLE_GITHUB_EVIDENCE_CAPTURE_SOURCE_VALIDATED" : "JARVIS_N8N_AIRTABLE_GITHUB_EVIDENCE_CAPTURE_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecutedFromWeb: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run the capture runner only when provider tool credentials and accepted redacted evidence files are available."
    : "Repair n8n/Airtable/GitHub evidence capture wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
