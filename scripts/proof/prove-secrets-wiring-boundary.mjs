#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'reports/security/secrets-wiring-proof-latest.json');
const checks = [];
const failed = [];

function full(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(full(rel), 'utf8').replace(/^\uFEFF/, '');
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

function check(name, passed, detail = '') {
  const row = { name, passed, detail };
  checks.push(row);
  if (!passed) failed.push(row);
}

const requiredFiles = [
  'manifests/credentials/credentials.registry.json',
  'manifests/credentials/secrets-wiring-proof-v1.json',
  '.env.example',
  '.gitignore',
  'docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md',
  'scripts/security/Test-KingsmenSecretWiring.ps1'
];

for (const file of requiredFiles) {
  check(`file_exists:${file}`, fs.existsSync(full(file)), file);
}

if (fs.existsSync(full('manifests/credentials/credentials.registry.json'))) {
  const registry = readJson('manifests/credentials/credentials.registry.json');
  check('credential_registry_schema', registry.schema === 'kingsmen.credentials-registry.v1', registry.schema);
  check('credential_registry_has_secret_policy', Boolean(registry.secret_policy), 'secret_policy');
  check('raw_secrets_in_repo_false', registry.secret_policy?.raw_secrets_in_repo === false, String(registry.secret_policy?.raw_secrets_in_repo));
  check('raw_secrets_in_chat_false', registry.secret_policy?.raw_secrets_in_chat === false, String(registry.secret_policy?.raw_secrets_in_chat));
  check('openclaw_raw_secret_access_false', registry.secret_policy?.openclaw_raw_secret_access === false, String(registry.secret_policy?.openclaw_raw_secret_access));
  check('browser_service_role_access_false', registry.secret_policy?.browser_service_role_access === false, String(registry.secret_policy?.browser_service_role_access));
  check('credential_entries_present', Array.isArray(registry.credentials) && registry.credentials.length >= 10, String(registry.credentials?.length ?? 0));

  const names = new Set((registry.credentials ?? []).map((item) => item.credential_name));
  for (const name of ['DATABASE_URL', 'REDIS_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'PAYMENT_PROVIDER_SECRET', 'STORAGE_ACCESS_KEY']) {
    check(`credential_named:${name}`, names.has(name), name);
  }

  for (const item of registry.credentials ?? []) {
    check(`credential_has_no_value:${item.credential_name}`, !Object.prototype.hasOwnProperty.call(item, 'value') && !Object.prototype.hasOwnProperty.call(item, 'secret') && !Object.prototype.hasOwnProperty.call(item, 'tokenValue'), item.credential_name);
    check(`credential_not_visible_to_openclaw:${item.credential_name}`, item.visible_to_openclaw === false, item.credential_name);
  }
}

if (fs.existsSync(full('.env.example'))) {
  const env = read('.env.example');
  for (const name of ['KINGSMEN_BACKEND_BASE_URL', 'KINGSMEN_DATABASE_URL', 'DATABASE_URL', 'REDIS_URL', 'SMTP_PASSWORD', 'PAYMENT_PROVIDER_SECRET', 'STORAGE_ACCESS_KEY']) {
    check(`env_example_contains:${name}`, env.includes(`${name}=`), name);
  }
  const nonCommentAssignments = env
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'));
  const assignedRealValues = nonCommentAssignments.filter((line) => {
    const index = line.indexOf('=');
    if (index < 0) return false;
    const value = line.slice(index + 1).trim();
    if (!value) return false;
    return !['development', 'local', 'memory', 'false', '8080', '15000', 'payfast_sandbox'].includes(value);
  });
  check('env_example_empty_placeholders_only', assignedRealValues.length === 0, assignedRealValues.join(', '));
}

if (fs.existsSync(full('.gitignore'))) {
  const ignore = read('.gitignore');
  for (const token of ['.env', '.env.*', '!.env.example', '*.dump', '*.backup']) {
    check(`gitignore_contains:${token}`, ignore.includes(token), token);
  }
}

if (fs.existsSync(full('manifests/credentials/secrets-wiring-proof-v1.json'))) {
  const manifest = readJson('manifests/credentials/secrets-wiring-proof-v1.json');
  check('manifest_schema', manifest.schema === 'kingsmen.secrets-wiring-proof.v1', manifest.schema);
  check('manifest_production_false', manifest.productionReady === false, String(manifest.productionReady));
  check('manifest_public_launch_false', manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed));
  check('manifest_live_secrets_committed_false', manifest.liveSecretsCommitted === false, String(manifest.liveSecretsCommitted));
  check('manifest_raw_reports_false', manifest.rawSecretsInReportsAllowed === false, String(manifest.rawSecretsInReportsAllowed));
}

const forbiddenSecretPatterns = [
  /postgres:\/\/[^\s"']+/i,
  /redis:\/\/[^\s"']+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /github_pat_[A-Za-z0-9_]{20,}/i,
  /\bsk-[A-Za-z0-9_-]{20,}/i,
  /\b(PAYFAST_PASSPHRASE|PAYFAST_MERCHANT_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i
];

for (const file of requiredFiles.filter((file) => fs.existsSync(full(file)))) {
  const text = read(file);
  for (const pattern of forbiddenSecretPatterns) {
    check(`no_secret_pattern:${file}:${pattern}`, !pattern.test(text), file);
  }
}

const passed = failed.length === 0;
const report = {
  schema: 'kingsmen.secrets-wiring-proof-report.v1',
  module: 'Secrets Wiring Proof',
  status: passed ? 'SECRETS_WIRING_SOURCE_PROOF_PASSED' : 'SECRETS_WIRING_SOURCE_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  rawSecretsPrinted: false,
  liveSecretsCommitted: false,
  runtimeSecretHealthProofPending: true,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: passed ? 'Run scripts/security/Test-KingsmenSecretWiring.ps1 in staging/Oracle with real env vars configured outside Git.' : 'Repair secrets wiring source boundary.'
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
