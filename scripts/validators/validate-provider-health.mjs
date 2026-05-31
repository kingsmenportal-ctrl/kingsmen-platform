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
  "n8n",
  "playwright",
  "ai"
];

const requiredEnvTokens = [
  "KINGSMEN_PRODUCTION_READY=false",
  "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
  "KINGSMEN_ORACLE_LITE_MODE=true",
  "KINGSMEN_DOCKER_COMPOSE_FIRST=true",
  "KINGSMEN_LOW_CONCURRENCY_MODE=true",
  "KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
  "KINGSMEN_READY_CAP_TARGET=1000",
  "KINGSMEN_PREPARE_CAP_TARGET=5000",
  "KINGSMEN_EMAIL_PRIMARY=true",
  "KINGSMEN_WHATSAPP_URGENT_ONLY=true",
  "KINGSMEN_SMS_BACKUP_ONLY=true",
  "KINGSMEN_BULK_WHATSAPP_ALLOWED=false",
  "KINGSMEN_BULK_SMS_ALLOWED=false",
  "KINGSMEN_ROUTINE_WHATSAPP_ALLOWED=false",
  "EMAIL_PROVIDER=no_send",
  "SMTP_PASSWORD=",
  "WHATSAPP_PROVIDER=disabled",
  "WHATSAPP_TOKEN=",
  "WHATSAPP_URGENT_TEMPLATE_ONLY=true",
  "SMS_PROVIDER=disabled",
  "SMS_API_KEY=",
  "SMS_BACKUP_ONLY=true",
  "DATABASE_PROVIDER=postgres",
  "DATABASE_URL=",
  "POSTGRES_PASSWORD=",
  "REDIS_URL=redis://localhost:6379",
  "REDIS_PASSWORD=",
  "SUPABASE_SERVICE_ROLE=",
  "SUPABASE_RLS_REQUIRED=true",
  "PAYMENT_PROVIDER=manual_eft_proof",
  "MANUAL_EFT_ENABLED=true",
  "MANUAL_PAYMENT_PROOF_REVIEW_REQUIRED=true",
  "PAYMENT_PROVIDER_SECRET_KEY=",
  "PAYMENT_SUCCESS_WEBHOOK_SECRET=",
  "AIRTABLE_ENABLED=false",
  "AIRTABLE_TOKEN=",
  "AIRTABLE_MIRROR_ONLY=true",
  "N8N_ENABLED=false",
  "N8N_WEBHOOK_SECRET=",
  "N8N_THIN_WRAPPER_ONLY=true",
  "PLAYWRIGHT_ENABLED=false",
  "PLAYWRIGHT_SCOUT_NOT_CRUTCH=true",
  "PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED=false",
  "PLAYWRIGHT_OTP_BYPASS_ALLOWED=false",
  "PLAYWRIGHT_MAP_FALLBACK_ON_BLOCK=true",
  "POPIA_MODE=true",
  "FOUNDER_MFA_REQUIRED=true",
  "SECRETS_IN_GIT_ALLOWED=false"
];

const blockedSecretAssignments = [
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "REDIS_PASSWORD",
  "SUPABASE_SERVICE_ROLE",
  "SMTP_PASSWORD",
  "WHATSAPP_TOKEN",
  "SMS_API_KEY",
  "PAYMENT_PROVIDER_SECRET_KEY",
  "PAYMENT_SUCCESS_WEBHOOK_SECRET",
  "AIRTABLE_TOKEN",
  "N8N_WEBHOOK_SECRET"
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

function parseEnv(content) {
  const env = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    env.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return env;
}

function checkRequiredFiles(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, exists(file), exists(file) ? "found" : "missing", file);
  }
}

function checkForbiddenContent(checks) {
  const forbiddenPatterns = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "productionReadyEnvTrue", pattern: /^\s*KINGSMEN_PRODUCTION_READY\s*=\s*true\s*$/im },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
    { name: "todoMarker", pattern: /\bTODO\b/i },
    { name: "fixmeMarker", pattern: /\bFIXME\b/i }
  ];

  for (const file of requiredFiles) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const item of forbiddenPatterns) {
      const passed = !item.pattern.test(content);
      addCheck(checks, `forbidden:${file}:${item.name}`, passed, passed ? "not found" : "forbidden content found", file);
    }
  }
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!exists(file)) return null;

  const content = read(file);
  const env = parseEnv(content);

  for (const token of requiredEnvTokens) {
    addCheck(
      checks,
      `env-template:contains:${token}`,
      content.includes(token),
      content.includes(token) ? "found" : "missing",
      file
    );
  }

  for (const key of blockedSecretAssignments) {
    const value = env.get(key);
    const safeEmpty = value === undefined || value === "";
    addCheck(
      checks,
      `env-template:secret-empty:${key}`,
      safeEmpty,
      safeEmpty ? "empty or absent" : "secret-like value present",
      file
    );
  }

  addCheck(checks, "env-template:email-provider-no-send", env.get("EMAIL_PROVIDER") === "no_send", String(env.get("EMAIL_PROVIDER") ?? ""), file);
  addCheck(checks, "env-template:payment-provider-manual-proof", env.get("PAYMENT_PROVIDER") === "manual_eft_proof", String(env.get("PAYMENT_PROVIDER") ?? ""), file);
  addCheck(checks, "env-template:oracle-lite-target", env.get("KINGSMEN_DEFAULT_DEPLOY_TARGET") === "oracle_lite", String(env.get("KINGSMEN_DEFAULT_DEPLOY_TARGET") ?? ""), file);

  return env;
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
  addCheck(checks, "provider-registry:report-path", registry.reportPath === "reports/validation/provider-health-report.json", String(registry.reportPath ?? ""), file);

  const doctrine = registry.doctrine ?? {};
  const doctrineChecks = [
    "oracleLiteFirst",
    "dockerComposeFirst",
    "postgresqlTruth",
    "redisPrivateQueue",
    "airtableMirrorOnly",
    "n8nThinWrapperOnly",
    "emailPrimary",
    "whatsappUrgentOnly",
    "smsBackupOnly",
    "playwrightScoutOnly",
    "manualMapFallbackRequired",
    "noHardcodedSecrets",
    "missingOptionalProvidersDegradeGracefully",
    "productionReadyMustRemainFalse"
  ];

  for (const key of doctrineChecks) {
    addCheck(checks, `provider-registry:doctrine:${key}`, doctrine[key] === true, String(doctrine[key]), file);
  }

  const globalRules = registry.globalRules ?? {};
  const globalRuleChecks = [
    "secretsInGitAllowed:false",
    "serviceRoleInBrowserAllowed:false",
    "rawCardDataAllowed:false",
    "rawDocumentsInApiResponsesAllowed:false",
    "rawEvidenceInApiResponsesAllowed:false",
    "providerCredentialsCanBeSwappedWithoutRebuild:true",
    "candidateCoreMustRemainSafeWhenOptionalProvidersMissing:true"
  ];

  for (const rule of globalRuleChecks) {
    const [key, expectedRaw] = rule.split(":");
    const expected = expectedRaw === "true";
    addCheck(checks, `provider-registry:global-rule:${key}`, globalRules[key] === expected, String(globalRules[key]), file);
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

  for (const [groupName, group] of Object.entries(groups)) {
    const providers = Array.isArray(group.providers) ? group.providers : [];
    for (const provider of providers) {
      const key = provider.key ?? "unknown_provider";
      addCheck(checks, `provider:${groupName}:${key}:has-kind`, typeof provider.kind === "string" && provider.kind.length > 0, String(provider.kind ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-mode`, typeof provider.mode === "string" && provider.mode.length > 0, String(provider.mode ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-failure-policy`, typeof provider.failurePolicy === "string" && provider.failurePolicy.length > 0, String(provider.failurePolicy ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:has-safe-fallback`, typeof provider.safeFallback === "string" && provider.safeFallback.length > 0, String(provider.safeFallback ?? ""), file);
      addCheck(checks, `provider:${groupName}:${key}:env-required-array`, Array.isArray(provider.envRequired), Array.isArray(provider.envRequired) ? String(provider.envRequired.length) : "missing", file);
      addCheck(checks, `provider:${groupName}:${key}:secret-env-array`, Array.isArray(provider.secretEnvNames), Array.isArray(provider.secretEnvNames) ? String(provider.secretEnvNames.length) : "missing", file);
      addCheck(checks, `provider:${groupName}:${key}:candidate-risk`, typeof provider.candidateDataRisk === "string" && provider.candidateDataRisk.length > 0, String(provider.candidateDataRisk ?? ""), file);
    }
  }

  const healthValidation = registry.healthValidation ?? {};
  addCheck(checks, "provider-registry:health-validator", healthValidation.validator === "scripts/validators/validate-provider-health.mjs", String(healthValidation.validator ?? ""), file);
  addCheck(checks, "provider-registry:health-report-path", healthValidation.reportPath === "reports/validation/provider-health-report.json", String(healthValidation.reportPath ?? ""), file);
  addCheck(checks, "provider-registry:must-pass-before-production", healthValidation.mustPassBeforeProduction === true, String(healthValidation.mustPassBeforeProduction), file);
  addCheck(checks, "provider-registry:allowed-missing-array", Array.isArray(healthValidation.allowedMissingAtLaunch), Array.isArray(healthValidation.allowedMissingAtLaunch) ? String(healthValidation.allowedMissingAtLaunch.length) : "missing", file);
  addCheck(checks, "provider-registry:required-local-array", Array.isArray(healthValidation.mustNotBeMissingForLocalRuntime), Array.isArray(healthValidation.mustNotBeMissingForLocalRuntime) ? String(healthValidation.mustNotBeMissingForLocalRuntime.length) : "missing", file);

  addCheck(checks, "provider-registry:next-tracker-row", registry.nextTrackerRow === "N01.5.2 - scripts/validators/validate-provider-health.mjs", String(registry.nextTrackerRow ?? ""), file);

  return registry;
}

function checkRegistryEnvCompatibility(checks, registry, env) {
  if (!registry || !env) return;
  const file = "config/providers/provider-registry.json";
  const groups = registry.providerGroups ?? {};
  for (const [groupName, group] of Object.entries(groups)) {
    const providers = Array.isArray(group.providers) ? group.providers : [];
    for (const provider of providers) {
      const key = provider.key ?? "unknown_provider";
      const required = Array.isArray(provider.envRequired) ? provider.envRequired : [];
      for (const envKey of required) {
        addCheck(
          checks,
          `provider-env:${groupName}:${key}:${envKey}`,
          env.has(envKey),
          env.has(envKey) ? "present in env template" : "missing from env template",
          file
        );
      }
    }
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
  const env = checkEnvTemplate(checks);
  const registry = checkProviderRegistry(checks);
  checkRegistryEnvCompatibility(checks, registry, env);

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
