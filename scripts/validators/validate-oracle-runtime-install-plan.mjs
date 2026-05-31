import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-runtime-install-plan-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1",
  "reports/oracle/oracle-runtime-install-plan-report.json",
  "kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json",
  "docs/oracle/oracle-runtime-install-plan.md",
  "reports/oracle/oracle-first-login-checklist-validation-report.json",
  "reports/oracle/oracle-first-login-checklist-report.json",
  "kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json",
  "docs/oracle/oracle-first-login-checklist.md",
  "kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const requiredDirs = [
  "kingsmen/oracle/vm-bootstrap/runtime",
  "kingsmen/oracle/vm-bootstrap/runtime/install",
  "kingsmen/oracle/vm-bootstrap/runtime/health",
  "kingsmen/oracle/vm-bootstrap/runtime/logs",
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

function checkRuntimeReport(checks) {
  const file = "reports/oracle/oracle-runtime-install-plan-report.json";
  const report = checkReport(checks, file, "oracle15-report", "ORACLE.15");
  if (!report) return;
  addCheck(checks, "oracle15-report:script", report.script === "scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1", String(report.script ?? ""), file);
  addCheck(checks, "oracle15-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.16 - scripts/validators/validate-oracle-runtime-install-plan.mjs", String(report.nextTrackerRow ?? ""), file);
  const created = new Set((Array.isArray(report.created) ? report.created : []).map((item) => item.path));
  for (const item of ["kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json", "docs/oracle/oracle-runtime-install-plan.md"]) {
    addCheck(checks, `oracle15-report:created:${item}`, created.has(item), created.has(item) ? "present" : "missing", file);
  }
  const summary = report.proofSummary && typeof report.proofSummary === "object" ? report.proofSummary : null;
  if (summary) {
    for (const key of ["oracleRuntimeInstallPlanPassed", "oracleFirstLoginValidationPassed", "oracleFirstLoginChecklistPassed", "runtimeInstallPlanJsonWritten", "runtimeInstallPlanMarkdownWritten", "productionReadyFalseVerified", "noFailedChecks"]) {
      addCheck(checks, `oracle15-report:proofSummary:${key}`, summary[key] === true, String(summary[key]), file);
    }
  }
}

function checkRuntimePlan(checks) {
  const file = "kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json";
  const plan = parseJson(checks, file, "runtime-plan");
  if (!plan) return;
  addCheck(checks, "runtime-plan:module", plan.module === "ORACLE", String(plan.module), file);
  addCheck(checks, "runtime-plan:submodule", plan.submodule === "ORACLE.15", String(plan.submodule), file);
  addCheck(checks, "runtime-plan:status", plan.status === "prepared_pending_validation", String(plan.status), file);
  addCheck(checks, "runtime-plan:productionReadyFalse", plan.productionReady === false, String(plan.productionReady), file);
  addCheck(checks, "runtime-plan:purpose", typeof plan.purpose === "string" && plan.purpose.length > 60, String(plan.purpose ?? ""), file);

  const proof = plan.proofInput ?? {};
  addCheck(checks, "runtime-plan:proof:oracleFirstLoginValidationPassed", proof.oracleFirstLoginValidationPassed === true, String(proof.oracleFirstLoginValidationPassed), file);
  addCheck(checks, "runtime-plan:proof:oracleFirstLoginChecklistPassed", proof.oracleFirstLoginChecklistPassed === true, String(proof.oracleFirstLoginChecklistPassed), file);
  addCheck(checks, "runtime-plan:proof:gitHeadHash", typeof proof.gitHeadHash === "string" && proof.gitHeadHash.length >= 7, String(proof.gitHeadHash ?? ""), file);

  addCheck(checks, "runtime-plan:installPhases", Array.isArray(plan.installPhases) && plan.installPhases.length >= 6, String(plan.installPhases?.length ?? 0), file);
  const defaults = plan.runtimeDefaults ?? {};
  addCheck(checks, "runtime-plan:deployTarget", defaults.deployTarget === "oracle_lite", String(defaults.deployTarget), file);
  addCheck(checks, "runtime-plan:activeCandidateCap", Number(defaults.activeCandidateCap) === 500, String(defaults.activeCandidateCap), file);
  addCheck(checks, "runtime-plan:lowConcurrencyMode", defaults.lowConcurrencyMode === true, String(defaults.lowConcurrencyMode), file);
  addCheck(checks, "runtime-plan:workerConcurrency", Number(defaults.workerConcurrency) === 2, String(defaults.workerConcurrency), file);
  addCheck(checks, "runtime-plan:playwrightMaxConcurrency", Number(defaults.playwrightMaxConcurrency) === 1, String(defaults.playwrightMaxConcurrency), file);
  addCheck(checks, "runtime-plan:airtableMirrorInterval", Number(defaults.airtableMirrorIntervalMinutes) >= 15, String(defaults.airtableMirrorIntervalMinutes), file);
  addCheck(checks, "runtime-plan:openClawPauses", defaults.openClawPausesIfCompeting === true, String(defaults.openClawPausesIfCompeting), file);
  addCheck(checks, "runtime-plan:postgresPublicFalse", defaults.postgresPublic === false, String(defaults.postgresPublic), file);
  addCheck(checks, "runtime-plan:redisPublicFalse", defaults.redisPublic === false, String(defaults.redisPublic), file);
  addCheck(checks, "runtime-plan:dockerComposeFirst", defaults.dockerComposeFirst === true, String(defaults.dockerComposeFirst), file);

  addCheck(checks, "runtime-plan:serviceOrder", Array.isArray(plan.serviceOrder) && plan.serviceOrder.includes("postgresql-private") && plan.serviceOrder.includes("redis-private"), JSON.stringify(plan.serviceOrder ?? []), file);
  addCheck(checks, "runtime-plan:healthChecks", Array.isArray(plan.healthChecksPlanned) && plan.healthChecksPlanned.length >= 8, String(plan.healthChecksPlanned?.length ?? 0), file);
  addCheck(checks, "runtime-plan:blockedUntilLaterGates", Array.isArray(plan.blockedUntilLaterGates) && plan.blockedUntilLaterGates.length >= 6, String(plan.blockedUntilLaterGates?.length ?? 0), file);

  const safety = plan.safetyBoundaries ?? {};
  for (const key of ["noServerConnectionByThisScript", "noRuntimeInstallByThisScript", "noCloudResourcesCreatedByThisScript", "noCredentialMaterialStoredByThisScript", "noProductionDeployByThisScript", "noPaidResourceChangeByThisScript", "postgresRedisPrivate", "candidateSafetyWins"]) {
    addCheck(checks, `runtime-plan:safety:${key}`, safety[key] === true, String(safety[key]), file);
  }
  addCheck(checks, "runtime-plan:safety:productionReadyFalse", safety.productionReady === false, String(safety.productionReady), file);
  addCheck(checks, "runtime-plan:nextTrackerRow", plan.nextTrackerRow === "ORACLE.16 - scripts/validators/validate-oracle-runtime-install-plan.mjs", String(plan.nextTrackerRow ?? ""), file);
}

function checkMarkdown(checks) {
  const file = "docs/oracle/oracle-runtime-install-plan.md";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const phrase of ["Kingsmen Oracle Lite Runtime Install Plan", "Production ready: false", "planning artifact only", "Active candidate cap: 500", "PostgreSQL and Redis remain private", "Docker Compose first", "productionReady remains false"]) {
    addCheck(checks, `runtime-md:${phrase}`, content.includes(phrase), content.includes(phrase) ? "present" : "missing", file);
  }
}

function checkEnv(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const token of ["KINGSMEN_PRODUCTION_READY=false", "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite", "KINGSMEN_ORACLE_LITE_MODE=true", "KINGSMEN_ACTIVE_CANDIDATE_CAP=500", "KINGSMEN_LOW_CONCURRENCY_MODE=true", "PLAYWRIGHT_MAX_CONCURRENCY=1"]) {
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
  checkReport(checks, "reports/oracle/oracle-first-login-checklist-validation-report.json", "oracle14-report", "ORACLE.14");
  checkReport(checks, "reports/oracle/oracle-first-login-checklist-report.json", "oracle13-report", "ORACLE.13");
  checkRuntimeReport(checks);
  checkRuntimePlan(checks);
  checkMarkdown(checks);
  checkEnv(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.16",
    validator: "validate-oracle-runtime-install-plan.mjs",
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
    nextTrackerRow: failed.length === 0 ? "ORACLE.17 - scripts/oracle/Prepare-OracleFirewallPlan.ps1" : "ORACLE.16 repair - fix hard failures in reports/oracle/oracle-runtime-install-plan-validation-report.json"
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
    submodule: "ORACLE.16",
    validator: "validate-oracle-runtime-install-plan.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    warningChecks: 0,
    failed: [{ name: "validator:unhandled-error", passed: false, detail: error instanceof Error ? error.message : String(error), file: "scripts/validators/validate-oracle-runtime-install-plan.mjs" }],
    nextTrackerRow: "ORACLE.16 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
