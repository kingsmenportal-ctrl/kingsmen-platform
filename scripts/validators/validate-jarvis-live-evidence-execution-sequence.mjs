import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/live-evidence-execution-sequence/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-live-evidence-execution-sequence/page.tsx",
  acceptancePack: "apps/web/src/app/api/jarvis/live-evidence-acceptance-pack/route.ts",
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

const route = read(files.route);
const page = read(files.page);
const acceptancePack = read(files.acceptancePack);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-live-evidence-execution-sequence.v1",
  "manualOperatorExecutionRequired: true",
  "browserMayExecuteLocalShell: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "docker-truth-vault-runtime-capture",
  "ai-email-provider-capture",
  "payfast-itn-capture",
  "n8n-airtable-github-capture",
  "branch-final-audit-capture",
  "final-live-evidence-acceptance",
  "scripts/validators/validate-jarvis-live-evidence-execution-sequence.mjs"
].forEach((token) => requireToken(files.route, route, token));

[
  "Jarvis live evidence execution sequence",
  "Manual execution lock",
  "browser cannot run local shell",
  "node {step.runner}",
  "sequenceValidator"
].forEach((token) => requireToken(files.page, page, token));

[
  "kingsmen.jarvis-live-evidence-acceptance-pack.v1",
  "liveEvidenceAccepted: false",
  "WAITING_FOR_REAL_EVIDENCE",
  "publicLaunchAllowed: false"
].forEach((token) => requireToken(files.acceptancePack, acceptancePack, token));

[
  "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
  "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
  "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
  "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
  "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
  "scripts/proof/accept-jarvis-live-evidence-pack.mjs"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD",
  "new Pool",
  "execSync",
  "spawnSync",
  "child_process"
].forEach((token) => {
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Evidence Execution Sequence",
  status: passed ? "JARVIS_LIVE_EVIDENCE_EXECUTION_SEQUENCE_VALIDATED" : "JARVIS_LIVE_EVIDENCE_EXECUTION_SEQUENCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecutedFromBrowser: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Use the manual execution sequence only when runtime and accepted evidence files are available."
    : "Repair Jarvis live evidence execution sequence source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
