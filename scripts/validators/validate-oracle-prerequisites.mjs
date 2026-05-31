import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-prerequisites-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Test-OracleFreePrerequisites.ps1",
  "reports/oracle/oracle-free-prerequisites-report.json",
  "reports/oracle/oracle-free-bootstrap-report.json",
  "reports/oracle/oracle-free-workspace-report.json",
  "reports/oracle/oracle-workspace-validation-report.json",
  "reports/openclaw/openclaw-safety-report.json",
  "kingsmen/oracle/oracle-free-bootstrap-plan.json",
  "kingsmen/oracle/workspace/oracle-workspace-config.json",
  "kingsmen/oracle/checklists/founder-oracle-free-checklist.json",
  "kingsmen/oracle/cost-guard/oracle-cost-guard.json",
  "kingsmen/oracle/security/oracle-security-checklist.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const expectedReports = [
  ["reports/oracle/oracle-free-prerequisites-report.json", "prerequisites", "ORACLE", "ORACLE.5"],
  ["reports/oracle/oracle-free-bootstrap-report.json", "bootstrap", "ORACLE", "ORACLE.2"],
  ["reports/oracle/oracle-free-workspace-report.json", "workspace", "ORACLE", "ORACLE.3"],
  ["reports/oracle/oracle-workspace-validation-report.json", "workspace-validation", "ORACLE", "ORACLE.4"],
  ["reports/openclaw/openclaw-safety-report.json", "openclaw-safety", "OPENCLAW", "OPENCLAW.3"]
];

const requiredEnvTokens = [
  "KINGSMEN_PRODUCTION_READY=false",
  "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
  "KINGSMEN_ORACLE_LITE_MODE=true",
  "KINGSMEN_LOW_CONCURRENCY_MODE=true",
  "KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
  "KINGSMEN_READY_CAP_TARGET=1000",
  "KINGSMEN_PREPARE_CAP_TARGET=5000",
  "PLAYWRIGHT_MAX_CONCURRENCY=1",
  "EMAIL_PROVIDER=no_send",
  "PAYMENT_PROVIDER=manual_eft_proof"
];

const forbiddenEnvTokens = [
  "KINGSMEN_PRODUCTION_READY=true",
  "SECRETS_IN_GIT_ALLOWED=true",
  "SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=true",
  "PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED=true",
  "PLAYWRIGHT_OTP_BYPASS_ALLOWED=true",
  "KINGSMEN_BULK_WHATSAPP_ALLOWED=true",
  "KINGSMEN_BULK_SMS_ALLOWED=true"
];

const requiredLiveCheckNames = [
  "report:oracle-bootstrap:passed",
  "report:oracle-workspace:passed",
  "report:oracle-workspace-validation:passed",
  "report:openclaw-safety:passed",
  "env-template:KINGSMEN_PRODUCTION_READY=false",
  "env-template:KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
  "env-template:KINGSMEN_ORACLE_LITE_MODE=true",
  "env-template:KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
  "command:git",
  "command:node",
  "powershell:version-5-1-plus",
  "oracle:cloud-resources-created",
  "oracle:credentials-stored",
  "oracle:production-deployed",
  "oracle:paid-resource-change"
];

const requiredProofSummaryBooleans = [
  "oraclePrerequisitesPassed",
  "oracleBootstrapReportPassed",
  "oracleWorkspaceReportPassed",
  "oracleWorkspaceValidationReportPassed",
  "openClawSafetyReportPassed",
  "envTemplateOracleLiteDefaultsPassed",
  "gitAvailable",
  "nodeAvailable",
  "noCloudResourcesCreated",
  "noCredentialsStored",
  "noProductionDeployed",
  "noPaidResourceChange"
];

function abs(filePath) {
  return path.join(root, filePath);
}

function existsFile(filePath) {
  return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isFile();
}

function read(filePath) {
  return fs.readFileSync(abs(filePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function addCheck(checks, name, passed, detail, file = "", severity = "hard") {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file, severity });
}

function checkPresence(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  }
}

function checkForbiddenText(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
    { name: "hardcodedSecretValue", pattern: /(password|token|api_key|secret)\s*[:=]\s*["'][^"'\s]{8,}["']/i },
    { name: "todoMarker", pattern: /\bTODO\b/i },
    { name: "fixmeMarker", pattern: /\bFIXME\b/i }
  ];

  for (const file of requiredFiles.filter(existsFile)) {
    const content = read(file);
    for (const rule of forbidden) {
      const ok = !rule.pattern.test(content);
      addCheck(checks, `forbidden:${file}:${rule.name}`, ok, ok ? "not found" : "forbidden text found", file);
    }
  }
}

function parseJsonFile(checks, file, label) {
  if (!existsFile(file)) return null;
  try {
    const json = readJson(file);
    addCheck(checks, `${label}:json`, true, "parsed", file);
    return json;
  } catch (error) {
    addCheck(checks, `${label}:json`, false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }
}

function checkReport(checks, file, label, expectedModule, expectedSubmodule) {
  const report = parseJsonFile(checks, file, label);
  if (!report) return null;
  addCheck(checks, `${label}:module`, report.module === expectedModule, String(report.module), file);
  addCheck(checks, `${label}:submodule`, report.submodule === expectedSubmodule, String(report.submodule), file);
  addCheck(checks, `${label}:passed`, report.passed === true, String(report.passed), file);
  addCheck(checks, `${label}:failedChecksZero`, Number(report.failedChecks) === 0, String(report.failedChecks), file);
  addCheck(checks, `${label}:productionReadyFalse`, report.productionReady === false, String(report.productionReady), file);
  return report;
}

function checkPrerequisitesReport(checks) {
  const file = "reports/oracle/oracle-free-prerequisites-report.json";
  const report = checkReport(checks, file, "prerequisites-report", "ORACLE", "ORACLE.5");
  if (!report) return null;

  addCheck(checks, "prerequisites-report:script", report.script === "scripts/oracle/Test-OracleFreePrerequisites.ps1", String(report.script ?? ""), file);
  addCheck(checks, "prerequisites-report:totalChecks", Number(report.totalChecks) >= 50, String(report.totalChecks), file);
  addCheck(checks, "prerequisites-report:warningsAllowed", Number(report.warningChecks) >= 0, String(report.warningChecks ?? 0), file);
  addCheck(checks, "prerequisites-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.6 - scripts/validators/validate-oracle-prerequisites.mjs", String(report.nextTrackerRow ?? ""), file);

  const warnings = Array.isArray(report.warnings) ? report.warnings : [];
  for (const warning of warnings) {
    addCheck(checks, `prerequisites-report:warning-not-hard:${warning.name}`, warning.severity === "warning", String(warning.severity), file);
  }

  const checksArray = Array.isArray(report.checks) ? report.checks : [];
  const proofSummary = report.proofSummary && typeof report.proofSummary === "object" ? report.proofSummary : null;
  addCheck(checks, "prerequisites-report:has-checks-or-proofSummary", checksArray.length > 0 || proofSummary !== null, checksArray.length > 0 ? "checks array present" : proofSummary ? "proofSummary present" : "missing", file);

  if (checksArray.length > 0) {
    const passedCheckNames = new Set(checksArray.filter((check) => check.passed === true).map((check) => check.name));
    for (const name of requiredLiveCheckNames) {
      addCheck(checks, `prerequisites-report:contains-passed-check:${name}`, passedCheckNames.has(name), passedCheckNames.has(name) ? "present" : "missing", file);
    }
  }

  if (proofSummary) {
    for (const key of requiredProofSummaryBooleans) {
      addCheck(checks, `prerequisites-report:proofSummary:${key}`, proofSummary[key] === true, String(proofSummary[key]), file);
    }
    addCheck(checks, "prerequisites-report:proofSummary:gitHeadHash", typeof proofSummary.gitHeadHash === "string" && proofSummary.gitHeadHash.length >= 7, String(proofSummary.gitHeadHash ?? ""), file);
  }

  const warningNames = warnings.map((warning) => warning.name);
  addCheck(checks, "prerequisites-report:docker-warning-allowed", warningNames.includes("command:docker") || warningNames.length >= 0, warningNames.join(","), file, "warning");
  addCheck(checks, "prerequisites-report:oci-warning-allowed", warningNames.includes("command:oci") || warningNames.length >= 0, warningNames.join(","), file, "warning");
  return report;
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const token of requiredEnvTokens) {
    addCheck(checks, `env:required:${token}`, content.includes(token), content.includes(token) ? "present" : "missing", file);
  }
  for (const token of forbiddenEnvTokens) {
    addCheck(checks, `env:forbidden:${token}`, !content.includes(token), content.includes(token) ? "forbidden value present" : "not present", file);
  }
}

function checkOracleWorkspaceConfig(checks) {
  const file = "kingsmen/oracle/workspace/oracle-workspace-config.json";
  const config = parseJsonFile(checks, file, "oracle-workspace-config");
  if (!config) return;
  addCheck(checks, "oracle-workspace-config:productionReadyFalse", config.productionReady === false, String(config.productionReady), file);
  addCheck(checks, "oracle-workspace-config:noCloudResourcesCreated", config.noCloudResourcesCreated === true, String(config.noCloudResourcesCreated), file);
  addCheck(checks, "oracle-workspace-config:noCredentialsStored", config.noCredentialsStored === true, String(config.noCredentialsStored), file);
  addCheck(checks, "oracle-workspace-config:noPaidResourcesDefault", config.noPaidResourcesAllowedByDefault === true, String(config.noPaidResourcesAllowedByDefault), file);
  addCheck(checks, "oracle-workspace-config:candidateSafetyWins", config.candidateSafetyWins === true, String(config.candidateSafetyWins), file);
  addCheck(checks, "oracle-workspace-config:nextTrackerRow", config.nextTrackerRow === "ORACLE.4 - scripts/validators/validate-oracle-workspace.mjs", String(config.nextTrackerRow ?? ""), file);
}

function checkOracleCostGuard(checks) {
  const file = "kingsmen/oracle/cost-guard/oracle-cost-guard.json";
  const guard = parseJsonFile(checks, file, "oracle-cost-guard");
  if (!guard) return;
  addCheck(checks, "oracle-cost-guard:productionReadyFalse", guard.productionReady === false, String(guard.productionReady), file);
  addCheck(checks, "oracle-cost-guard:paidDefaultFalse", guard.paidResourcesDefault === false, String(guard.paidResourcesDefault), file);
  addCheck(checks, "oracle-cost-guard:stopZero", Number(guard.stopIfEstimatedMonthlyCostAboveZar) === 0, String(guard.stopIfEstimatedMonthlyCostAboveZar), file);
  addCheck(checks, "oracle-cost-guard:founderApproval", guard.founderApprovalRequiredForAnyPaidChange === true, String(guard.founderApprovalRequiredForAnyPaidChange), file);
}

function checkProviderRegistry(checks) {
  const file = "config/providers/provider-registry.json";
  const registry = parseJsonFile(checks, file, "provider-registry");
  if (!registry) return;
  addCheck(checks, "provider-registry:productionReadyFalse", registry.productionReady === false, String(registry.productionReady), file);
  addCheck(checks, "provider-registry:oracleLiteFirst", registry.doctrine?.oracleLiteFirst === true, String(registry.doctrine?.oracleLiteFirst), file);
  addCheck(checks, "provider-registry:noHardcodedSecrets", registry.doctrine?.noHardcodedSecrets === true, String(registry.doctrine?.noHardcodedSecrets), file);
}

function buildChecksums() {
  return requiredFiles.filter(existsFile).map((file) => {
    const content = read(file);
    return { path: file, sha256: sha256(content), bytes: Buffer.byteLength(content, "utf8") };
  });
}

function main() {
  const checks = [];
  checkPresence(checks);
  checkForbiddenText(checks);
  for (const [file, label, module, submodule] of expectedReports) {
    checkReport(checks, file, label, module, submodule);
  }
  checkPrerequisitesReport(checks);
  checkEnvTemplate(checks);
  checkOracleWorkspaceConfig(checks);
  checkOracleCostGuard(checks);
  checkProviderRegistry(checks);

  const failed = checks.filter((check) => !check.passed && check.severity !== "warning");
  const warnings = checks.filter((check) => !check.passed && check.severity === "warning");
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.6",
    validator: "validate-oracle-prerequisites.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    warningChecks: warnings.length,
    checksums: buildChecksums(),
    failed,
    warnings,
    checks,
    nextTrackerRow: failed.length === 0
      ? "ORACLE.7 - scripts/oracle/Write-OracleFounderActionPacket.ps1"
      : "ORACLE.6 repair - fix hard failures in reports/oracle/oracle-prerequisites-validation-report.json"
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

try {
  main();
} catch (error) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.6",
    validator: "validate-oracle-prerequisites.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    warningChecks: 0,
    failed: [
      {
        name: "validator:unhandled-error",
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        file: "scripts/validators/validate-oracle-prerequisites.mjs",
        severity: "hard"
      }
    ],
    nextTrackerRow: "ORACLE.6 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
