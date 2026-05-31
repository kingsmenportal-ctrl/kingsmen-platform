import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-free-bootstrap-report.json");

const requiredFiles = [
  "kingsmen/oracle/oracle-free-bootstrap-plan.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json",
  "reports/openclaw/openclaw-safety-report.json",
  "scripts/validators/validate-oracle-bootstrap.mjs"
];

const requiredDoctrineTrue = [
  "oracleLiteFirst",
  "dockerComposeFirst",
  "postgresqlTruth",
  "redisPrivateQueue",
  "backendGovernsRuntime",
  "powershellCreatorMaterializes",
  "validatorsProve",
  "githubPreservesHistory",
  "openClawGovernedHelperOnly",
  "candidateSafetyWins",
  "productionReadyMustRemainFalse"
];

const requiredEnvDefaults = {
  KINGSMEN_PRODUCTION_READY: "false",
  KINGSMEN_DEFAULT_DEPLOY_TARGET: "oracle_lite",
  KINGSMEN_ORACLE_LITE_MODE: "true",
  KINGSMEN_ACTIVE_CANDIDATE_CAP: "500",
  KINGSMEN_READY_CAP_TARGET: "1000",
  KINGSMEN_PREPARE_CAP_TARGET: "5000",
  KINGSMEN_LOW_CONCURRENCY_MODE: "true",
  KINGSMEN_WORKER_CONCURRENCY: "2",
  PLAYWRIGHT_MAX_CONCURRENCY: "1",
  EMAIL_PROVIDER: "no_send",
  PAYMENT_PROVIDER: "manual_eft_proof"
};

const requiredHealthReports = [
  "oracleBootstrapReport",
  "oracleCapacityReport",
  "oracleSecurityReport",
  "oracleCostGuardReport",
  "openClawSafetyReport",
  "providerHealthReport"
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

function addCheck(checks, name, passed, detail, file = "") {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file });
}

function checkRequiredFiles(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
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

function parseEnvTemplate(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    map.set(trimmed.slice(0, index), trimmed.slice(index + 1));
  }
  return map;
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return null;
  const env = parseEnvTemplate(read(file));
  for (const [key, value] of Object.entries(requiredEnvDefaults)) {
    addCheck(checks, `env:${key}`, env.get(key) === value, String(env.get(key) ?? "missing"), file);
  }
  addCheck(checks, "env:oracle-lite-mode", env.get("KINGSMEN_ORACLE_LITE_MODE") === "true", String(env.get("KINGSMEN_ORACLE_LITE_MODE") ?? "missing"), file);
  addCheck(checks, "env:low-concurrency", env.get("KINGSMEN_LOW_CONCURRENCY_MODE") === "true", String(env.get("KINGSMEN_LOW_CONCURRENCY_MODE") ?? "missing"), file);
  addCheck(checks, "env:no-send-email", env.get("EMAIL_PROVIDER") === "no_send", String(env.get("EMAIL_PROVIDER") ?? "missing"), file);
  return env;
}

function checkProviderRegistry(checks) {
  const file = "config/providers/provider-registry.json";
  if (!existsFile(file)) return null;
  let registry;
  try {
    registry = readJson(file);
    addCheck(checks, "provider-registry:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "provider-registry:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "provider-registry:productionReadyFalse", registry.productionReady === false, String(registry.productionReady), file);
  addCheck(checks, "provider-registry:oracleLiteFirst", registry.doctrine?.oracleLiteFirst === true, String(registry.doctrine?.oracleLiteFirst), file);
  addCheck(checks, "provider-registry:dockerComposeFirst", registry.doctrine?.dockerComposeFirst === true, String(registry.doctrine?.dockerComposeFirst), file);
  addCheck(checks, "provider-registry:noHardcodedSecrets", registry.doctrine?.noHardcodedSecrets === true, String(registry.doctrine?.noHardcodedSecrets), file);
  return registry;
}

function checkOpenClawReport(checks) {
  const file = "reports/openclaw/openclaw-safety-report.json";
  if (!existsFile(file)) return null;
  let report;
  try {
    report = readJson(file);
    addCheck(checks, "openclaw-report:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "openclaw-report:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "openclaw-report:passed", report.passed === true, String(report.passed), file);
  addCheck(checks, "openclaw-report:productionReadyFalse", report.productionReady === false, String(report.productionReady), file);
  addCheck(checks, "openclaw-report:failedChecksZero", Number(report.failedChecks) === 0, String(report.failedChecks), file);
  addCheck(checks, "openclaw-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.1 - kingsmen/oracle/oracle-free-bootstrap-plan.json", String(report.nextTrackerRow ?? ""), file);
  return report;
}

function checkOraclePlan(checks) {
  const file = "kingsmen/oracle/oracle-free-bootstrap-plan.json";
  if (!existsFile(file)) return null;
  let plan;
  try {
    plan = readJson(file);
    addCheck(checks, "oracle-plan:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "oracle-plan:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "oracle-plan:module", plan.module === "ORACLE", String(plan.module), file);
  addCheck(checks, "oracle-plan:submodule", plan.submodule === "ORACLE.1", String(plan.submodule), file);
  addCheck(checks, "oracle-plan:productionReadyFalse", plan.productionReady === false, String(plan.productionReady), file);
  addCheck(checks, "oracle-plan:status", plan.status === "built_pending_validation", String(plan.status), file);
  addCheck(checks, "oracle-plan:official-source-url", typeof plan.officialSourceNotes?.oracleCloudFreeTierPage === "string" && plan.officialSourceNotes.oracleCloudFreeTierPage.includes("oracle.com/cloud/free"), String(plan.officialSourceNotes?.oracleCloudFreeTierPage ?? ""), file);
  addCheck(checks, "oracle-plan:must-reverify", plan.officialSourceNotes?.mustReverifyBeforeSpendOrProduction === true, String(plan.officialSourceNotes?.mustReverifyBeforeSpendOrProduction), file);
  addCheck(checks, "oracle-plan:capacity-warning", typeof plan.officialSourceNotes?.capacityWarning === "string" && plan.officialSourceNotes.capacityWarning.length > 30, String(plan.officialSourceNotes?.capacityWarning ?? ""), file);

  for (const key of requiredDoctrineTrue) {
    addCheck(checks, `oracle-plan:doctrine:${key}`, plan.kingsmenDoctrine?.[key] === true, String(plan.kingsmenDoctrine?.[key]), file);
  }

  addCheck(checks, "oracle-plan:stage", plan.deploymentIntent?.stage === "bootstrap_planning_only", String(plan.deploymentIntent?.stage ?? ""), file);
  addCheck(checks, "oracle-plan:not-yet-allowed", Array.isArray(plan.deploymentIntent?.notYetAllowed) && plan.deploymentIntent.notYetAllowed.length >= 5, String(plan.deploymentIntent?.notYetAllowed?.length ?? 0), file);
  addCheck(checks, "oracle-plan:preferred-core-vm", Boolean(plan.resourcePlan?.preferredCoreVm), plan.resourcePlan?.preferredCoreVm ? "present" : "missing", file);
  addCheck(checks, "oracle-plan:workloads", Array.isArray(plan.resourcePlan?.preferredCoreVm?.workloads) && plan.resourcePlan.preferredCoreVm.workloads.length >= 5, String(plan.resourcePlan?.preferredCoreVm?.workloads?.length ?? 0), file);
  addCheck(checks, "oracle-plan:discipline", Array.isArray(plan.resourcePlan?.preferredCoreVm?.discipline) && plan.resourcePlan.preferredCoreVm.discipline.length >= 5, String(plan.resourcePlan?.preferredCoreVm?.discipline?.length ?? 0), file);
  addCheck(checks, "oracle-plan:openclaw-hard-rule", typeof plan.resourcePlan?.openClawPlacement?.hardRule === "string" && plan.resourcePlan.openClawPlacement.hardRule.includes("Candidate runtime wins"), String(plan.resourcePlan?.openClawPlacement?.hardRule ?? ""), file);
  addCheck(checks, "oracle-plan:storage-rule", typeof plan.resourcePlan?.storage?.documentRule === "string" && plan.resourcePlan.storage.documentRule.length > 20, String(plan.resourcePlan?.storage?.documentRule ?? ""), file);
  addCheck(checks, "oracle-plan:network-db-exposure", typeof plan.resourcePlan?.network?.databaseExposure === "string" && plan.resourcePlan.network.databaseExposure.length > 20, String(plan.resourcePlan?.network?.databaseExposure ?? ""), file);
  addCheck(checks, "oracle-plan:security-no-secrets", plan.resourcePlan?.security?.noSecretsInGit === true, String(plan.resourcePlan?.security?.noSecretsInGit), file);
  addCheck(checks, "oracle-plan:security-founder-mfa", plan.resourcePlan?.security?.founderMfaRequired === true, String(plan.resourcePlan?.security?.founderMfaRequired), file);
  addCheck(checks, "oracle-plan:bootstrap-steps", Array.isArray(plan.bootstrapSteps) && plan.bootstrapSteps.length >= 6, String(plan.bootstrapSteps?.length ?? 0), file);
  addCheck(checks, "oracle-plan:env-template-path", plan.environmentMapping?.requiredEnvTemplate === "config/environment/.env.template", String(plan.environmentMapping?.requiredEnvTemplate ?? ""), file);
  addCheck(checks, "oracle-plan:provider-registry-path", plan.environmentMapping?.providerRegistry === "config/providers/provider-registry.json", String(plan.environmentMapping?.providerRegistry ?? ""), file);

  for (const [key, expected] of Object.entries(requiredEnvDefaults)) {
    addCheck(checks, `oracle-plan:env-default:${key}`, plan.environmentMapping?.requiredDefaults?.[key] === expected, String(plan.environmentMapping?.requiredDefaults?.[key] ?? "missing"), file);
  }

  addCheck(checks, "oracle-plan:blocked-in-git", Array.isArray(plan.environmentMapping?.blockedInGit) && plan.environmentMapping.blockedInGit.length >= 5, String(plan.environmentMapping?.blockedInGit?.length ?? 0), file);
  for (const key of requiredHealthReports) {
    addCheck(checks, `oracle-plan:health-report:${key}`, typeof plan.healthReports?.[key] === "string" && plan.healthReports[key].startsWith("reports/"), String(plan.healthReports?.[key] ?? ""), file);
  }

  addCheck(checks, "oracle-plan:cost-paid-default", plan.costGuard?.paidResourcesDefault === false, String(plan.costGuard?.paidResourcesDefault), file);
  addCheck(checks, "oracle-plan:cost-founder-approval", plan.costGuard?.founderApprovalRequiredForAnyPaidChange === true, String(plan.costGuard?.founderApprovalRequiredForAnyPaidChange), file);
  addCheck(checks, "oracle-plan:cost-stop-zero", Number(plan.costGuard?.stopIfEstimatedMonthlyCostAboveZar) === 0, String(plan.costGuard?.stopIfEstimatedMonthlyCostAboveZar), file);
  addCheck(checks, "oracle-plan:openclaw-can-help", Array.isArray(plan.openClawBoundary?.canHelp) && plan.openClawBoundary.canHelp.length >= 4, String(plan.openClawBoundary?.canHelp?.length ?? 0), file);
  addCheck(checks, "oracle-plan:openclaw-cannot-do", Array.isArray(plan.openClawBoundary?.cannotDo) && plan.openClawBoundary.cannotDo.length >= 5, String(plan.openClawBoundary?.cannotDo?.length ?? 0), file);
  addCheck(checks, "oracle-plan:validator-path", plan.validationExpectation?.validator === "scripts/validators/validate-oracle-bootstrap.mjs", String(plan.validationExpectation?.validator ?? ""), file);
  addCheck(checks, "oracle-plan:nextTrackerRow", plan.nextTrackerRow === "ORACLE.2 - scripts/validators/validate-oracle-bootstrap.mjs", String(plan.nextTrackerRow ?? ""), file);

  return plan;
}

function checkPlanEnvCompatibility(checks, plan, env) {
  if (!plan || !env) return;
  const defaults = plan.environmentMapping?.requiredDefaults ?? {};
  for (const [key, expected] of Object.entries(defaults)) {
    addCheck(checks, `compat:env-template:${key}`, env.get(key) === expected, String(env.get(key) ?? "missing"), "config/environment/.env.template");
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
  checkRequiredFiles(checks);
  checkForbiddenText(checks);
  const env = checkEnvTemplate(checks);
  checkProviderRegistry(checks);
  checkOpenClawReport(checks);
  const plan = checkOraclePlan(checks);
  checkPlanEnvCompatibility(checks, plan, env);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.2",
    validator: "validate-oracle-bootstrap.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "ORACLE.3 - scripts/oracle/Prepare-OracleFreeWorkspace.ps1"
      : "ORACLE.2 repair - fix failed checks in reports/oracle/oracle-free-bootstrap-report.json"
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
    submodule: "ORACLE.2",
    validator: "validate-oracle-bootstrap.mjs",
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
        file: "scripts/validators/validate-oracle-bootstrap.mjs"
      }
    ],
    nextTrackerRow: "ORACLE.2 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
