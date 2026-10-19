import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
function read(path) {
  const full = join(repoRoot, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}
function exists(path) { return existsSync(join(repoRoot, path)); }
function check(condition, name, detail) { return { name, passed: Boolean(condition), detail }; }

const requiredFiles = [
  'manifests/launch/staging-runtime-evidence-capture-v1.json',
  'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1',
  'docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md',
  'scripts/proof/prove-staging-runtime-evidence-capture.mjs',
  'reports/staging/staging-runtime-evidence-capture-proof-latest.json',
  'package.json',
  '.github/workflows/kingsmen-source-guard.yml'
];

const checks = [];
for (const path of requiredFiles) checks.push(check(exists(path), `file:${path}`, path));

const tokenChecks = {
  'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1': [
    'STAGING_RUNTIME_EVIDENCE_CAPTURE_RECORDED',
    'PENDING_STAGING_CAPTURE',
    'RunDatabaseProbe',
    'RunWebProbe',
    'PreserveExistingPassedReports',
    'rawSecretsPrinted = $false',
    'providerCredentialsPrinted = $false'
  ],
  'docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md': [
    'Staging runtime evidence capture',
    'Production ready: **false**',
    'Public launch allowed: **false**',
    'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1',
    'scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1'
  ],
  'manifests/launch/staging-runtime-evidence-capture-v1.json': [
    'kingsmen.staging-runtime-evidence-capture.v1',
    'foundation_built_pending_runtime_execution',
    'truthVaultReportMayPassOnlyAfterDatabaseProbe',
    'externalProviderReportsStayPendingUntilRealEvidenceImported'
  ],
  'package.json': [
    'staging:prove:capture',
    'staging:validate:capture',
  ],
  '.github/workflows/kingsmen-source-guard.yml': [
    'npm run staging:prove:capture',
    'npm run staging:validate:capture'
  ]
};

for (const [path, tokens] of Object.entries(tokenChecks)) {
  const content = read(path);
  for (const token of tokens) checks.push(check(content.includes(token), `token:${path}:${token}`, token));
}

let manifest = null;
try { manifest = JSON.parse(read('manifests/launch/staging-runtime-evidence-capture-v1.json')); } catch { manifest = null; }
checks.push(check(manifest?.productionReady === false, 'manifest_production_false', String(manifest?.productionReady)));
checks.push(check(manifest?.publicLaunchAllowed === false, 'manifest_public_launch_false', String(manifest?.publicLaunchAllowed)));
checks.push(check(manifest?.rawSecretsAllowedInReports === false, 'manifest_no_raw_secrets', String(manifest?.rawSecretsAllowedInReports)));
checks.push(check(manifest?.rawCandidateDataAllowedInReports === false, 'manifest_no_raw_candidate_data', String(manifest?.rawCandidateDataAllowedInReports)));

let proof = null;
try { proof = JSON.parse(read('reports/staging/staging-runtime-evidence-capture-proof-latest.json')); } catch { proof = null; }
checks.push(check(proof?.passed === true, 'proof_passed', String(proof?.passed)));
checks.push(check(proof?.status === 'STAGING_RUNTIME_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED', 'proof_status', String(proof?.status)));
checks.push(check(proof?.runtimeExecutionPending === true, 'proof_runtime_pending', String(proof?.runtimeExecutionPending)));

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Staging Runtime Evidence Capture',
  status: failed.length === 0 ? 'STAGING_RUNTIME_EVIDENCE_CAPTURE_VALIDATED' : 'STAGING_RUNTIME_EVIDENCE_CAPTURE_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  STAGING_RUNTIME_EVIDENCE_CAPTURE_REQUIRED: true,
  failed_checks: failed,
  checks,
  generated_at: new Date().toISOString(),
  next_action: 'Run scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1 in staging, then complete remaining provider-specific runtime reports.'
};

const out = join(repoRoot, 'reports/staging/staging-runtime-evidence-capture-validation-latest.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
