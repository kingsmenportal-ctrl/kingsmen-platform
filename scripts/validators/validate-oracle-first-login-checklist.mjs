import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-first-login-checklist-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1",
  "reports/oracle/oracle-first-login-checklist-report.json",
  "kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json",
  "docs/oracle/oracle-first-login-checklist.md",
  "reports/oracle/oracle-access-guide-validation-report.json",
  "reports/oracle/oracle-ssh-bootstrap-guide-report.json",
  "reports/oracle/oracle-vm-bootstrap-plan-validation-report.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const requiredDirs = [
  "kingsmen/oracle/vm-bootstrap/first-login",
  "kingsmen/oracle/vm-bootstrap/runtime",
  "kingsmen/oracle/vm-bootstrap/network",
  "kingsmen/oracle/vm-bootstrap/security",
  "docs/oracle",
  "reports/oracle"
];

function abs(filePath) { return path.join(root, filePath); }
function existsFile(filePath) { return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isFile(); }
function existsDir(filePath) { return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isDirectory(); }
function read(filePath) { return fs.readFileSync(abs(filePath), "utf8").replace(/^\uFEFF/, ""); }
function readJson(filePath) { return JSON.parse(read(filePath)); }
function sha256(content) { return crypto.createHash("sha256").update(content, "utf8").digest("hex"); }
function addCheck(checks, name, passed, detail, file = "") { checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file }); }

function parseJson(checks, file, label) {
  if (!existsFile(file)) return null;
  try {
    const data = readJson(file);
    addCheck(checks, `${label}:json`, true, "parsed", file);
    return data;
  } catch (error) {
    addCheck(checks, `${label}:json`, false, error instanceof Error ? error.message : String(error), file);
    return null;
  }
}

function checkReport(checks, file, label, submodule) {
  const data = parseJson(checks, file, label);
  if (!data) return null;
  addCheck(checks, `${label}:module`, data.module === "ORACLE", String(data.module), file);
  addCheck(checks, `${label}:submodule`, data.submodule === submodule, String(data.submodule), file);
  addCheck(checks, `${label}:passed`, data.passed === true, String(data.passed), file);
  addCheck(checks, `${label}:failedChecksZero`, Number(data.failedChecks) === 0, String(data.failedChecks), file);
  addCheck(checks, `${label}:productionReadyFalse`, data.productionReady === false, String(data.productionReady), file);
  return data;
}

function checkForbiddenText(checks) {
  for (const file of requiredFiles.filter(existsFile)) {
    const content = read(file);
    addCheck(checks, `safe:${file}:no-production-ready-true`, !/productionReady\s*[:=]\s*true/i.test(content) && !/"productionReady"\s*:\s*true/i.test(content), "scanned", file);
    addCheck(checks, `safe:${file}:no-todo`, !/\bTODO\b/i.test(content), "scanned", file);
    addCheck(checks, `safe:${file}:no-fixme`, !/\bFIXME\b/i.test(content), "scanned", file);
  }
}

function checkFirstLoginReport(checks) {
  const file = "reports/oracle/oracle-first-login-checklist-report.json";
  const report = checkReport(checks, file, "oracle13-report", "ORACLE.13");
  if (!report) return;
  addCheck(checks, "oracle13-report:script", report.script === "scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1", String(report.script ?? ""), file);
  addCheck(checks, "oracle13-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.14 - scripts/validators/validate-oracle-first-login-checklist.mjs", String(report.nextTrackerRow ?? ""), file);
  const created = new Set((Array.isArray(report.created) ? report.created : []).map((item) => item.path));
  for (const item of ["kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json", "docs/oracle/oracle-first-login-checklist.md"]) {
    addCheck(checks, `oracle13-report:created:${item}`, created.has(item), created.has(item) ? "present" : "missing", file);
  }
  const summary = report.proofSummary && typeof report.proofSummary === "object" ? report.proofSummary : null;
  if (summary) {
    for (const key of ["oracleFirstLoginChecklistPassed", "oracleAccessGuideValidationPassed", "oracleSshBootstrapGuidePassed", "firstLoginChecklistJsonWritten", "firstLoginChecklistMarkdownWritten", "productionReadyFalseVerified", "noFailedChecks"]) {
      addCheck(checks, `oracle13-report:proofSummary:${key}`, summary[key] === true, String(summary[key]), file);
    }
  }
}

function checkChecklistJson(checks) {
  const file = "kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json";
  const checklist = parseJson(checks, file, "first-login-checklist");
  if (!checklist) return;
  addCheck(checks, "first-login:module", checklist.module === "ORACLE", String(checklist.module), file);
  addCheck(checks, "first-login:submodule", checklist.submodule === "ORACLE.13", String(checklist.submodule), file);
  addCheck(checks, "first-login:status", checklist.status === "prepared_pending_validation", String(checklist.status), file);
  addCheck(checks, "first-login:productionReadyFalse", checklist.productionReady === false, String(checklist.productionReady), file);
  addCheck(checks, "first-login:purpose", typeof checklist.purpose === "string" && checklist.purpose.length > 50, String(checklist.purpose ?? ""), file);
  addCheck(checks, "first-login:items", Array.isArray(checklist.firstLoginChecklist) && checklist.firstLoginChecklist.length >= 6, String(checklist.firstLoginChecklist?.length ?? 0), file);
  addCheck(checks, "first-login:allowedEvidence", Array.isArray(checklist.allowedEvidence) && checklist.allowedEvidence.length >= 6, String(checklist.allowedEvidence?.length ?? 0), file);
  addCheck(checks, "first-login:blockedEvidence", Array.isArray(checklist.blockedEvidence) && checklist.blockedEvidence.length >= 6, String(checklist.blockedEvidence?.length ?? 0), file);
  const proof = checklist.proofInput ?? {};
  addCheck(checks, "first-login:proof:oracleAccessGuideValidationPassed", proof.oracleAccessGuideValidationPassed === true, String(proof.oracleAccessGuideValidationPassed), file);
  addCheck(checks, "first-login:proof:oracleSshGuideReportPassed", proof.oracleSshGuideReportPassed === true, String(proof.oracleSshGuideReportPassed), file);
  const safety = checklist.safetyBoundaries ?? {};
  for (const key of ["noCloudResourcesCreatedByThisScript", "noServerConnectionByThisScript", "noCredentialMaterialStoredByThisScript", "noProductionDeployByThisScript", "noPaidResourceChangeByThisScript", "postgresRedisPrivate", "candidateSafetyWins"]) {
    addCheck(checks, `first-login:safety:${key}`, safety[key] === true, String(safety[key]), file);
  }
  addCheck(checks, "first-login:safety:productionReadyFalse", safety.productionReady === false, String(safety.productionReady), file);
  addCheck(checks, "first-login:nextTrackerRow", checklist.nextTrackerRow === "ORACLE.14 - scripts/validators/validate-oracle-first-login-checklist.mjs", String(checklist.nextTrackerRow ?? ""), file);
}

function checkMarkdown(checks) {
  const file = "docs/oracle/oracle-first-login-checklist.md";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const phrase of ["Kingsmen Oracle First Login Checklist", "Production ready: false", "checklist only", "No secrets in Git or reports", "PostgreSQL and Redis stay private", "productionReady remains false"]) {
    addCheck(checks, `first-login-md:${phrase}`, content.includes(phrase), content.includes(phrase) ? "present" : "missing", file);
  }
}

function checkEnv(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const token of ["KINGSMEN_PRODUCTION_READY=false", "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite", "KINGSMEN_ORACLE_LITE_MODE=true", "KINGSMEN_ACTIVE_CANDIDATE_CAP=500", "KINGSMEN_LOW_CONCURRENCY_MODE=true"]) {
    addCheck(checks, `env:${token}`, content.includes(token), content.includes(token) ? "present" : "missing", file);
  }
}

function buildChecksums() {
  return requiredFiles.filter(existsFile).map((file) => {
    const content = read(file);
    return { path: file, sha256: sha256(content), bytes: Buffer.byteLength(content, "utf8") };
  });
}

function main() {
  const checks = [];
  for (const file of requiredFiles) addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  for (const dir of requiredDirs) addCheck(checks, `directory:${dir}`, existsDir(dir), existsDir(dir) ? "found" : "missing", dir);
  checkForbiddenText(checks);
  checkReport(checks, "reports/oracle/oracle-access-guide-validation-report.json", "oracle12-report", "ORACLE.12");
  checkReport(checks, "reports/oracle/oracle-ssh-bootstrap-guide-report.json", "oracle11-report", "ORACLE.11");
  checkReport(checks, "reports/oracle/oracle-vm-bootstrap-plan-validation-report.json", "oracle10-report", "ORACLE.10");
  checkFirstLoginReport(checks);
  checkChecklistJson(checks);
  checkMarkdown(checks);
  checkEnv(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.14",
    validator: "validate-oracle-first-login-checklist.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    warningChecks: 0,
    checksums: buildChecksums(),
    failed,
    warnings: [],
    checks,
    nextTrackerRow: failed.length === 0 ? "ORACLE.15 - scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1" : "ORACLE.14 repair - fix hard failures in reports/oracle/oracle-first-login-checklist-validation-report.json"
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
    submodule: "ORACLE.14",
    validator: "validate-oracle-first-login-checklist.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    warningChecks: 0,
    failed: [{ name: "validator:unhandled-error", passed: false, detail: error instanceof Error ? error.message : String(error), file: "scripts/validators/validate-oracle-first-login-checklist.mjs" }],
    nextTrackerRow: "ORACLE.14 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
