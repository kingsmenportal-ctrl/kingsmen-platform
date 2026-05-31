import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-vm-bootstrap-plan-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1",
  "reports/oracle/oracle-vm-bootstrap-plan-report.json",
  "kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json",
  "kingsmen/oracle/vm-bootstrap/checklists/oracle-vm-founder-checklist.json",
  "docs/oracle/oracle-vm-bootstrap-plan.md",
  "reports/oracle/oracle-action-packet-validation-report.json",
  "reports/oracle/oracle-founder-action-packet-report.json",
  "kingsmen/oracle/action-packets/oracle-founder-action-packet.json",
  "kingsmen/oracle/oracle-free-bootstrap-plan.json",
  "kingsmen/oracle/cost-guard/oracle-cost-guard.json",
  "kingsmen/oracle/security/oracle-security-checklist.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const requiredDirs = [
  "kingsmen/oracle/vm-bootstrap",
  "kingsmen/oracle/vm-bootstrap/checklists",
  "kingsmen/oracle/vm-bootstrap/runtime",
  "kingsmen/oracle/vm-bootstrap/network",
  "kingsmen/oracle/vm-bootstrap/security",
  "docs/oracle",
  "reports/oracle"
];

const requiredMarkdownPhrases = [
  "Kingsmen Oracle Lite VM Bootstrap Plan",
  "Production ready: false",
  "planning artifact only",
  "Keep PostgreSQL and Redis private",
  "OpenClaw pauses if it competes",
  "No paid resource change without founder approval",
  "No production candidate traffic yet",
  "No public PostgreSQL or Redis"
];

function abs(filePath) { return path.join(root, filePath); }
function existsFile(filePath) { return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isFile(); }
function existsDir(filePath) { return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isDirectory(); }
function read(filePath) { return fs.readFileSync(abs(filePath), "utf8").replace(/^\uFEFF/, ""); }
function readJson(filePath) { return JSON.parse(read(filePath)); }
function sha256(content) { return crypto.createHash("sha256").update(content, "utf8").digest("hex"); }
function addCheck(checks, name, passed, detail, file = "") { checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file }); }

function checkPresence(checks) {
  for (const file of requiredFiles) addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  for (const dir of requiredDirs) addCheck(checks, `directory:${dir}`, existsDir(dir), existsDir(dir) ? "found" : "missing", dir);
}

function checkForbiddenText(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "todoMarker", pattern: /\bTODO\b/i },
    { name: "fixmeMarker", pattern: /\bFIXME\b/i }
  ];
  for (const file of requiredFiles.filter(existsFile)) {
    const content = read(file);
    for (const rule of forbidden) addCheck(checks, `forbidden:${file}:${rule.name}`, !rule.pattern.test(content), rule.pattern.test(content) ? "forbidden text found" : "not found", file);
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

function checkVmBootstrapReport(checks) {
  const file = "reports/oracle/oracle-vm-bootstrap-plan-report.json";
  const report = checkReport(checks, file, "vm-bootstrap-report", "ORACLE", "ORACLE.9");
  if (!report) return;
  addCheck(checks, "vm-bootstrap-report:script", report.script === "scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1", String(report.script ?? ""), file);
  addCheck(checks, "vm-bootstrap-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs", String(report.nextTrackerRow ?? ""), file);
  const created = new Set((Array.isArray(report.created) ? report.created : []).map((item) => item.path));
  for (const item of ["kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json", "kingsmen/oracle/vm-bootstrap/checklists/oracle-vm-founder-checklist.json", "docs/oracle/oracle-vm-bootstrap-plan.md"]) {
    addCheck(checks, `vm-bootstrap-report:created:${item}`, created.has(item), created.has(item) ? "present" : "missing", file);
  }
  const summary = report.proofSummary && typeof report.proofSummary === "object" ? report.proofSummary : null;
  if (summary) {
    for (const key of ["oracleVmBootstrapPlanPassed", "oracleActionPacketValidationPassed", "oracleFounderActionPacketPassed", "vmBootstrapDirectoriesCreated", "vmBootstrapPlanJsonWritten", "vmFounderChecklistWritten", "vmBootstrapMarkdownWritten", "productionReadyFalseVerified", "noFailedChecks"]) {
      addCheck(checks, `vm-bootstrap-report:proofSummary:${key}`, summary[key] === true, String(summary[key]), file);
    }
  }
}

function checkVmBootstrapPlan(checks) {
  const file = "kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json";
  const plan = parseJsonFile(checks, file, "vm-plan");
  if (!plan) return;
  addCheck(checks, "vm-plan:module", plan.module === "ORACLE", String(plan.module), file);
  addCheck(checks, "vm-plan:submodule", plan.submodule === "ORACLE.9", String(plan.submodule), file);
  addCheck(checks, "vm-plan:status", plan.status === "prepared_pending_validation", String(plan.status), file);
  addCheck(checks, "vm-plan:productionReadyFalse", plan.productionReady === false, String(plan.productionReady), file);
  addCheck(checks, "vm-plan:purpose", typeof plan.purpose === "string" && plan.purpose.length > 40, String(plan.purpose ?? ""), file);

  const proof = plan.proofInput ?? {};
  addCheck(checks, "vm-plan:proofInput:oracleActionPacketValidationPassed", proof.oracleActionPacketValidationPassed === true, String(proof.oracleActionPacketValidationPassed), file);
  addCheck(checks, "vm-plan:proofInput:oracleFounderActionPacketPassed", proof.oracleFounderActionPacketPassed === true, String(proof.oracleFounderActionPacketPassed), file);
  addCheck(checks, "vm-plan:proofInput:gitHeadHash", typeof proof.gitHeadHash === "string" && proof.gitHeadHash.length >= 7, String(proof.gitHeadHash ?? ""), file);

  const intent = plan.vmIntent ?? {};
  addCheck(checks, "vm-plan:intent:deploymentTarget", intent.deploymentTarget === "oracle_lite", String(intent.deploymentTarget ?? ""), file);
  addCheck(checks, "vm-plan:intent:operatingModel", typeof intent.operatingModel === "string" && intent.operatingModel.includes("low-concurrency"), String(intent.operatingModel ?? ""), file);
  addCheck(checks, "vm-plan:intent:preferredShapeFamily", typeof intent.preferredShapeFamily === "string" && intent.preferredShapeFamily.includes("Ampere"), String(intent.preferredShapeFamily ?? ""), file);
  addCheck(checks, "vm-plan:intent:capacityDoctrine", typeof intent.capacityDoctrine === "string" && intent.capacityDoctrine.includes("500 active candidate cap"), String(intent.capacityDoctrine ?? ""), file);
  addCheck(checks, "vm-plan:intent:noAssumedCapacity", intent.noAssumedCapacity === true, String(intent.noAssumedCapacity), file);
  addCheck(checks, "vm-plan:intent:founderMustConfirmRegionCapacity", intent.founderMustConfirmRegionCapacity === true, String(intent.founderMustConfirmRegionCapacity), file);

  const network = plan.networkPlan ?? {};
  addCheck(checks, "vm-plan:network:publicIngress", Array.isArray(network.publicIngress) && network.publicIngress.length >= 2, String(network.publicIngress?.length ?? 0), file);
  addCheck(checks, "vm-plan:network:privateServices", Array.isArray(network.privateServices) && network.privateServices.includes("PostgreSQL") && network.privateServices.includes("Redis"), JSON.stringify(network.privateServices ?? []), file);
  addCheck(checks, "vm-plan:network:databasePublicExposureAllowedFalse", network.databasePublicExposureAllowed === false, String(network.databasePublicExposureAllowed), file);
  addCheck(checks, "vm-plan:network:redisPublicExposureAllowedFalse", network.redisPublicExposureAllowed === false, String(network.redisPublicExposureAllowed), file);

  const runtime = plan.runtimePlan ?? {};
  addCheck(checks, "vm-plan:runtime:installOrder", Array.isArray(runtime.installOrder) && runtime.installOrder.length >= 8, String(runtime.installOrder?.length ?? 0), file);
  addCheck(checks, "vm-plan:runtime:servicesPlanned", Array.isArray(runtime.servicesPlanned) && runtime.servicesPlanned.includes("PostgreSQL") && runtime.servicesPlanned.includes("Redis"), JSON.stringify(runtime.servicesPlanned ?? []), file);
  const low = runtime.lowConcurrencyDefaults ?? {};
  addCheck(checks, "vm-plan:runtime:workerConcurrency", Number(low.workerConcurrency) === 2, String(low.workerConcurrency), file);
  addCheck(checks, "vm-plan:runtime:playwrightMaxConcurrency", Number(low.playwrightMaxConcurrency) === 1, String(low.playwrightMaxConcurrency), file);
  addCheck(checks, "vm-plan:runtime:airtableMirrorInterval", Number(low.airtableMirrorIntervalMinutes) >= 15, String(low.airtableMirrorIntervalMinutes), file);
  addCheck(checks, "vm-plan:runtime:openClawPauses", low.openClawPausesIfCompeting === true, String(low.openClawPausesIfCompeting), file);

  const safety = plan.costAndSafety ?? {};
  for (const key of ["founderApprovalRequiredForAnyPaidChange", "noCloudResourcesCreatedByThisScript", "noCredentialMaterialStoredByThisScript", "noProductionDeployByThisScript", "noCandidateDocumentsBeforeStorageGates", "candidateSafetyWins"]) {
    addCheck(checks, `vm-plan:safety:${key}`, safety[key] === true, String(safety[key]), file);
  }
  addCheck(checks, "vm-plan:safety:paidResourcesDefaultFalse", safety.paidResourcesDefault === false, String(safety.paidResourcesDefault), file);
  addCheck(checks, "vm-plan:safety:productionReadyFalse", safety.productionReady === false, String(safety.productionReady), file);
  addCheck(checks, "vm-plan:maskedEvidence", Array.isArray(plan.maskedEvidenceToCollectLater) && plan.maskedEvidenceToCollectLater.length >= 10, String(plan.maskedEvidenceToCollectLater?.length ?? 0), file);
  addCheck(checks, "vm-plan:blockedUntilFutureApproval", Array.isArray(plan.blockedUntilFutureApproval) && plan.blockedUntilFutureApproval.length >= 6, String(plan.blockedUntilFutureApproval?.length ?? 0), file);
  addCheck(checks, "vm-plan:nextTrackerRow", plan.nextTrackerRow === "ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs", String(plan.nextTrackerRow ?? ""), file);
}

function checkFounderChecklist(checks) {
  const file = "kingsmen/oracle/vm-bootstrap/checklists/oracle-vm-founder-checklist.json";
  const checklist = parseJsonFile(checks, file, "vm-founder-checklist");
  if (!checklist) return;
  addCheck(checks, "vm-founder-checklist:module", checklist.module === "ORACLE", String(checklist.module), file);
  addCheck(checks, "vm-founder-checklist:submodule", checklist.submodule === "ORACLE.9", String(checklist.submodule), file);
  addCheck(checks, "vm-founder-checklist:productionReadyFalse", checklist.productionReady === false, String(checklist.productionReady), file);
  addCheck(checks, "vm-founder-checklist:checklist", Array.isArray(checklist.checklist) && checklist.checklist.length >= 10, String(checklist.checklist?.length ?? 0), file);
  addCheck(checks, "vm-founder-checklist:hardBoundaries", Array.isArray(checklist.hardBoundaries) && checklist.hardBoundaries.length >= 6, String(checklist.hardBoundaries?.length ?? 0), file);
  addCheck(checks, "vm-founder-checklist:nextTrackerRow", checklist.nextTrackerRow === "ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs", String(checklist.nextTrackerRow ?? ""), file);
}

function checkMarkdown(checks) {
  const file = "docs/oracle/oracle-vm-bootstrap-plan.md";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const phrase of requiredMarkdownPhrases) addCheck(checks, `vm-plan-md:phrase:${phrase}`, content.includes(phrase), content.includes(phrase) ? "present" : "missing", file);
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const token of ["KINGSMEN_PRODUCTION_READY=false", "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite", "KINGSMEN_ORACLE_LITE_MODE=true", "KINGSMEN_ACTIVE_CANDIDATE_CAP=500", "KINGSMEN_LOW_CONCURRENCY_MODE=true", "PLAYWRIGHT_MAX_CONCURRENCY=1"]) {
    addCheck(checks, `env:required:${token}`, content.includes(token), content.includes(token) ? "present" : "missing", file);
  }
  for (const token of ["KINGSMEN_PRODUCTION_READY=true", "SECRETS_IN_GIT_ALLOWED=true", "SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=true"]) {
    addCheck(checks, `env:not-present:${token}`, !content.includes(token), content.includes(token) ? "present" : "not present", file);
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
  checkPresence(checks);
  checkForbiddenText(checks);
  checkReport(checks, "reports/oracle/oracle-action-packet-validation-report.json", "oracle8-report", "ORACLE", "ORACLE.8");
  checkReport(checks, "reports/oracle/oracle-founder-action-packet-report.json", "oracle7-report", "ORACLE", "ORACLE.7");
  checkVmBootstrapReport(checks);
  checkVmBootstrapPlan(checks);
  checkFounderChecklist(checks);
  checkMarkdown(checks);
  checkEnvTemplate(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.10",
    validator: "validate-oracle-vm-bootstrap-plan.mjs",
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
    nextTrackerRow: failed.length === 0 ? "ORACLE.11 - scripts/oracle/Write-OracleSshBootstrapGuide.ps1" : "ORACLE.10 repair - fix hard failures in reports/oracle/oracle-vm-bootstrap-plan-validation-report.json"
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
    submodule: "ORACLE.10",
    validator: "validate-oracle-vm-bootstrap-plan.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    warningChecks: 0,
    failed: [{ name: "validator:unhandled-error", passed: false, detail: error instanceof Error ? error.message : String(error), file: "scripts/validators/validate-oracle-vm-bootstrap-plan.mjs" }],
    nextTrackerRow: "ORACLE.10 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
