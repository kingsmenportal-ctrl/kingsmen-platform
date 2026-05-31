import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-workspace-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Prepare-OracleFreeWorkspace.ps1",
  "reports/oracle/oracle-free-workspace-report.json",
  "kingsmen/oracle/oracle-free-bootstrap-plan.json",
  "reports/oracle/oracle-free-bootstrap-report.json",
  "kingsmen/oracle/workspace/oracle-workspace-config.json",
  "kingsmen/oracle/checklists/founder-oracle-free-checklist.json",
  "kingsmen/oracle/cost-guard/oracle-cost-guard.json",
  "kingsmen/oracle/security/oracle-security-checklist.json",
  "docs/oracle/README.md",
  "reports/openclaw/openclaw-safety-report.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const requiredDirectories = [
  "kingsmen/oracle",
  "kingsmen/oracle/workspace",
  "kingsmen/oracle/masked-reports",
  "kingsmen/oracle/checklists",
  "kingsmen/oracle/action-packets",
  "kingsmen/oracle/runtime-notes",
  "kingsmen/oracle/cost-guard",
  "kingsmen/oracle/security",
  "docs/oracle",
  "reports/oracle",
  "scripts/oracle"
];

function abs(filePath) {
  return path.join(root, filePath);
}

function existsFile(filePath) {
  return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isFile();
}

function existsDir(filePath) {
  return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isDirectory();
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

function addCheck(checks, name, passed, detail, file = "") {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file });
}

function checkPresence(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  }
  for (const dir of requiredDirectories) {
    addCheck(checks, `directory:${dir}`, existsDir(dir), existsDir(dir) ? "found" : "missing", dir);
  }
}

function checkForbiddenText(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
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

function checkWorkspaceConfig(checks) {
  const file = "kingsmen/oracle/workspace/oracle-workspace-config.json";
  const config = parseJsonFile(checks, file, "workspace-config");
  if (!config) return null;
  addCheck(checks, "workspace-config:module", config.module === "ORACLE", String(config.module), file);
  addCheck(checks, "workspace-config:submodule", config.submodule === "ORACLE.3", String(config.submodule), file);
  addCheck(checks, "workspace-config:productionReadyFalse", config.productionReady === false, String(config.productionReady), file);
  addCheck(checks, "workspace-config:oracleLiteFirst", config.oracleLiteFirst === true, String(config.oracleLiteFirst), file);
  addCheck(checks, "workspace-config:dockerComposeFirst", config.dockerComposeFirst === true, String(config.dockerComposeFirst), file);
  addCheck(checks, "workspace-config:noCloudResourcesCreated", config.noCloudResourcesCreated === true, String(config.noCloudResourcesCreated), file);
  addCheck(checks, "workspace-config:noCredentialsStored", config.noCredentialsStored === true, String(config.noCredentialsStored), file);
  addCheck(checks, "workspace-config:noPaidResourcesDefault", config.noPaidResourcesAllowedByDefault === true, String(config.noPaidResourcesAllowedByDefault), file);
  addCheck(checks, "workspace-config:founderApprovalPaid", config.founderApprovalRequiredForPaidResources === true, String(config.founderApprovalRequiredForPaidResources), file);
  addCheck(checks, "workspace-config:candidateSafetyWins", config.candidateSafetyWins === true, String(config.candidateSafetyWins), file);
  addCheck(checks, "workspace-config:openClawPauses", config.openClawPausesIfCompeting === true, String(config.openClawPausesIfCompeting), file);
  addCheck(checks, "workspace-config:nextTrackerRow", config.nextTrackerRow === "ORACLE.4 - scripts/validators/validate-oracle-workspace.mjs", String(config.nextTrackerRow ?? ""), file);
  return config;
}

function checkFounderChecklist(checks) {
  const file = "kingsmen/oracle/checklists/founder-oracle-free-checklist.json";
  const checklist = parseJsonFile(checks, file, "founder-checklist");
  if (!checklist) return null;
  addCheck(checks, "founder-checklist:productionReadyFalse", checklist.productionReady === false, String(checklist.productionReady), file);
  addCheck(checks, "founder-checklist:officialUrl", typeof checklist.officialUrl === "string" && checklist.officialUrl.includes("oracle.com/cloud/free"), String(checklist.officialUrl ?? ""), file);
  addCheck(checks, "founder-checklist:rules", Array.isArray(checklist.rules) && checklist.rules.length >= 7, String(checklist.rules?.length ?? 0), file);
  addCheck(checks, "founder-checklist:evidence", Array.isArray(checklist.evidenceToCaptureMasked) && checklist.evidenceToCaptureMasked.length >= 8, String(checklist.evidenceToCaptureMasked?.length ?? 0), file);
  return checklist;
}

function checkCostGuard(checks) {
  const file = "kingsmen/oracle/cost-guard/oracle-cost-guard.json";
  const guard = parseJsonFile(checks, file, "cost-guard");
  if (!guard) return null;
  addCheck(checks, "cost-guard:productionReadyFalse", guard.productionReady === false, String(guard.productionReady), file);
  addCheck(checks, "cost-guard:paidDefaultFalse", guard.paidResourcesDefault === false, String(guard.paidResourcesDefault), file);
  addCheck(checks, "cost-guard:stopZero", Number(guard.stopIfEstimatedMonthlyCostAboveZar) === 0, String(guard.stopIfEstimatedMonthlyCostAboveZar), file);
  addCheck(checks, "cost-guard:founderApproval", guard.founderApprovalRequiredForAnyPaidChange === true, String(guard.founderApprovalRequiredForAnyPaidChange), file);
  addCheck(checks, "cost-guard:allowedNow", Array.isArray(guard.allowedNow) && guard.allowedNow.length >= 4, String(guard.allowedNow?.length ?? 0), file);
  addCheck(checks, "cost-guard:blockedNow", Array.isArray(guard.blockedNow) && guard.blockedNow.length >= 5, String(guard.blockedNow?.length ?? 0), file);
  return guard;
}

function checkSecurityChecklist(checks) {
  const file = "kingsmen/oracle/security/oracle-security-checklist.json";
  const security = parseJsonFile(checks, file, "security-checklist");
  if (!security) return null;
  addCheck(checks, "security-checklist:productionReadyFalse", security.productionReady === false, String(security.productionReady), file);
  addCheck(checks, "security-checklist:required", Array.isArray(security.required) && security.required.length >= 8, String(security.required?.length ?? 0), file);
  const requiredText = Array.isArray(security.required) ? security.required.join("\n") : "";
  addCheck(checks, "security-checklist:founder-mfa", requiredText.includes("Founder MFA"), requiredText.includes("Founder MFA") ? "present" : "missing", file);
  addCheck(checks, "security-checklist:no-sensitive-values", requiredText.includes("No sensitive values in Git"), requiredText.includes("No sensitive values in Git") ? "present" : "missing", file);
  addCheck(checks, "security-checklist:private-postgres", requiredText.includes("PostgreSQL private"), requiredText.includes("PostgreSQL private") ? "present" : "missing", file);
  addCheck(checks, "security-checklist:private-redis", requiredText.includes("Redis private"), requiredText.includes("Redis private") ? "present" : "missing", file);
  addCheck(checks, "security-checklist:futureReports", Array.isArray(security.futureReports) && security.futureReports.length >= 3, String(security.futureReports?.length ?? 0), file);
  return security;
}

function checkReadme(checks) {
  const file = "docs/oracle/README.md";
  if (!existsFile(file)) return;
  const content = read(file);
  addCheck(checks, "readme:oracle-free", content.includes("Oracle Cloud Free Tier"), "Oracle Cloud Free Tier", file);
  addCheck(checks, "readme:no-credentials", content.includes("does not store credentials"), "credential boundary", file);
  addCheck(checks, "readme:no-paid", content.includes("No paid resource"), "cost boundary", file);
  addCheck(checks, "readme:no-production", content.includes("No production candidate traffic yet"), "production boundary", file);
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
  checkReport(checks, "reports/oracle/oracle-free-workspace-report.json", "workspace-report", "ORACLE", "ORACLE.3");
  checkReport(checks, "reports/oracle/oracle-free-bootstrap-report.json", "bootstrap-report", "ORACLE", "ORACLE.2");
  checkReport(checks, "reports/openclaw/openclaw-safety-report.json", "openclaw-report", "OPENCLAW", "OPENCLAW.3");
  checkWorkspaceConfig(checks);
  checkFounderChecklist(checks);
  checkCostGuard(checks);
  checkSecurityChecklist(checks);
  checkReadme(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.4",
    validator: "validate-oracle-workspace.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "ORACLE.5 - scripts/oracle/Test-OracleFreePrerequisites.ps1"
      : "ORACLE.4 repair - fix failed checks in reports/oracle/oracle-workspace-validation-report.json"
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
    submodule: "ORACLE.4",
    validator: "validate-oracle-workspace.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    failed: [
      {
        name: "validator:unhandled-error",
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        file: "scripts/validators/validate-oracle-workspace.mjs"
      }
    ],
    nextTrackerRow: "ORACLE.4 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
