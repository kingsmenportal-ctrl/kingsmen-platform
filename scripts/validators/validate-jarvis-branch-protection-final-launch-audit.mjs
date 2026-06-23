import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/branch-protection-final-launch-audit/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-branch-final-audit/page.tsx",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  runbook: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  ledger: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  acceptance: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
  launchGate: "apps/web/src/app/api/jarvis/source-launch-gate/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts",
  manifest: "manifests/jarvis/jarvis-branch-protection-final-launch-audit-v1.json",
  docs: "docs/jarvis/JARVIS_BRANCH_PROTECTION_FINAL_LAUNCH_AUDIT.md"
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

const contents = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));

[
  "kingsmen.jarvis-branch-protection-final-launch-audit.v1",
  "branchProtectionProofAccepted: false",
  "finalLaunchAuditAccepted: false",
  "rollbackProofAccepted: false",
  "stagingEvidencePackAccepted: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "mainBranchMustBeProtected: true",
  "requiredReviewsAndChecksRequired: true",
  "rollbackEvidenceRequired: true",
  "founderLaunchApprovalRequired: true",
  "final-launch-audit"
].forEach((token) => requireToken(files.route, contents.route, token));

[
  "/api/jarvis/branch-protection-final-launch-audit",
  "Branch Protection / Final Audit",
  "Production",
  "Public launch",
  "Evidence required"
].forEach((token) => requireToken(files.page, contents.page, token));

[
  "branchProtectionFinalLaunchAuditGateConnected: true",
  "proofRoute: \"/api/jarvis/branch-protection-final-launch-audit\"",
  "final launch audit",
  "founder approval"
].forEach((token) => requireToken(files.liveQueue, contents.liveQueue, token));

[
  "branchProtectionFinalLaunchAuditGateConnected: true",
  "proofGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\"",
  "final staging evidence pack",
  "founder approval"
].forEach((token) => requireToken(files.runbook, contents.runbook, token));

[
  "branchProtectionFinalLaunchAuditGateConnected: true",
  "proofGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\"",
  "final staging evidence pack",
  "founder approval"
].forEach((token) => requireToken(files.ledger, contents.ledger, token));

[
  "branchProtectionFinalLaunchAuditGateConnected: true",
  "proofGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\"",
  "final staging evidence pack",
  "founder launch approval"
].forEach((token) => requireToken(files.acceptance, contents.acceptance, token));

[
  "jarvisBranchProtectionFinalLaunchAuditGateConnected: true",
  "branchProtectionFinalLaunchAuditGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\"",
  "proofGateRoute: \"/api/jarvis/branch-protection-final-launch-audit\""
].forEach((token) => requireToken(files.launchGate, contents.launchGate, token));

[
  "scripts/validators/validate-jarvis-branch-protection-final-launch-audit.mjs",
  "manifests/jarvis/jarvis-branch-protection-final-launch-audit-v1.json",
  "/founder/launch-control/jarvis-branch-final-audit",
  "/api/jarvis/branch-protection-final-launch-audit",
  "jarvisBranchProtectionFinalLaunchAuditIndexed: true",
  "branch-protection-final-launch-audit-gate"
].forEach((token) => requireToken(files.proofPack, contents.proofPack, token));

[
  "kingsmen.jarvis-branch-protection-final-launch-audit.manifest.v1",
  "productionReady",
  "publicLaunchAllowed",
  "sourceGateBuilt"
].forEach((token) => requireToken(files.manifest, contents.manifest, token));

[
  "Jarvis Branch Protection Final Launch Audit Gate",
  "main branch protection",
  "founder launch approval"
].forEach((token) => requireToken(files.docs, contents.docs, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD"
].forEach((token) => {
  Object.entries(files).forEach(([key, path]) => requireAbsent(path, contents[key], token));
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Branch Protection Final Launch Audit",
  status: passed ? "JARVIS_BRANCH_PROTECTION_FINAL_LAUNCH_AUDIT_SOURCE_VALIDATED" : "JARVIS_BRANCH_PROTECTION_FINAL_LAUNCH_AUDIT_SOURCE_FAILED",
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
    ? "Run web build and keep launch blocked until real branch protection, rollback, staging evidence, final audit, and founder approval exist."
    : "Repair branch protection final launch audit wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
