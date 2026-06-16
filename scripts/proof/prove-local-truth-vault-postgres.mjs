import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'scripts/staging/Start-KingsmenLocalTruthVault.ps1',
  'docs/ops/KINGSMEN_LOCAL_TRUTH_VAULT_POSTGRES.md',
  'manifests/ops/local-truth-vault-postgres-v1.json',
  'scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1'
];

const requiredTokens = [
  ['scripts/staging/Start-KingsmenLocalTruthVault.ps1', 'LOCAL_TRUTH_VAULT_POSTGRES_READY'],
  ['scripts/staging/Start-KingsmenLocalTruthVault.ps1', '.local/kingsmen.local-postgres.env'],
  ['scripts/staging/Start-KingsmenLocalTruthVault.ps1', 'databaseUrlPrinted = $false'],
  ['scripts/staging/Start-KingsmenLocalTruthVault.ps1', 'rawSecretsPrinted = $false'],
  ['scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1', 'DOCKER_POSTGRES_SELECT_1_OK'],
  ['scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1', 'Import-LocalRuntimeEnv'],
  ['docs/ops/KINGSMEN_LOCAL_TRUTH_VAULT_POSTGRES.md', 'Local Truth Vault PostgreSQL'],
  ['docs/ops/KINGSMEN_LOCAL_TRUTH_VAULT_POSTGRES.md', 'Production ready: **false**'],
  ['manifests/ops/local-truth-vault-postgres-v1.json', 'foundation_built_local_only_pending_runtime_start'],
  ['manifests/ops/local-truth-vault-postgres-v1.json', 'minimumPassedReportsAfterLocalDbAndWeb']
];

const checks = [];
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(root, file));
  checks.push({ name: `file_exists:${file}`, passed: exists, detail: file });
}

for (const [file, token] of requiredTokens) {
  const fullPath = path.join(root, file);
  const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  checks.push({ name: `token:${file}:${token}`, passed: content.includes(token), detail: token });
}

const gitignore = fs.existsSync(path.join(root, '.gitignore')) ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
checks.push({ name: 'gitignore:.local', passed: gitignore.includes('.local/'), detail: '.local/' });
checks.push({ name: 'gitignore:reports', passed: gitignore.includes('reports/**/*.json'), detail: 'reports/**/*.json' });

const failed = checks.filter((check) => !check.passed);
const report = {
  schema: 'kingsmen.local-truth-vault-postgres-proof.v1',
  module: 'Local Truth Vault PostgreSQL',
  status: failed.length === 0 ? 'LOCAL_TRUTH_VAULT_POSTGRES_SOURCE_PROOF_PASSED' : 'LOCAL_TRUTH_VAULT_POSTGRES_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  localOnly: true,
  rawSecretsPrinted: false,
  databaseUrlPrinted: false,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: 'Run Start-KingsmenLocalTruthVault.ps1 locally, load .local env, start API, then run staging evidence capture.'
};

fs.mkdirSync(path.join(root, 'reports/ops'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/ops/local-truth-vault-postgres-proof-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);
