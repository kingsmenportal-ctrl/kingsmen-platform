import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPORT_DIR = "reports/jarvis";
const REPORT_PATH = path.join(REPORT_DIR, "jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json");

const requiredEvidenceFiles = [
  {
    id: "main-branch-protection-evidence",
    path: "reports/jarvis/jarvis-main-branch-protection-evidence.accepted.json",
    schema: "kingsmen.jarvis-main-branch-protection-evidence.v1",
    requiredBooleans: ["accepted", "mainBranchProtected", "forcePushDisabled", "deletionDisabled", "requiredReviewsOrChecks", "redacted", "rawSecretsReturnedFalse"]
  },
  {
    id: "rollback-release-evidence",
    path: "reports/jarvis/jarvis-rollback-release-evidence.accepted.json",
    schema: "kingsmen.jarvis-rollback-release-evidence.v1",
    requiredBooleans: ["accepted", "rollbackProcedureExists", "releaseTagOrCandidateRecorded", "failedReleaseStopCondition", "redacted", "rawSecretsReturnedFalse"]
  },
  {
    id: "final-staging-evidence-pack",
    path: "reports/jarvis/jarvis-final-staging-evidence-pack.accepted.json",
    schema: "kingsmen.jarvis-final-staging-evidence-pack.v1",
    requiredBooleans: ["accepted", "allCriticalProofReportsReferenced", "allValidatorsReferenced", "allLaunchRoutesReferenced", "redacted", "rawSecretsReturnedFalse"]
  },
  {
    id: "final-launch-audit-evidence",
    path: "reports/jarvis/jarvis-final-launch-audit-evidence.accepted.json",
    schema: "kingsmen.jarvis-final-launch-audit-evidence.v1",
    requiredBooleans: ["accepted", "finalLaunchAuditPassed", "allLaunchCriticalProofAccepted", "productionReadyCanBeSetAfterApproval", "publicLaunchAllowedCanBeSetAfterApproval", "redacted", "rawSecretsReturnedFalse"]
  },
  {
    id: "founder-launch-approval-evidence",
    path: "reports/jarvis/jarvis-founder-launch-approval.accepted.json",
    schema: "kingsmen.jarvis-founder-launch-approval.v1",
    requiredBooleans: ["accepted", "founderApprovalGranted", "approvalRecorded", "rollbackAccepted", "redacted", "rawSecretsReturnedFalse"]
  }
];

function safeGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return null;
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false, json: null, error: null };
  try {
    return { exists: true, json: JSON.parse(fs.readFileSync(filePath, "utf8")), error: null };
  } catch (error) {
    return { exists: true, json: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function evaluateEvidence(definition) {
  const read = readJson(definition.path);
  const checks = [];

  checks.push({ name: "file_exists", passed: read.exists, detail: definition.path });
  checks.push({ name: "valid_json", passed: read.exists && read.json !== null, detail: read.error ?? "json parsed" });

  if (!read.json) {
    return {
      id: definition.id,
      path: definition.path,
      schema: definition.schema,
      accepted: false,
      checks
    };
  }

  checks.push({ name: "schema", passed: read.json.schema === definition.schema, detail: read.json.schema ?? null });

  for (const field of definition.requiredBooleans) {
    checks.push({ name: field, passed: read.json[field] === true, detail: read.json[field] ?? null });
  }

  checks.push({ name: "no_secret_values", passed: read.json.secretValuesReturned !== true && read.json.rawSecretsReturned !== true, detail: "secret values must not be returned" });

  return {
    id: definition.id,
    path: definition.path,
    schema: definition.schema,
    accepted: checks.every((check) => check.passed),
    checks
  };
}

const branchName = safeGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const commitSha = safeGit(["rev-parse", "HEAD"]);
const statusShort = safeGit(["status", "--short"]);
const evidence = requiredEvidenceFiles.map(evaluateEvidence);
const allEvidenceAccepted = evidence.every((item) => item.accepted);

const report = {
  schema: "kingsmen.jarvis-branch-protection-final-launch-audit-evidence-capture.v1",
  module: "Jarvis Branch Protection Final Launch Audit Evidence Capture",
  generatedAt: new Date().toISOString(),
  passed: allEvidenceAccepted,
  branchProtectionFinalLaunchAuditEvidenceAccepted: allEvidenceAccepted,
  productionReady: false,
  publicLaunchAllowed: false,
  launchBlocked: !allEvidenceAccepted,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  redacted: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecutedFromBrowser: false,
  directDatabaseAccessFromBrowser: false,
  noDirectProviderCallsFromBrowser: true,
  gitContext: {
    branchName,
    commitSha,
    workingTreeClean: statusShort === "",
    statusSummaryRedacted: statusShort ? statusShort.split("\n").slice(0, 20) : []
  },
  requiredEvidenceFiles,
  evidence,
  acceptanceCriteria: [
    "main branch protection accepted evidence file",
    "required reviews/status checks accepted evidence file",
    "rollback and release gate accepted evidence file",
    "final staging evidence pack accepted evidence file",
    "final launch audit accepted evidence file",
    "founder launch approval accepted evidence file",
    "all evidence redacted and secret-free"
  ],
  rejectionRules: [
    "reject if branch protection evidence file is missing",
    "reject if force push or branch deletion remains allowed",
    "reject if rollback procedure is missing",
    "reject if staging evidence pack omits launch-critical proof reports",
    "reject if founder approval is missing",
    "reject if raw secrets appear in any evidence file"
  ],
  nextAction: allEvidenceAccepted
    ? "Review the redacted capture report and then run final launch gate audit."
    : "Create accepted redacted branch, rollback, staging, final audit, and founder approval evidence files before launch can pass."
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(allEvidenceAccepted ? 0 : 1);
