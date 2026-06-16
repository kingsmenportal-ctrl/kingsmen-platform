#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'reports/security/secrets-wiring-validation-latest.json');
const failures = [];
const checks = [];

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
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
}

const requiredFiles = [
  'manifests/credentials/credentials.registry.json',
  'manifests/credentials/secrets-wiring-proof-v1.json',
  '.env.example',
  '.gitignore',
  'docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md',
  'scripts/security/Test-KingsmenSecretWiring.ps1',
  'scripts/proof/prove-secrets-wiring-boundary.mjs',
  'reports/security/secrets-wiring-proof-latest.json',
  'package.json',
  'docs/launch/KINGSMEN_LAUNCH_READINESS.md',
  'manifests/launch/kingsmen-launch-readiness-v1.json',
  'scripts/validators/validate-kingsmen-launch-readiness.mjs'
];

for (const file of requiredFiles) {
  check(`file_exists:${file}`, fs.existsSync(full(file)), file);
  if (fs.existsSync(full(file))) check(`file_nonempty:${file}`, fs.statSync(full(file)).size > 0, file);
}

const tokenChecks = {
  'manifests/credentials/secrets-wiring-proof-v1.json': [
    'kingsmen.secrets-wiring-proof.v1',
    'foundation_built_pending_runtime_secret_health_proof',
    'rawSecretsInReportsAllowed',
    'runtimeHealthRules',
    'DATABASE_URL',
    'REDIS_URL'
  ],
  '.env.example': [
    'KINGSMEN_BACKEND_BASE_URL=',
    'KINGSMEN_DATABASE_URL=',
    'DATABASE_URL=',
    'REDIS_URL=',
    'SMTP_PASSWORD=',
    'PAYMENT_PROVIDER_SECRET=',
    'STORAGE_ACCESS_KEY='
  ],
  '.gitignore': [
    '.env',
    '.env.*',
    '!.env.example',
    '*.dump',
    '*.backup'
  ],
  'docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md': [
    'No raw secrets in Git',
    'Test-KingsmenSecretWiring.ps1',
    'reports/security/secrets-wiring-runtime-health-latest.json',
    'npm run secrets:validate:wiring'
  ],
  'scripts/security/Test-KingsmenSecretWiring.ps1': [
    'MASKED_RUNTIME_SECRET_HEALTH_REPORTED',
    'rawSecretsPrinted = $false',
    'connectionStringsPrinted = $false',
    'valuePrinted = $false'
  ],
  'scripts/proof/prove-secrets-wiring-boundary.mjs': [
    'SECRETS_WIRING_SOURCE_PROOF_PASSED',
    'env_example_empty_placeholders_only',
    'credential_has_no_value',
    'runtimeSecretHealthProofPending: true'
  ],
  'package.json': [
    'secrets:prove:wiring',
    'secrets:validate:wiring'
  ],
  'docs/launch/KINGSMEN_LAUNCH_READINESS.md': [
    'secrets wiring',
    'npm run secrets:validate:wiring'
  ],
  'manifests/launch/kingsmen-launch-readiness-v1.json': [
    'secrets_wiring',
    'secrets-wiring-proof-v1'
  ],
  'scripts/validators/validate-kingsmen-launch-readiness.mjs': [
    'secrets:validate:wiring',
    'SECRETS_RUNTIME_HEALTH_PROOF_REQUIRED'
  ]
};

for (const [file, tokens] of Object.entries(tokenChecks)) {
  if (!fs.existsSync(full(file))) continue;
  const text = read(file);
  for (const token of tokens) {
    check(`token:${file}:${token}`, text.includes(token), token);
  }
}

if (fs.existsSync(full('manifests/credentials/secrets-wiring-proof-v1.json'))) {
  const manifest = readJson('manifests/credentials/secrets-wiring-proof-v1.json');
  check('manifest_production_false', manifest.productionReady === false, String(manifest.productionReady));
  check('manifest_public_launch_false', manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed));
  check('manifest_no_live_secrets_committed', manifest.liveSecretsCommitted === false, String(manifest.liveSecretsCommitted));
  check('manifest_no_raw_report_secrets', manifest.rawSecretsInReportsAllowed === false, String(manifest.rawSecretsInReportsAllowed));
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

const proof = fs.existsSync(full('reports/security/secrets-wiring-proof-latest.json')) ? readJson('reports/security/secrets-wiring-proof-latest.json') : null;
if (proof) {
  check('proof_passed', proof.passed === true, String(proof.passed));
  check('proof_status', proof.status === 'SECRETS_WIRING_SOURCE_PROOF_PASSED', String(proof.status));
  check('proof_no_raw_secrets_printed', proof.rawSecretsPrinted === false, String(proof.rawSecretsPrinted));
  check('proof_runtime_pending', proof.runtimeSecretHealthProofPending === true, String(proof.runtimeSecretHealthProofPending));
}

const passed = failures.length === 0;
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Secrets Wiring Proof',
  status: passed ? 'SECRETS_WIRING_PROOF_VALIDATED' : 'SECRETS_WIRING_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  rawSecretsPrinted: false,
  failed_checks: failures,
  checks,
  generated_at: new Date().toISOString(),
  next_action: passed ? 'Run the masked runtime secret health check in staging/Oracle; keep launch blocked until configured evidence exists.' : 'Repair secrets wiring proof files.'
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
