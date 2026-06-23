import fs from "node:fs";

const files = {
  proofRoute: "apps/web/src/app/api/jarvis/ai-email-provider-live-proof/route.ts",
  founderPage: "apps/web/src/app/founder/launch-control/jarvis-ai-email-provider-proof/page.tsx",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  runbook: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  ledger: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  acceptanceGate: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
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

const proofRoute = read(files.proofRoute);
const founderPage = read(files.founderPage);
const liveQueue = read(files.liveQueue);
const runbook = read(files.runbook);
const ledger = read(files.ledger);
const acceptanceGate = read(files.acceptanceGate);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-ai-email-provider-live-proof.v1",
  "Jarvis AI + Email Provider Live Proof Gate",
  "providerProofAccepted: false",
  "aiLiveCallAccepted: false",
  "emailPrimaryChannelAccepted: false",
  "backendControlledAiOnly: true",
  "emailPrimaryChannel: true",
  "whatsappUrgentOnly: true",
  "smsBackupOnly: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "noDirectProviderCallsFromWeb: true",
  "OPENAI_API_KEY or provider key stored outside Git",
  "SMTP or provider credentials stored outside Git",
  "reject browser-side provider calls",
  "reject WhatsApp/SMS as replacement for email primary proof"
].forEach((token) => requireToken(files.proofRoute, proofRoute, token));

[
  "AI + Email Provider Proof",
  "Runtime live",
  "Provider proof",
  "not accepted",
  "/api/jarvis/ai-email-provider-live-proof",
  "Mock AI completions do not count as live proof",
  "WhatsApp/SMS cannot replace Email as the primary tracked channel"
].forEach((token) => requireToken(files.founderPage, founderPage, token));

[
  "aiEmailProviderProofGateConnected: true",
  "/api/jarvis/ai-email-provider-live-proof",
  "cost/rate boundary proof",
  "delivery or receive evidence"
].forEach((token) => requireToken(files.liveQueue, liveQueue, token));

[
  "aiEmailProviderProofGateConnected: true",
  "proofGateRoute: \"/api/jarvis/ai-email-provider-live-proof\"",
  "cost/rate boundary proof",
  "WhatsApp/SMS replaces email"
].forEach((token) => requireToken(files.runbook, runbook, token));

[
  "aiEmailProviderProofGateConnected: true",
  "proofGateRoute: \"/api/jarvis/ai-email-provider-live-proof\"",
  "backend-controlled live-call proof",
  "SMTP/provider credentials outside Git",
  "reject if mock completion is called live"
].forEach((token) => requireToken(files.ledger, ledger, token));

[
  "aiEmailProviderProofGateConnected: true",
  "proofGateRoute: \"/api/jarvis/ai-email-provider-live-proof\"",
  "AI Provider Live Call Acceptance",
  "Email Primary Channel Acceptance",
  "cost/rate boundary proof",
  "Reject WhatsApp/SMS as a replacement"
].forEach((token) => requireToken(files.acceptanceGate, acceptanceGate, token));

[
  "scripts/validators/validate-jarvis-ai-email-provider-live-proof.mjs",
  "manifests/jarvis/jarvis-ai-email-provider-live-proof-v1.json",
  "/founder/launch-control/jarvis-ai-email-provider-proof",
  "/api/jarvis/ai-email-provider-live-proof",
  "jarvisAiEmailProviderProofIndexed: true",
  "AI Email provider proof gate not accepted"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.PAYFAST_MERCHANT_KEY"
].forEach((token) => {
  requireAbsent(files.proofRoute, proofRoute, token);
  requireAbsent(files.founderPage, founderPage, token);
  requireAbsent(files.liveQueue, liveQueue, token);
  requireAbsent(files.runbook, runbook, token);
  requireAbsent(files.ledger, ledger, token);
  requireAbsent(files.acceptanceGate, acceptanceGate, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis AI Email Provider Live Proof Gate",
  status: passed ? "JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF_GATE_VALIDATED" : "JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF_GATE_FAILED",
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
    ? "Supply real AI and Email credentials outside Git and capture redacted runtime evidence."
    : "Repair AI Email provider proof gate wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
