import fs from "node:fs";

const requiredFiles = [
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
  "reports/n08/n08-founder-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n08/n08-founder-02-approval-workflows-command-execution-audit-trail.json")
  ? JSON.parse(fs.readFileSync("manifests/n08/n08-founder-02-approval-workflows-command-execution-audit-trail.json", "utf8"))
  : {};

for (const key of [
  "requiresN08Founder01",
  "approvalWorkflowBuilt",
  "commandExecutionContractBuilt",
  "commandAuditTrailBuilt",
  "highRiskCommandsRequireFounderApproval",
  "commandCannotBypassSafetyGates",
  "emergencyPauseBoundaryBuilt",
  "rollbackBoundaryBuilt",
  "proofEvidenceAuditRequired"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const commandPolicy = fs.existsSync("packages/backend/src/n08/command-execution-policy.ts")
  ? fs.readFileSync("packages/backend/src/n08/command-execution-policy.ts", "utf8")
  : "";

for (const phrase of ["stop_selling", "source_freeze", "mark_paid", "partner_share_identity", "candidate-harm gate failed"]) {
  if (!commandPolicy.includes(phrase)) failures.push(`Command policy missing ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/founder/control-plane/commands/page.tsx")
  ? fs.readFileSync("apps/web/src/app/founder/control-plane/commands/page.tsx", "utf8")
  : "";

for (const phrase of ["Approval workflow", "Safety gates", "Audit trail", "High-risk commands require founder approval"]) {
  if (!page.includes(phrase)) failures.push(`Founder commands page missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n08-founder-02-validation.v1",
  module: "N08-FOUNDER-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n08-founder-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-02 validation passed.");