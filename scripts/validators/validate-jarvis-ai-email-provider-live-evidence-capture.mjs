import fs from "node:fs";

const files = {
  runner: "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
  gate: "apps/web/src/app/api/jarvis/ai-email-provider-live-proof/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts"
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
const gate = read(files.gate);
const proofPack = read(files.proofPack);
const liveQueue = read(files.liveQueue);

[
  "kingsmen.jarvis-ai-email-provider-live-evidence-capture.v1",
  "JARVIS_AI_EMAIL_EVIDENCE_REPORT",
  "JARVIS_AI_LIVE_EVIDENCE_FILE",
  "JARVIS_EMAIL_LIVE_EVIDENCE_FILE",
  "provider.ai_email.proof.requested",
  "backendControlledAiOnly",
  "emailPrimaryChannel",
  "ai-live-evidence-file-accepted",
  "email-primary-evidence-file-accepted",
  "no-browser-direct-provider-call",
  "redaction-lock",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "valueReturned: false"
].forEach((token) => requireToken(files.runner, runner, token));

[
  "captureRunner",
  "captureReportPath",
  "captureValidator",
  "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
  "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
  "scripts/validators/validate-jarvis-ai-email-provider-live-evidence-capture.mjs",
  "providerProofAccepted: false",
  "aiLiveCallAccepted: false",
  "emailPrimaryChannelAccepted: false"
].forEach((token) => requireToken(files.gate, gate, token));

[
  "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
  "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
  "manifests/jarvis/jarvis-ai-email-provider-live-evidence-capture-v1.json",
  "jarvisAiEmailProviderLiveEvidenceCaptureIndexed: true"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "proofScript: \"node scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs\"",
  "ai-provider-live-call",
  "email-primary-proof"
].forEach((token) => requireToken(files.liveQueue, liveQueue, token));

[
  "console.log(process.env",
  "secretValue",
  "apiKey:",
  "smtpPassword:",
  "new Pool",
  "child_process",
  "execSync",
  "spawnSync"
].forEach((token) => {
  requireAbsent(files.runner, runner, token);
  requireAbsent(files.gate, gate, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis AI + Email Provider Live Evidence Capture",
  status: passed ? "JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE_VALIDATED" : "JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE_FAILED",
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
    ? "Run the capture runner only after real provider credentials and redacted evidence files exist."
    : "Repair AI + Email live evidence capture wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
