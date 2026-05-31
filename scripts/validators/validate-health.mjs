import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/health-report.json");

const requiredFiles = [
  "infrastructure/nginx/nginx.conf",
  "docker-compose.yml",
  "scripts/maintenance/prune-logs.ps1",
  "reports/maintenance/prune-logs-report.json",
  "scripts/validators/validate-health.mjs"
];

const requiredComposeServices = ["postgres", "redis", "api", "web", "worker", "nginx"];
const requiredNginxTokens = [
  "server_tokens off;",
  "limit_req_zone $binary_remote_addr zone=kingsmen_public",
  "limit_req_zone $binary_remote_addr zone=kingsmen_api",
  "limit_req_zone $binary_remote_addr zone=kingsmen_auth",
  "limit_req_zone $binary_remote_addr zone=kingsmen_upload",
  "upstream kingsmen_web",
  "upstream kingsmen_api",
  "location = /health/nginx",
  "X-Kingsmen-Production-Ready",
  "oracle_lite"
];

const requiredComposeTokens = [
  "KINGSMEN_PRODUCTION_READY: \"false\"",
  "KINGSMEN_DEFAULT_DEPLOY_TARGET: oracle_lite",
  "KINGSMEN_ACTIVE_CANDIDATE_CAP",
  "PG_PASSWORD must be set locally and never committed",
  "postgres:16-alpine",
  "redis:7-alpine",
  "nginx:1.27-alpine",
  "kingsmen_private:",
  "internal: true",
  "kingsmen_public:",
  "PLAYWRIGHT_BLOCK_ON_CAPTCHA: \"true\"",
  "PLAYWRIGHT_BLOCK_ON_OTP: \"true\""
];

function rel(filePath) {
  return path.join(root, filePath);
}

function exists(filePath) {
  return fs.existsSync(rel(filePath));
}

function read(filePath) {
  return fs.readFileSync(rel(filePath), "utf8");
}

function readJsonFile(filePath) {
  const content = read(filePath).replace(/^\uFEFF/, "");
  return JSON.parse(content);
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
    { name: "postgresPasswordValue", pattern: /^\s*(PG_PASSWORD|POSTGRES_PASSWORD)\s*[:=]\s*(?!\$\{|\$\$\{|\$\{PG_PASSWORD:\?)[^\s#]+/im },
    { name: "supabaseServiceRole", pattern: /SUPABASE_SERVICE_ROLE\s*[:=]\s*\S+/i },
    { name: "smtpPassword", pattern: /SMTP_PASSWORD\s*[:=]\s*\S+/i },
    { name: "whatsappToken", pattern: /WHATSAPP_(TOKEN|SECRET|ACCESS_TOKEN)\s*[:=]\s*\S+/i },
    { name: "paymentSecret", pattern: /(PAYMENT_SECRET|PAYFAST_PASSPHRASE|YOCO_SECRET_KEY|STRIPE_SECRET_KEY)\s*[:=]\s*\S+/i },
    { name: "airtableToken", pattern: /(AIRTABLE_TOKEN|AIRTABLE_API_KEY)\s*[:=]\s*\S+/i },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
    { name: "rawCandidateDocumentPath", pattern: /(candidate_documents|raw_evidence)\//i }
  ];

  for (const file of requiredFiles) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const item of forbidden) {
      const passed = !item.pattern.test(content);
      addCheck(checks, `forbidden:${file}:${item.name}`, passed, passed ? "not found" : "forbidden content found", file);
    }
  }
}

function checkNginx(checks) {
  const file = "infrastructure/nginx/nginx.conf";
  if (!exists(file)) return;
  const content = read(file);

  for (const token of requiredNginxTokens) {
    addCheck(checks, `nginx:contains:${token}`, content.includes(token), content.includes(token) ? "found" : "missing", file);
  }

  const hasPublicLimit = /location\s+\/\s*\{[\s\S]*?limit_req\s+zone=kingsmen_public/.test(content);
  const hasApiLimit = /location \^~ \/api\/\s*\{[\s\S]*?limit_req\s+zone=kingsmen_api/.test(content);
  const hasAuthLimit = /location \^~ \/api\/auth\/\s*\{[\s\S]*?limit_req\s+zone=kingsmen_auth/.test(content);
  const hasUploadLimit = /location \^~ \/api\/documents\/upload\s*\{[\s\S]*?limit_req\s+zone=kingsmen_upload/.test(content);

  addCheck(checks, "nginx:public-rate-limit", hasPublicLimit, hasPublicLimit ? "found" : "missing", file);
  addCheck(checks, "nginx:api-rate-limit", hasApiLimit, hasApiLimit ? "found" : "missing", file);
  addCheck(checks, "nginx:auth-rate-limit", hasAuthLimit, hasAuthLimit ? "found" : "missing", file);
  addCheck(checks, "nginx:upload-rate-limit", hasUploadLimit, hasUploadLimit ? "found" : "missing", file);

  const clientBodySize = content.match(/client_max_body_size\s+(\d+)m;/i);
  addCheck(checks, "nginx:client-body-size-capped", Boolean(clientBodySize) && Number(clientBodySize[1]) <= 15, clientBodySize ? `${clientBodySize[1]}m` : "missing", file);
}

function checkDockerCompose(checks) {
  const file = "docker-compose.yml";
  if (!exists(file)) return;
  const content = read(file);

  for (const service of requiredComposeServices) {
    const pattern = new RegExp(`^  ${service}:`, "m");
    addCheck(checks, `compose:service:${service}`, pattern.test(content), pattern.test(content) ? "found" : "missing", file);
  }

  for (const token of requiredComposeTokens) {
    addCheck(checks, `compose:contains:${token}`, content.includes(token), content.includes(token) ? "found" : "missing", file);
  }

  const healthcheckCount = (content.match(/healthcheck:/g) ?? []).length;
  addCheck(checks, "compose:healthcheck-count", healthcheckCount >= 4, String(healthcheckCount), file);

  const localOnlyPg = content.includes('"127.0.0.1:${PG_PORT:-5432}:5432"');
  const localOnlyRedis = content.includes('"127.0.0.1:${REDIS_PORT:-6379}:6379"');
  addCheck(checks, "compose:postgres-local-only-port", localOnlyPg, localOnlyPg ? "found" : "missing", file);
  addCheck(checks, "compose:redis-local-only-port", localOnlyRedis, localOnlyRedis ? "found" : "missing", file);

  const hasResourceLimits = (content.match(/resources:/g) ?? []).length >= 5;
  addCheck(checks, "compose:oracle-lite-resource-limits", hasResourceLimits, hasResourceLimits ? "found" : "missing", file);
}

function checkMaintenanceReport(checks) {
  const file = "reports/maintenance/prune-logs-report.json";
  if (!exists(file)) return;

  let report;
  try {
    report = readJsonFile(file);
    addCheck(checks, "maintenance-report:json-parse", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "maintenance-report:json-parse", false, error instanceof Error ? error.message : "parse failed", file);
    return;
  }

  addCheck(checks, "maintenance-report:module", report.module === "N01", String(report.module), file);
  addCheck(checks, "maintenance-report:submodule", report.submodule === "N01.8", String(report.submodule), file);
  addCheck(checks, "maintenance-report:passed", report.passed === true, String(report.passed), file);
  addCheck(checks, "maintenance-report:failedChecksZero", report.failedChecks === 0, String(report.failedChecks), file);
  addCheck(checks, "maintenance-report:productionReadyFalse", report.productionReady === false, String(report.productionReady), file);

  const protectedRoots = ["candidate_documents", "raw_evidence", "documents", "evidence"];
  const prunableRoots = Array.isArray(report.prunableRoots) ? report.prunableRoots : [];
  for (const protectedRoot of protectedRoots) {
    addCheck(
      checks,
      `maintenance-report:protected-root-not-prunable:${protectedRoot}`,
      !prunableRoots.includes(protectedRoot),
      !prunableRoots.includes(protectedRoot) ? "not prunable" : "unsafe prunable root found",
      file
    );
  }
}

function buildChecksums() {
  return requiredFiles.filter((file) => exists(file)).map((file) => {
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
  checkNginx(checks);
  checkDockerCompose(checks);
  checkMaintenanceReport(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "N01",
    submodule: "N01.8.1",
    validator: "validate-health.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    healthScope: ["nginx", "docker-compose", "maintenance-prune-report", "oracle-lite-discipline"],
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "N01.9 - scripts/validators/validate-n01-readiness.mjs"
      : "N01.8.1 repair - fix failed checks in reports/validation/health-report.json"
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
    submodule: "N01.8.1",
    validator: "validate-health.mjs",
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
        file: "scripts/validators/validate-health.mjs"
      }
    ],
    nextTrackerRow: "N01.8.1 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
