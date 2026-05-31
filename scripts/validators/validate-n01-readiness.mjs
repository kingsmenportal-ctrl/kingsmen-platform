import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/n01-readiness-report.json");

const requiredFiles = [
  "Kingsmen_Build_Tracker.csv",
  "config/environment/.env.template",
  "config/providers/provider-registry.json",
  "config/creator.config.json",
  "manifests/master-build-index.json",
  "scripts/KINGSMEN_CREATOR.ps1",
  "scripts/testing/Test-KingsmenCreator.ps1",
  "scripts/install-git-hooks.ps1",
  "scripts/phases/Invoke-KingsmenPhase.ps1",
  "scripts/maintenance/prune-logs.ps1",
  "scripts/validators/validate-n09-3.mjs",
  "scripts/validators/validate-provider-health.mjs",
  "scripts/validators/validate-health.mjs",
  "scripts/validators/validate-n01-readiness.mjs",
  "infrastructure/nginx/nginx.conf",
  "docker-compose.yml"
];

const requiredReports = [
  {
    path: "reports/n09/n09-3-validation-report.json",
    module: "N09",
    submodule: "N09.3"
  },
  {
    path: "reports/creator/creator-validation-report.json",
    module: "CREATOR",
    submodule: "CREATOR.2"
  },
  {
    path: "reports/validation/provider-health-report.json",
    module: "N01",
    submodule: "N01.5.2"
  },
  {
    path: "reports/phases/n01-6-phase-runner-report.json",
    module: "N01",
    submodule: "N01.6"
  },
  {
    path: "reports/maintenance/prune-logs-report.json",
    module: "N01",
    submodule: "N01.8"
  },
  {
    path: "reports/validation/health-report.json",
    module: "N01",
    submodule: "N01.8.1"
  }
];

const requiredEnvTokens = [
  "KINGSMEN_PRODUCTION_READY=false",
  "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
  "KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
  "KINGSMEN_READY_CAP_TARGET=1000",
  "KINGSMEN_PREPARE_CAP_TARGET=5000",
  "KINGSMEN_EMAIL_PRIMARY=true",
  "KINGSMEN_WHATSAPP_URGENT_ONLY=true",
  "KINGSMEN_SMS_BACKUP_ONLY=true",
  "KINGSMEN_AIRTABLE_MIRROR_ONLY=true",
  "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY=true",
  "FOUNDER_MFA_REQUIRED=true",
  "OPERATOR_MFA_REQUIRED=true",
  "APPEND_ONLY_AUDIT_ENABLED=true",
  "POPIA_ACCESS_LOG_ENABLED=true"
];

const requiredComposeServices = ["postgres", "redis", "api", "web", "worker", "nginx"];
const requiredN01Rows = ["N01.5", "N01.5.1", "N01.5.2", "N01.6", "N01.6.1", "N01.7", "N01.7.1", "N01.8", "N01.8.1", "N01.9"];

function rel(filePath) {
  return path.join(root, filePath);
}

function exists(filePath) {
  return fs.existsSync(rel(filePath));
}

function read(filePath) {
  return fs.readFileSync(rel(filePath), "utf8");
}

function readJson(filePath) {
  return JSON.parse(read(filePath).replace(/^\uFEFF/, ""));
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function addCheck(checks, name, passed, detail, file = "") {
  checks.push({ name, passed: Boolean(passed), detail, file });
}

function checkRequiredFiles(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, exists(file), exists(file) ? "found" : "missing", file);
  }
}

function checkForbiddenContent(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "productionReadyEnvTrue", pattern: /^\s*KINGSMEN_PRODUCTION_READY\s*[:=]\s*true\s*$/im },
    { name: "databaseUrlAssignment", pattern: /^\s*DATABASE_URL\s*[:=]\s*\S+/im },
    { name: "postgresPasswordAssignment", pattern: /^\s*(PG_PASSWORD|POSTGRES_PASSWORD)\s*[:=]\s*(?!\$\{|\$\{PG_PASSWORD:\?)[^\s#]+/im },
    { name: "supabaseServiceRole", pattern: /SUPABASE_SERVICE_ROLE\s*[:=]\s*\S+/i },
    { name: "smtpPassword", pattern: /SMTP_PASSWORD\s*[:=]\s*\S+/i },
    { name: "whatsappToken", pattern: /WHATSAPP_(TOKEN|SECRET|ACCESS_TOKEN)\s*[:=]\s*\S+/i },
    { name: "smsToken", pattern: /SMS_(TOKEN|SECRET|API_KEY)\s*[:=]\s*\S+/i },
    { name: "paymentSecret", pattern: /(PAYMENT_SECRET|PAYFAST_PASSPHRASE|YOCO_SECRET_KEY|STRIPE_SECRET_KEY)\s*[:=]\s*\S+/i },
    { name: "airtableToken", pattern: /(AIRTABLE_TOKEN|AIRTABLE_API_KEY)\s*[:=]\s*\S+/i },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
    { name: "rawCandidateDocumentPath", pattern: /(candidate_documents|raw_evidence)\//i }
  ];

  for (const file of [...requiredFiles, ...requiredReports.map((report) => report.path)]) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const item of forbidden) {
      const passed = !item.pattern.test(content);
      addCheck(checks, `forbidden:${file}:${item.name}`, passed, passed ? "not found" : "forbidden content found", file);
    }
  }
}

function checkReports(checks) {
  for (const reportSpec of requiredReports) {
    const file = reportSpec.path;
    addCheck(checks, `report-exists:${file}`, exists(file), exists(file) ? "found" : "missing", file);
    if (!exists(file)) continue;

    let report;
    try {
      report = readJson(file);
      addCheck(checks, `report-json:${file}`, true, "parsed", file);
    } catch (error) {
      addCheck(checks, `report-json:${file}`, false, error instanceof Error ? error.message : "parse failed", file);
      continue;
    }

    addCheck(checks, `report-module:${file}`, report.module === reportSpec.module, String(report.module), file);
    addCheck(checks, `report-submodule:${file}`, report.submodule === reportSpec.submodule, String(report.submodule), file);
    addCheck(checks, `report-passed:${file}`, report.passed === true, String(report.passed), file);
    addCheck(checks, `report-failedChecks-zero:${file}`, report.failedChecks === 0, String(report.failedChecks), file);
    addCheck(checks, `report-productionReady-false:${file}`, report.productionReady === false, String(report.productionReady), file);
  }
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!exists(file)) return;
  const content = read(file);

  for (const token of requiredEnvTokens) {
    addCheck(checks, `env:contains:${token}`, content.includes(token), content.includes(token) ? "found" : "missing", file);
  }
}

function checkCreatorConfig(checks) {
  const file = "config/creator.config.json";
  if (!exists(file)) return;

  let config;
  try {
    config = readJson(file);
    addCheck(checks, "creator-config:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "creator-config:json", false, error instanceof Error ? error.message : "parse failed", file);
    return;
  }

  addCheck(checks, "creator-config:productionReadyFalse", config.productionReady === false, String(config.productionReady), file);
  addCheck(checks, "creator-config:canonicalCreator", config.repo?.canonicalCreator === "scripts/KINGSMEN_CREATOR.ps1", String(config.repo?.canonicalCreator ?? ""), file);
  addCheck(checks, "creator-config:trackerAuthority", config.proofDoctrine?.trackerIsBuildStatusAuthority === true, String(config.proofDoctrine?.trackerIsBuildStatusAuthority), file);
  addCheck(checks, "creator-config:oracleLite", config.oracleLiteDiscipline?.defaultDeploymentTarget === "Oracle Cloud Free Tier / Oracle Lite", String(config.oracleLiteDiscipline?.defaultDeploymentTarget ?? ""), file);
}

function checkProviderRegistry(checks) {
  const file = "config/providers/provider-registry.json";
  if (!exists(file)) return;

  let registry;
  try {
    registry = readJson(file);
    addCheck(checks, "provider-registry:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "provider-registry:json", false, error instanceof Error ? error.message : "parse failed", file);
    return;
  }

  const doctrine = registry.doctrine ?? {};
  const locks = ["oracleLiteFirst", "postgresqlTruth", "airtableMirrorOnly", "emailPrimary", "whatsappUrgentOnly", "smsBackupOnly", "playwrightScoutOnly", "noHardcodedSecrets"];
  for (const lock of locks) {
    addCheck(checks, `provider-registry:doctrine:${lock}`, doctrine[lock] === true, String(doctrine[lock]), file);
  }

  const groups = registry.providerGroups ?? {};
  for (const group of ["database", "queue", "storage", "email", "whatsapp", "sms", "payments", "airtable", "playwright"]) {
    addCheck(checks, `provider-registry:group:${group}`, Boolean(groups[group]), Boolean(groups[group]) ? "found" : "missing", file);
  }
}

function checkMasterBuildIndex(checks) {
  const file = "manifests/master-build-index.json";
  if (!exists(file)) return;

  let index;
  try {
    index = readJson(file);
    addCheck(checks, "master-index:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "master-index:json", false, error instanceof Error ? error.message : "parse failed", file);
    return;
  }

  addCheck(checks, "master-index:productionReadyFalse", index.productionReady === false, String(index.productionReady), file);
  addCheck(checks, "master-index:oracleLiteFirst", index.globalLocks?.oracleLiteFirst === true, String(index.globalLocks?.oracleLiteFirst), file);
  addCheck(checks, "master-index:postgresTruth", index.globalLocks?.postgresqlTruth === true, String(index.globalLocks?.postgresqlTruth), file);
  addCheck(checks, "master-index:allSixGates", index.globalLocks?.allSixGatesVisibleToAllUsers === true, String(index.globalLocks?.allSixGatesVisibleToAllUsers), file);
  addCheck(checks, "master-index:nextN01Readiness", index.nextTrackerRow === "N01.7 - infrastructure/nginx/nginx.conf" || typeof index.nextTrackerRow === "string", String(index.nextTrackerRow ?? ""), file);

  const evidence = Array.isArray(index.validatedEvidence) ? index.validatedEvidence : [];
  for (const moduleName of ["N09.3", "CREATOR.2", "N01.5.2", "N01.6"]) {
    addCheck(checks, `master-index:validated-evidence:${moduleName}`, evidence.some((entry) => entry.module === moduleName && entry.status === "validated"), evidence.map((entry) => entry.module).join(","), file);
  }
}

function checkDockerCompose(checks) {
  const file = "docker-compose.yml";
  if (!exists(file)) return;
  const content = read(file);

  for (const service of requiredComposeServices) {
    addCheck(checks, `compose:service:${service}`, new RegExp(`^  ${service}:`, "m").test(content), "service check", file);
  }

  addCheck(checks, "compose:postgres-password-required", content.includes("PG_PASSWORD must be set locally and never committed"), "local secret required", file);
  addCheck(checks, "compose:private-network-internal", content.includes("internal: true"), "internal network", file);
  addCheck(checks, "compose:healthchecks", (content.match(/healthcheck:/g) ?? []).length >= 4, String((content.match(/healthcheck:/g) ?? []).length), file);
  addCheck(checks, "compose:oracle-lite-resource-limits", (content.match(/resources:/g) ?? []).length >= 5, String((content.match(/resources:/g) ?? []).length), file);
}

function checkNginx(checks) {
  const file = "infrastructure/nginx/nginx.conf";
  if (!exists(file)) return;
  const content = read(file);

  for (const token of ["server_tokens off;", "location = /health/nginx", "X-Kingsmen-Production-Ready", "oracle_lite", "limit_req_zone $binary_remote_addr zone=kingsmen_api", "limit_req_zone $binary_remote_addr zone=kingsmen_upload"]) {
    addCheck(checks, `nginx:contains:${token}`, content.includes(token), content.includes(token) ? "found" : "missing", file);
  }
}

function checkTracker(checks) {
  const file = "Kingsmen_Build_Tracker.csv";
  if (!exists(file)) return;
  const content = read(file);
  for (const row of requiredN01Rows) {
    addCheck(checks, `tracker:has-row:${row}`, content.includes(row), content.includes(row) ? "found" : "missing", file);
  }
}

function buildChecksums() {
  return [...requiredFiles, ...requiredReports.map((report) => report.path)]
    .filter((file) => exists(file))
    .map((file) => {
      const content = read(file);
      return {
        path: file,
        sha256: sha256(content),
        bytes: Buffer.byteLength(content, "utf8")
      };
    });
}

function main() {
  const checks = [];

  checkRequiredFiles(checks);
  checkForbiddenContent(checks);
  checkReports(checks);
  checkEnvTemplate(checks);
  checkCreatorConfig(checks);
  checkProviderRegistry(checks);
  checkMasterBuildIndex(checks);
  checkDockerCompose(checks);
  checkNginx(checks);
  checkTracker(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "N01",
    submodule: "N01.9",
    validator: "validate-n01-readiness.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    readinessScope: [
      "creator",
      "provider-health",
      "phase-runner",
      "nginx",
      "docker-compose",
      "maintenance",
      "health-validator",
      "master-build-index",
      "tracker-presence"
    ],
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "N02.1 - apps/api/src/kernel/constitution-loader.ts"
      : "N01.9 repair - fix failed checks in reports/validation/n01-readiness-report.json"
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
    module: "N01",
    submodule: "N01.9",
    validator: "validate-n01-readiness.mjs",
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
        file: "scripts/validators/validate-n01-readiness.mjs"
      }
    ],
    nextTrackerRow: "N01.9 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
