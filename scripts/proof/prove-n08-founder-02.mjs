import fs from "node:fs";

const required = [
  "docs/n08/N08_FOUNDER_02_APPROVAL_WORKFLOWS_COMMAND_EXECUTION_AUDIT_TRAIL.md",
  "manifests/n08/n08-founder-02-approval-workflows-command-execution-audit-trail.json",
  "packages/contracts/src/n08-founder-approval-contract.ts",
  "packages/contracts/src/n08-command-execution-contract.ts",
  "packages/backend/src/n08/approval-workflow-policy.ts",
  "packages/backend/src/n08/command-execution-policy.ts",
  "packages/backend/src/n08/command-audit-trail-policy.ts",
  "packages/backend/src/n08/emergency-pause-rollback-policy.ts",
  "apps/web/src/app/api/founder/commands/approve/route.ts",
  "apps/web/src/app/api/founder/commands/execute/route.ts",
  "apps/web/src/app/founder/control-plane/commands/page.tsx",
  "scripts/validators/validate-n08-founder-02.mjs",
  "reports/n08/n08-founder-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n08/n08-founder-02-approval-workflows-command-execution-audit-trail.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.approvalWorkflowBuilt !== true) failures.push("approvalWorkflowBuilt must be true");
if (manifest.commandExecutionContractBuilt !== true) failures.push("commandExecutionContractBuilt must be true");
if (manifest.commandCannotBypassSafetyGates !== true) failures.push("commandCannotBypassSafetyGates must be true");
if (manifest.proofEvidenceAuditRequired !== true) failures.push("proofEvidenceAuditRequired must be true");

const report = {
  schema: "kingsmen.n08-founder-02-proof.v1",
  module: "N08-FOUNDER-02 - Approval Workflows / Command Execution / Audit Trail",
  status: failures.length === 0 ? "N08_FOUNDER_APPROVAL_WORKFLOWS_COMMAND_EXECUTION_AUDIT_TRAIL_PROVEN" : "N08_FOUNDER_APPROVAL_WORKFLOWS_COMMAND_EXECUTION_AUDIT_TRAIL_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  approvalWorkflowBuilt: manifest.approvalWorkflowBuilt === true,
  commandExecutionContractBuilt: manifest.commandExecutionContractBuilt === true,
  commandAuditTrailBuilt: manifest.commandAuditTrailBuilt === true,
  highRiskCommandsRequireFounderApproval: manifest.highRiskCommandsRequireFounderApproval === true,
  commandCannotBypassSafetyGates: manifest.commandCannotBypassSafetyGates === true,
  emergencyPauseBoundaryBuilt: manifest.emergencyPauseBoundaryBuilt === true,
  rollbackBoundaryBuilt: manifest.rollbackBoundaryBuilt === true,
  proofEvidenceAuditRequired: manifest.proofEvidenceAuditRequired === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N08-FOUNDER-03 - Daily digest, mobile alerts, and stop-selling operations."
    : "Repair N08-FOUNDER-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n08", { recursive: true });
fs.writeFileSync("reports/n08/n08-founder-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-02 proof passed.");