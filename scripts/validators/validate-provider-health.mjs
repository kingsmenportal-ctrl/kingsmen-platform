import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/provider-health-report.json");

const requiredFiles = [
  "config/environment/.env.template",
  "config/providers/provider-registry.json",
  "scripts/validators/validate-provider-health.mjs"
];

const requiredProviderGroups = [
  "database",
  "queue",
  "storage",
  "email",
  "whatsapp",
  "sms",
  "payments",
  "airtable",
  "playwright"
];

const requiredEnvKeys = [
  "KINGSMEN_PRODUCTION_READY=false",
  "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
  "KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
  "KINGSMEN_EMAIL_PRIMARY=true",
  "KINGSMEN_WHATSAPP_URGENT_ONLY=true",
  "KINGSMEN_SMS_BACKUP_ONLY=true",
  "KINGSMEN_AIRTABLE_MIRROR_ONLY=true",
  "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY=true",
  "EMAIL_PROVIDER_MODE=disabled",
  "EMAIL_NO_SEND_MODE=true",
  "EMAIL_PREVIEW_MODE=true",
  "WHATSAPP_URGENT_ONLY=true",
  "WHATSAPP_BULK_BLOCKED=true",
  "SMS_BACKUP_ONLY=true",
  "SMS_BULK_BLOCKED=true",
  "PAYMENT_PROVIDER_MODE=manual_proof",
  "PAYMENT_MANUAL_PROOF_REVIEW_REQUIRED=true",
  "AIRTABLE_MIRROR_MODE=disabled",
  "PLAYWRIGHT_BLOCK_ON_CAPTCHA=true",
  "PLAYWRIGHT_BLOCK_ON_OTP=true",
  "PLAYWRIGHT_MAP_FALLBACK_ENABLED=true",
  "FOUNDER_MFA_REQUIRED=true",
  "OPERATOR_MFA_REQUIRED=true",
  "APPEND_ONLY_AUDIT_ENABLED=true",
  "POPIA_ACCESS_LOG_ENABLED=true",
  "KINGSMEN_GIT_REQUIRED=true"
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
    { name: "productionReadyEnvTrue", pattern: /^\s*KINGSMEN_PRODUCTION_READY\s*=\s*true\s*$/im },
    { name: "databaseUrlAssignment", pattern: /^\s*DATABASE_URL\s*=\s*\S+/im },
    { name: "postgresPasswordAssignment", pattern: /^\s*PG_PASSWORD\s*=\s*\S+/im },
    { name: "supabaseServiceRoleAssignment", pattern: /^\s*SUPABASE_SERVICE_ROLE\s*=\s*\S+/im },
    { name: "smtpPasswordAssignment", pattern: /^\s*SMTP_PASSWORD\s*=\s*\S+/im },
    { name: "whatsappTokenAssignment", pattern: /^\s*WHATSAPP_(TOKEN|SECRET|ACCESS_TOKEN)\s*=\s*\S+/im },
    { name: "smsTokenAssignment", pattern: /^\s*SMS_(TOKEN|SECRET|API_KEY)\s*=\s*\S+/im },
    { name: "paymentSecretAssignment", pattern: /^\s*(PAYMENT_SECRET|PAYFAST_PASSPHRASE|YOCO_SECRET_KEY|STRIPE_SECRET_KEY)\s*=\s*\S+/im },
    { name: "airtableTokenAssignment", pattern: /^\s*(AIRTABLE_TOKEN|AIRTABLE_API_KEY)\s*=\s*\S+/im },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i }
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

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!exists(file)) return;

  const content = read(file);
  for (const token of requiredEnvKeys) {
    addCheck(
      checks,
      `env-template:contains:${token}`,
      content.includes(token),
      content.includes(token) ? "found" : "missing",
      file
    );
  }

  const placeholderOnlyChecks = [
    { key: "SUPABASE_ANON_KEY", safePattern: /^SUPABASE_ANON_KEY=replace-/m },
    { key: "SMTP_USER", safePattern: /^SMTP_USER=replace-/m },
    { key: "EMAIL_FROM_ADDRESS", safePattern: /^EMAIL_FROM_ADDRESS=no-reply@example\.invalid/m },
    { key: "EMAIL_REPLY_TO", safePattern: /^EMAIL_REPLY_TO=support@example\.invalid/m }
  ];

  for (const check of placeholderOnlyChecks) {
    addCheck(
      checks,
      `env-template:placeholder:${check.key}`,
      check.safePattern.test(content),
      check.safePattern.test(content) ? "safe placeholder" : "missing or unsafe placeholder",
      file
    );
  }
}

function checkProviderRegistry(checks) {
  const file = "config/providers/provider-registry.json";
  if (!exists(file)) return null;

  let registry;
  try {
    registry = JSON.parse(read(file));
    addCheck(checks, "provider-registry:json-parse", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "provider-registry:json-parse", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "provider-registry:module", registry.module === "N01", String(registry.module), file);
  addCheck(checks, "provider-registry:submodule", registry.submodule === "N01.5.1", String(registry.submodule), file);
  addCheck(checks, "provider-registry:productionReadyFalse", registry.productionReady === false, String(registry.productionReady), file);

  const doctrine = registry.doctrine ?? {};
  const doctrineChecks = [
    "oracleLiteFirst",
    "postgresqlTruth",
    "airtableMirrorOnly",
    "emailPrimary",
    "whatsappUrgentOnly",
    "smsBackupOnly",
    "playwrightScoutOnly",
    "noHardcodedSecrets",
    "missingOptionalProvidersDegradeGracefully"
  ];

  for (const key of doctrineChecks) {
    addCheck(checks, `provider-registry:doctrine:${key}`, doctrine[key] === true, String(doctrine[key]), file);
  }

  const groups = registry.providerGroups ?? {};
  for (const group of requiredProviderGroups) {
    addCheck(checks, `provider-registry:group:${group}`, Boolean(groups[group]), Boolean(groups[group]) ? "found" : "missing", file);
    if (groups[group]) {
      addCheck(
        checks,
        `provider-registry:group-has-providers:${group}`,
        Array.isArray(groups[group].providers) && groups[group].providers.length > 0,
        Array.isArray(groups[group].providers) ? String(groups[group].providers.length) : "missing providers array",
        file
      );
    }
  }

  const healthRules = registry.providerHealthRules ?? {};
  const healthRuleChecks = [
    "mustReportMissingRequiredProviders",
    "optionalProviderMissingIsNotFatal",
    "candidateCoreMustNotSilentlyFail",
    "founderActionPacketOnProviderFailure",
    "candidateSafeMessageOnProviderFailure",
    "noRawProviderPayloadInCandidateResponse"
  ];

  for (const key of healthRuleChecks) {
    addCheck(checks, `provider-registry:health-rule:${key}`, healthRules[key] === true, String(healthRules[key]), file);
  }

  for (const [groupName, group] of Object.entries(groups)) {
    const providers = Array.isArray(group.providers) ? group.providers : [];
    for (const provider of providers) {
      const key = provider.key ?? "unknown_provider";
      addCheck(checks, `provider:${groupName}:${key}:has-kind`, typeof provider.kind === "string" && provider.kind.length > 0, String(provider.kind ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-mode`, typeof provider.mode === "string" && provider.mode.length > 0, String(provider.mode ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-failure-policy`, typeof provider.failurePolicy === "string" && provider.failurePolicy.length > 0, String(provider.failurePolicy ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-safe-fallback`, typeof provider.safeFallback === "string" && provider.safeFallback.length > 0, String(provider.safeFallback ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:env-required-array`, Array.isArray(provider.envRequired), Array.isArray(provider.envRequired) ? String(provider.envRequired.length) : "missing", file);
      addCheck(checks, `provider:${groupName}:${key}:env-forbidden-array`, Array.isArray(provider.envForbiddenInRepo), Array.isArray(provider.envForbiddenInRepo) ? String(provider.envForbiddenInRepo.length) : "missing", file);
    }
  }

  addCheck(
    checks,
    "provider-registry:validator-path",
    registry.validation?.validatorPath === "scripts/validators/validate-provider-health.mjs",
    String(registry.validation?.validatorPath ?? ""),
    file
  );
  addCheck(
    checks,
    "provider-registry:report-path",
    registry.validation?.reportPath === "reports/validation/provider-health-report.json",
    String(registry.validation?.reportPath ?? ""),
    file
  );

  return registry;
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
  checkEnvTemplate(checks);
  const registry = checkProviderRegistry(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "N01",
    submodule: "N01.5.2",
    validator: "validate-provider-health.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    providerGroupsChecked: requiredProviderGroups,
    registryStatus: registry?.status ?? "unavailable",
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "N01.6 - scripts/phases/Invoke-KingsmenPhase.ps1"
      : "N01.5.2 repair - fix failed checks in reports/validation/provider-health-report.json"
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
    submodule: "N01.5.2",
    validator: "validate-provider-health.mjs",
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
        file: "scripts/validators/validate-provider-health.mjs"
      }
    ],
    nextTrackerRow: "N01.5.2 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
