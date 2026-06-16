import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const requiredFiles = [
  'manifests/launch/staging-runtime-evidence-capture-v1.json',
  'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1',
  'docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md'
];

const requiredTokens = {
  'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1': [
    'STAGING_RUNTIME_EVIDENCE_CAPTURE_RECORDED',
    'RunDatabaseProbe',
    'RunWebProbe',
    'rawSecretsPrinted = $false',
    'rawCandidateDataPrinted = $false',
    'providerCredentialsPrinted = $false',
    'reports/staging/truth-vault-persistence-staging-latest.json',
    'reports/repo/main-branch-protection-apply-latest.json'
  ],
  'manifests/launch/staging-runtime-evidence-capture-v1.json': [
    'kingsmen.staging-runtime-evidence-capture.v1',
    'foundation_built_pending_runtime_execution',
    'rawSecretsAllowedInReports',
    'truthVaultReportMayPassOnlyAfterDatabaseProbe'
  ],
  'docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md': [
    'Staging runtime evidence capture',
    'Production ready: **false**',
    'npm run staging:capture:evidence',
    'npm run final:collect:evidence'
  ]
};

function read(path) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

const checks = [];
for (const path of requiredFiles) {
  checks.push({ name: `file:${path}`, passed: existsSync(join(repoRoot, path)), detail: path });
}
for (const [path, tokens] of Object.entries(requiredTokens)) {
  const content = existsSync(join(repoRoot, path)) ? read(path) : '';
  for (const token of tokens) {
    checks.push({ name: `token:${path}:${token}`, passed: content.includes(token), detail: token });
  }
}

const manifest = JSON.parse(read('manifests/launch/staging-runtime-evidence-capture-v1.json'));
checks.push({ name: 'manifest_production_false', passed: manifest.productionReady === false, detail: String(manifest.productionReady) });
checks.push({ name: 'manifest_public_launch_false', passed: manifest.publicLaunchAllowed === false, detail: String(manifest.publicLaunchAllowed) });
checks.push({ name: 'manifest_no_raw_secret_reports', passed: manifest.rawSecretsAllowedInReports === false, detail: String(manifest.rawSecretsAllowedInReports) });
checks.push({ name: 'manifest_no_raw_candidate_reports', passed: manifest.rawCandidateDataAllowedInReports === false, detail: String(manifest.rawCandidateDataAllowedInReports) });

const failed = checks.filter((check) => !check.passed);
const report = {
  schema: 'kingsmen.staging-runtime-evidence-capture-proof-report.v1',
  module: 'Staging Runtime Evidence Capture Proof',
  status: failed.length === 0 ? 'STAGING_RUNTIME_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED' : 'STAGING_RUNTIME_EVIDENCE_CAPTURE_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  runtimeExecutionPending: true,
  rawSecretsPrinted: false,
  rawCandidateDataPrinted: false,
  providerCredentialsPrinted: false,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: 'Run the PowerShell staging evidence capture runner in staging, then complete missing provider-specific proof reports.'
};

const out = join(repoRoot, 'reports/staging/staging-runtime-evidence-capture-proof-latest.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
