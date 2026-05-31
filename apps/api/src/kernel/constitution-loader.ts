import fs from "node:fs";
import path from "node:path";

export type KingsmenConstitutionSeverity = "blocker" | "warning";

export type KingsmenConstitutionSource =
  | "environment_template"
  | "provider_registry"
  | "creator_config"
  | "master_build_index"
  | "runtime_default";

export type KingsmenConstitutionCheck = {
  name: string;
  source: KingsmenConstitutionSource;
  severity: KingsmenConstitutionSeverity;
  passed: boolean;
  detail: string;
  file?: string;
};

export type KingsmenConstitution = {
  module: "N02";
  submodule: "N02.1";
  productionReady: false;
  loadedAt: string;
  repoRoot: string;
  checks: KingsmenConstitutionCheck[];
  blockers: KingsmenConstitutionCheck[];
  locks: {
    oracleLiteFirst: true;
    postgresqlTruth: true;
    airtableMirrorOnly: true;
    emailPrimary: true;
    whatsappUrgentOnly: true;
    smsBackupOnly: true;
    playwrightScoutOnly: true;
    allSixGatesVisibleToAllUsers: true;
    pricingControlsServiceIntensityNotCoreAccess: true;
    candidateDataSpecificConsentRequired: true;
    productionReady: false;
    activeCandidateCap: 500;
    readyCapTarget: 1000;
    prepareCapTarget: 5000;
  };
  sourceFiles: {
    environmentTemplate: string;
    providerRegistry: string;
    creatorConfig: string;
    masterBuildIndex: string;
  };
};

export class KingsmenConstitutionError extends Error {
  public readonly checks: KingsmenConstitutionCheck[];
  public readonly blockers: KingsmenConstitutionCheck[];

  constructor(message: string, checks: KingsmenConstitutionCheck[]) {
    super(message);
    this.name = "KingsmenConstitutionError";
    this.checks = checks;
    this.blockers = checks.filter((check) => check.severity === "blocker" && !check.passed);
  }
}

export type LoadKingsmenConstitutionOptions = {
  repoRoot?: string;
  now?: Date;
};

const SOURCE_FILES = {
  environmentTemplate: "config/environment/.env.template",
  providerRegistry: "config/providers/provider-registry.json",
  creatorConfig: "config/creator.config.json",
  masterBuildIndex: "manifests/master-build-index.json"
} as const;

function readText(repoRoot: string, relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson<T>(repoRoot: string, relativePath: string): T {
  return JSON.parse(readText(repoRoot, relativePath)) as T;
}

function parseEnvTemplate(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    values[key] = value;
  }

  return values;
}

function addCheck(
  checks: KingsmenConstitutionCheck[],
  check: Omit<KingsmenConstitutionCheck, "passed"> & { passed: boolean }
): void {
  checks.push(check);
}

function boolDetail(value: unknown): string {
  if (value === undefined) return "missing";
  return String(value);
}

function getByPath(source: unknown, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function assertJsonBooleanLock(
  checks: KingsmenConstitutionCheck[],
  args: {
    object: unknown;
    dottedPath: string;
    expected: boolean;
    source: KingsmenConstitutionSource;
    file: string;
    name: string;
  }
): void {
  const actual = getByPath(args.object, args.dottedPath);
  addCheck(checks, {
    name: args.name,
    source: args.source,
    severity: "blocker",
    passed: actual === args.expected,
    detail: `${args.dottedPath}=${boolDetail(actual)}`,
    file: args.file
  });
}

function assertEnvValue(
  checks: KingsmenConstitutionCheck[],
  env: Record<string, string>,
  key: string,
  expected: string,
  sourceFile: string
): void {
  addCheck(checks, {
    name: `env:${key}`,
    source: "environment_template",
    severity: "blocker",
    passed: env[key] === expected,
    detail: `${key}=${env[key] ?? "missing"}`,
    file: sourceFile
  });
}

function assertNoProductionReadyTrue(
  checks: KingsmenConstitutionCheck[],
  file: string,
  content: string,
  source: KingsmenConstitutionSource
): void {
  const unsafe = /productionReady\s*[:=]\s*true|"productionReady"\s*:\s*true|KINGSMEN_PRODUCTION_READY\s*=\s*true/i.test(content);
  addCheck(checks, {
    name: `block:production-ready-true:${file}`,
    source,
    severity: "blocker",
    passed: !unsafe,
    detail: unsafe ? "unsafe production-ready flag found" : "safe",
    file
  });
}

function assertRequiredFiles(repoRoot: string, checks: KingsmenConstitutionCheck[]): void {
  for (const relativePath of Object.values(SOURCE_FILES)) {
    const found = fs.existsSync(path.join(repoRoot, relativePath));
    addCheck(checks, {
      name: `file:${relativePath}`,
      source: "runtime_default",
      severity: "blocker",
      passed: found,
      detail: found ? "found" : "missing",
      file: relativePath
    });
  }
}

export function loadKingsmenConstitution(options: LoadKingsmenConstitutionOptions = {}): KingsmenConstitution {
  const repoRoot = options.repoRoot ?? process.cwd();
  const now = options.now ?? new Date();
  const checks: KingsmenConstitutionCheck[] = [];

  assertRequiredFiles(repoRoot, checks);

  const missingFiles = checks.filter((check) => check.name.startsWith("file:") && !check.passed);
  if (missingFiles.length > 0) {
    throw new KingsmenConstitutionError("Kingsmen constitution boot blocked: required constitution source files are missing.", checks);
  }

  const envText = readText(repoRoot, SOURCE_FILES.environmentTemplate);
  const providerText = readText(repoRoot, SOURCE_FILES.providerRegistry);
  const creatorText = readText(repoRoot, SOURCE_FILES.creatorConfig);
  const masterText = readText(repoRoot, SOURCE_FILES.masterBuildIndex);

  assertNoProductionReadyTrue(checks, SOURCE_FILES.environmentTemplate, envText, "environment_template");
  assertNoProductionReadyTrue(checks, SOURCE_FILES.providerRegistry, providerText, "provider_registry");
  assertNoProductionReadyTrue(checks, SOURCE_FILES.creatorConfig, creatorText, "creator_config");
  assertNoProductionReadyTrue(checks, SOURCE_FILES.masterBuildIndex, masterText, "master_build_index");

  const env = parseEnvTemplate(envText);
  const providerRegistry = readJson<Record<string, unknown>>(repoRoot, SOURCE_FILES.providerRegistry);
  const creatorConfig = readJson<Record<string, unknown>>(repoRoot, SOURCE_FILES.creatorConfig);
  const masterBuildIndex = readJson<Record<string, unknown>>(repoRoot, SOURCE_FILES.masterBuildIndex);

  assertEnvValue(checks, env, "KINGSMEN_PRODUCTION_READY", "false", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_DEFAULT_DEPLOY_TARGET", "oracle_lite", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_ACTIVE_CANDIDATE_CAP", "500", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_READY_CAP_TARGET", "1000", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_PREPARE_CAP_TARGET", "5000", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_EMAIL_PRIMARY", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_WHATSAPP_URGENT_ONLY", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_SMS_BACKUP_ONLY", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_AIRTABLE_MIRROR_ONLY", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "FOUNDER_MFA_REQUIRED", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "OPERATOR_MFA_REQUIRED", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "APPEND_ONLY_AUDIT_ENABLED", "true", SOURCE_FILES.environmentTemplate);
  assertEnvValue(checks, env, "POPIA_ACCESS_LOG_ENABLED", "true", SOURCE_FILES.environmentTemplate);

  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "productionReady", expected: false, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:production-ready-false" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.oracleLiteFirst", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:oracle-lite-first" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.postgresqlTruth", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:postgresql-truth" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.airtableMirrorOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:airtable-mirror-only" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.emailPrimary", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:email-primary" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.whatsappUrgentOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:whatsapp-urgent-only" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.smsBackupOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:sms-backup-only" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.playwrightScoutOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:playwright-scout-only" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "providerHealthRules.candidateCoreMustNotSilentlyFail", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:core-must-not-silently-fail" });
  assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "providerHealthRules.founderActionPacketOnProviderFailure", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:founder-action-packet-on-failure" });

  assertJsonBooleanLock(checks, { object: creatorConfig, dottedPath: "productionReady", expected: false, source: "creator_config", file: SOURCE_FILES.creatorConfig, name: "creator:production-ready-false" });
  assertJsonBooleanLock(checks, { object: creatorConfig, dottedPath: "proofDoctrine.trackerIsBuildStatusAuthority", expected: true, source: "creator_config", file: SOURCE_FILES.creatorConfig, name: "creator:tracker-authority" });
  assertJsonBooleanLock(checks, { object: creatorConfig, dottedPath: "proofDoctrine.noValidatorWithoutReport", expected: true, source: "creator_config", file: SOURCE_FILES.creatorConfig, name: "creator:validator-report-required" });
  assertJsonBooleanLock(checks, { object: creatorConfig, dottedPath: "blockedContent.hardcodedSecrets", expected: true, source: "creator_config", file: SOURCE_FILES.creatorConfig, name: "creator:block-hardcoded-secrets" });

  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "productionReady", expected: false, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:production-ready-false" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.oracleLiteFirst", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:oracle-lite-first" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.postgresqlTruth", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:postgresql-truth" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.airtableMirrorOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:airtable-mirror-only" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.emailPrimary", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:email-primary" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.whatsappUrgentOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:whatsapp-urgent-only" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.smsBackupOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:sms-backup-only" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.playwrightScoutOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:playwright-scout-only" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.allSixGatesVisibleToAllUsers", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:all-six-gates-visible" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.pricingControlsServiceIntensityNotCoreAccess", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:pricing-intensity-not-core-access" });
  assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.candidateDataNeverSharedWithoutSpecificConsent", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:candidate-specific-consent" });

  const blockers = checks.filter((check) => check.severity === "blocker" && !check.passed);
  if (blockers.length > 0) {
    throw new KingsmenConstitutionError("Kingsmen constitution boot blocked: hard locks failed.", checks);
  }

  return {
    module: "N02",
    submodule: "N02.1",
    productionReady: false,
    loadedAt: now.toISOString(),
    repoRoot,
    checks,
    blockers,
    locks: {
      oracleLiteFirst: true,
      postgresqlTruth: true,
      airtableMirrorOnly: true,
      emailPrimary: true,
      whatsappUrgentOnly: true,
      smsBackupOnly: true,
      playwrightScoutOnly: true,
      allSixGatesVisibleToAllUsers: true,
      pricingControlsServiceIntensityNotCoreAccess: true,
      candidateDataSpecificConsentRequired: true,
      productionReady: false,
      activeCandidateCap: 500,
      readyCapTarget: 1000,
      prepareCapTarget: 5000
    },
    sourceFiles: SOURCE_FILES
  };
}

export function assertKingsmenConstitutionLoaded(options: LoadKingsmenConstitutionOptions = {}): KingsmenConstitution {
  return loadKingsmenConstitution(options);
}
