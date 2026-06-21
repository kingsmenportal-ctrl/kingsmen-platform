#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  isPlaceholderValue,
  parseFlags,
  redactedPreview,
  resolveRepoRoot,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const reportPath = flags.getAll(['report-path', 'reportpath'], 'reports/jarvis/jarvis-credential-readiness-latest.json');
const envFiles = process.argv.slice(2).flatMap((arg, index, args) => {
  const lower = arg.toLowerCase();
  if (lower === '-envfile' || lower === '--envfile' || lower === '-env-file' || lower === '--env-file') return args[index + 1] ? [args[index + 1]] : [];
  if (lower.startsWith('-envfile=')) return [arg.slice(arg.indexOf('=') + 1)];
  if (lower.startsWith('--envfile=')) return [arg.slice(arg.indexOf('=') + 1)];
  if (lower.startsWith('-env-file=')) return [arg.slice(arg.indexOf('=') + 1)];
  if (lower.startsWith('--env-file=')) return [arg.slice(arg.indexOf('=') + 1)];
  return [];
});
const backendBaseUrl = flags.getAll(['backendbaseurl', 'backend-base-url'], '');
const redisUrl = flags.getAll(['redisurl', 'redis-url'], '');
const requireProductionCredentials = flags.has('requireproductioncredentials') || flags.has('require-production-credentials');
const noAliasDatabaseUrl = flags.has('noaliasdatabaseurl') || flags.has('no-alias-database-url');

function importEnvFile(relativePath) {
  if (!relativePath || !String(relativePath).trim()) {
    return { path: relativePath, loaded: false, reason: 'empty_path', importedCount: 0 };
  }

  const resolved = path.isAbsolute(relativePath) ? relativePath : path.join(repoRoot, relativePath);
  if (!fs.existsSync(resolved)) {
    return { path: relativePath, loaded: false, reason: 'file_missing', importedCount: 0 };
  }

  const lines = fs.readFileSync(resolved, 'utf8').split(/\r?\n/);
  let importedCount = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, name, rawValue] = match;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[name] = value;
    importedCount += 1;
  }

  return { path: relativePath, loaded: true, reason: 'loaded_redacted', importedCount };
}

const envFileReports = envFiles.map(importEnvFile);

if (backendBaseUrl.trim()) process.env.KINGSMEN_BACKEND_BASE_URL = backendBaseUrl;
if (redisUrl.trim()) process.env.REDIS_URL = redisUrl;

if (!noAliasDatabaseUrl) {
  const kingsmenDb = process.env.KINGSMEN_DATABASE_URL;
  const databaseUrl = process.env.DATABASE_URL;
  if (!isPlaceholderValue(kingsmenDb) && isPlaceholderValue(databaseUrl)) process.env.DATABASE_URL = kingsmenDb;
  if (!isPlaceholderValue(databaseUrl) && isPlaceholderValue(kingsmenDb)) process.env.KINGSMEN_DATABASE_URL = databaseUrl;
}

const requirements = [
  { envName: 'KINGSMEN_DATABASE_URL', provider: 'postgresql', moduleRef: 'truth_vault', requiredForBeta: true, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'DATABASE_URL', provider: 'postgresql', moduleRef: 'truth_vault', requiredForBeta: true, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'REDIS_URL', provider: 'redis', moduleRef: 'queue_fabric', requiredForBeta: true, requiredForProduction: true, risk: 'high', secret: true },
  { envName: 'KINGSMEN_BACKEND_BASE_URL', provider: 'kingsmen-api', moduleRef: 'web_backend_boundary', requiredForBeta: true, requiredForProduction: true, risk: 'medium', secret: false },
  { envName: 'SMTP_HOST', provider: 'email', moduleRef: 'communications', requiredForBeta: false, requiredForProduction: true, risk: 'medium', secret: false },
  { envName: 'SMTP_USER', provider: 'email', moduleRef: 'communications', requiredForBeta: false, requiredForProduction: true, risk: 'medium', secret: true },
  { envName: 'SMTP_PASSWORD', provider: 'email', moduleRef: 'communications', requiredForBeta: false, requiredForProduction: true, risk: 'high', secret: true },
  { envName: 'PAYFAST_MERCHANT_ID', provider: 'payfast', moduleRef: 'payments', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'PAYFAST_MERCHANT_KEY', provider: 'payfast', moduleRef: 'payments', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'PAYFAST_PASSPHRASE', provider: 'payfast', moduleRef: 'payments', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'PAYFAST_NOTIFY_URL', provider: 'payfast', moduleRef: 'payments', requiredForBeta: false, requiredForProduction: true, risk: 'high', secret: false },
  { envName: 'PAYMENT_PROVIDER_SECRET', provider: 'payment', moduleRef: 'payments', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'STORAGE_ACCESS_KEY', provider: 'object_storage', moduleRef: 'document_vault', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'STORAGE_SECRET_KEY', provider: 'object_storage', moduleRef: 'document_vault', requiredForBeta: false, requiredForProduction: true, risk: 'critical', secret: true },
  { envName: 'STORAGE_BUCKET', provider: 'object_storage', moduleRef: 'document_vault', requiredForBeta: false, requiredForProduction: true, risk: 'medium', secret: false },
];

const selectedRequirements = requirements.filter((requirement) => requireProductionCredentials
  ? requirement.requiredForProduction
  : requirement.requiredForBeta || ['communications', 'payments', 'document_vault'].includes(requirement.moduleRef));

const checks = selectedRequirements.map((requirement) => {
  const value = process.env[requirement.envName];
  const placeholder = isPlaceholderValue(value);
  return {
    envName: requirement.envName,
    provider: requirement.provider,
    moduleRef: requirement.moduleRef,
    status: placeholder ? 'PLACEHOLDER_REJECTED' : 'PRESENT_REDACTED',
    requiredForBeta: Boolean(requirement.requiredForBeta),
    requiredForProduction: Boolean(requirement.requiredForProduction),
    risk: requirement.risk,
    secret: Boolean(requirement.secret),
    valuePrinted: false,
    redactedPreview: redactedPreview(value),
  };
});

const moduleRefs = [...new Set(selectedRequirements.map((requirement) => requirement.moduleRef))].sort();
const modules = moduleRefs.map((moduleRef) => {
  const moduleChecks = checks.filter((check) => check.moduleRef === moduleRef);
  const presentCount = moduleChecks.filter((check) => check.status === 'PRESENT_REDACTED').length;
  const placeholderCount = moduleChecks.filter((check) => check.status === 'PLACEHOLDER_REJECTED').length;
  const ready = presentCount === moduleChecks.length && placeholderCount === 0;
  return {
    moduleRef,
    requiredCount: moduleChecks.length,
    presentCount,
    missingCount: moduleChecks.length - presentCount,
    placeholderCount,
    readyForStagingProof: ready,
    readyForLiveAfterApproval: ready,
  };
});

const allReady = modules.every((module) => module.readyForStagingProof === true);
const report = {
  schema: 'kingsmen.jarvis-credential-activation-report.v1',
  module: 'Jarvis Credential Activation Readiness',
  status: allReady ? 'JARVIS_CREDENTIAL_ACTIVATION_READY_FOR_STAGING_PROOF' : 'JARVIS_CREDENTIAL_ACTIVATION_PENDING_CREDENTIALS',
  passed: allReady,
  productionReady: false,
  publicLaunchAllowed: false,
  rawSecretsPrinted: false,
  rawConnectionStringsPrinted: false,
  jarvisMayStoreSecrets: false,
  credentialsAddedToGit: false,
  placeholderValuesAccepted: false,
  envFilesLoaded: envFileReports,
  databaseUrlAliasedInProcess: !noAliasDatabaseUrl,
  backendBaseUrlInjectedInProcess: Boolean(backendBaseUrl.trim()),
  redisUrlInjectedInProcess: Boolean(redisUrl.trim()),
  checks,
  modules,
  generatedAt: utcNowIso(),
  nextAction: allReady
    ? 'Run staging proofs for communications, PayFast, observability, storage, and final evidence before live activation.'
    : 'Replace placeholders outside Git, rerun Jarvis credential readiness, then run module staging proofs.',
};

const output = writeJsonFile(path.join(repoRoot, reportPath), report);
process.stdout.write(output);
if (!allReady) process.exit(1);
