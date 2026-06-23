import fs from "node:fs";

const files = {
  runner: "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
  auditRoute: "apps/web/src/app/api/jarvis/branch-protection-final-launch-audit/route.ts",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  runbook: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  ledger: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  acceptance: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
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
const auditRoute = read(files.auditRoute);
const liveQueue = read(files.liveQueue);
const runbook = read(files.runbook);
const ledger = read(files.ledger);
const acceptance = read(files.acceptance);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-branch-protection-final-launch-audit-evidence-capture.v1",
  "jarvis-main-branch-protection-evidence.accepted.json",
  "jarvis-rollback-release-evidence.accepted.json",
  "jarvis-final-staging-evidence-pack.accepted.json",
  "jarvis-final-launch-audit-evidence.accepted.json",
  "jarvis-founder-launch-approval.accepted.json",
  "branchProtectionFinalLaunchAuditEvidenceAccepted",
  "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json"
].forEach((token) => requireToken(files.runner, runner, token));

[
  "captureRunner",
  "captureReportPath",
  "captureValidator",
  "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
  "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
  "scripts/validators/validate-jarvis-branch-protection-final-launch-audit-evidence-capture.mjs"
].forEach((token) => requireToken(files.auditRoute, auditRoute, token));

[
  "node scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs"
].forEach((token) => {
  requireToken(files.liveQueue, liveQueue, token);
  requireToken(files.runbook, runbook, token);
});

[
  "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
  "branch-protection-launch-audit-evidence"
].forEach((token) => requireToken(files.ledger, ledger, token));

[
  "branch-protection-final-launch-audit-evidence-capture",
  "proofGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\""
].forEach((token) => requireToken(files.acceptance, acceptance, token));

[
  "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
  "scripts/validators/validate-jarvis-branch-protection-final-launch-audit-evidence-capture.mjs",
  "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
  "manifests/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-v1.json",
  "jarvisBranchProtectionFinalLaunchAuditEvidenceCaptureIndexed: true"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "OPENAI_API_KEY",
  "PAYFAST_MERCHANT_KEY",
  "SMTP_PASSWORD",
  "secretValuesReturned: true",
  "rawSecretsReturned: true"
].forEach((token) => {
  requireAbsent(files.runner, runner, token);
  requireAbsent(files.auditRoute, auditRoute, token);
  requireAbsent(files.liveQueue, liveQueue, token);
  requireAbsent(files.runbook, runbook, token);
  requireAbsent(files.ledger, ledger, token);
  requireAbsent(files.acceptance, acceptance, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Branch Protection Final Launch Audit Evidence Capture",
  status: passed ? "JARVIS_BRANCH_FINAL_AUDIT_EVIDENCE_CAPTURE_SOURCE_VALIDATED" : "JARVIS_BRANCH_FINAL_AUDIT_EVIDENCE_CAPTURE_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run the branch/final audit evidence capture runner when accepted redacted evidence files are available."
    : "Repair branch/final audit evidence capture source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
