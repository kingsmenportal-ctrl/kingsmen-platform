#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/ops/backup-restore-validation-latest.json');

function rel(path) {
  return join(repoRoot, path);
}

function read(path) {
  return readFileSync(rel(path), 'utf8');
}

function exists(path) {
  return existsSync(rel(path));
}

const requiredTokens = new Map([
  ['package.json', ['backup:prove:restore', 'backup:validate:restore']],
  ['.gitignore', ['.local/backups', 'backups/', '*.dump', '*.backup']],
  ['manifests/ops/backup-restore-proof-v1.json', ['backup-restore-proof-v1', 'foundation_built_pending_staging_drill', 'restoreTargetMustDifferFromSource', 'backupStorageAllowedInGit']],
  ['docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md', ['pg_dump', 'pg_restore', 'RPO', 'RTO', 'Production ready: **false**']],
  ['scripts/backup/New-KingsmenTruthVaultBackup.ps1', ['KINGSMEN_DATABASE_URL', 'pg_dump', 'Get-FileHash', 'databaseUrlRedacted', 'committedToGit = $false']],
  ['scripts/backup/Test-KingsmenTruthVaultRestore.ps1', ['KINGSMEN_RESTORE_DRILL_DATABASE_URL', 'pg_restore', 'Restore target matches source database', 'countOnly = $true', 'rtoSeconds']],
  ['scripts/proof/prove-backup-restore-boundary.mjs', ['BACKUP_RESTORE_SOURCE_PROOF_PASSED', 'stagingRestoreDrillCompleted: false']],
  ['manifests/launch/kingsmen-launch-readiness-v1.json', ['backup_restore', 'backup-restore-proof-v1', 'foundation_built_pending_staging_drill']],
  ['scripts/validators/validate-kingsmen-launch-readiness.mjs', ['backup:validate:restore', 'BACKUP_RESTORE_STAGING_DRILL_REQUIRED']]
]);

const forbiddenSecretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /github_pat_[A-Za-z0-9_]{20,}/i,
  /\bsk-[A-Za-z0-9_-]{20,}/i,
  /\bservice_role_[A-Za-z0-9._-]{32,}/i,
  /\bpostgres:\/\/[^\s"']+:[^\s"']+@/i
];

const checks = [];
const failed = [];

function check(name, passed, detail, path = '') {
  const item = { name, passed, detail, path };
  checks.push(item);
  if (!passed) failed.push(item);
}

for (const [path, tokens] of requiredTokens.entries()) {
  const found = exists(path);
  check(`file_exists:${path}`, found, found ? 'found' : 'missing', path);
  if (!found) continue;

  const text = read(path);
  for (const token of tokens) {
    check(`token:${path}:${token}`, text.includes(token), text.includes(token) ? 'found' : 'missing', path);
  }

  for (const pattern of forbiddenSecretPatterns) {
    check(`secret_scan:${path}:${pattern}`, !pattern.test(text), 'no forbidden secret-like value', path);
  }
}

if (exists('manifests/ops/backup-restore-proof-v1.json')) {
  const manifest = JSON.parse(read('manifests/ops/backup-restore-proof-v1.json'));
  check('manifest_production_ready_false', manifest.productionReady === false, String(manifest.productionReady), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_public_launch_false', manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_production_data_false', manifest.productionDataAllowed === false, String(manifest.productionDataAllowed), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_no_git_backups', manifest.backupStorageAllowedInGit === false, String(manifest.backupStorageAllowedInGit), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_no_raw_rows', manifest.rawCandidateRowsAllowedInReports === false, String(manifest.rawCandidateRowsAllowedInReports), 'manifests/ops/backup-restore-proof-v1.json');
}

if (exists('reports/ops/backup-restore-proof-latest.json')) {
  const proof = JSON.parse(read('reports/ops/backup-restore-proof-latest.json'));
  check('proof_status_passed', proof.status === 'BACKUP_RESTORE_SOURCE_PROOF_PASSED', proof.status, 'reports/ops/backup-restore-proof-latest.json');
  check('proof_not_production_ready', proof.productionReady === false, String(proof.productionReady), 'reports/ops/backup-restore-proof-latest.json');
  check('proof_staging_drill_false', proof.stagingRestoreDrillCompleted === false, String(proof.stagingRestoreDrillCompleted), 'reports/ops/backup-restore-proof-latest.json');
  check('proof_no_raw_candidate_rows', proof.rawCandidateRowsReturned === false, String(proof.rawCandidateRowsReturned), 'reports/ops/backup-restore-proof-latest.json');
}

const validation = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Kingsmen Backup and Restore Proof',
  status: failed.length === 0 ? 'BACKUP_RESTORE_PROOF_VALIDATED' : 'BACKUP_RESTORE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  stagingRestoreDrillCompleted: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed_checks: failed,
  nextAction: failed.length === 0
    ? 'Run a real staging backup/restore drill and store counts-only evidence outside public artifacts before production data.'
    : 'Repair backup/restore proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(validation, null, 2));
if (!validation.passed) process.exitCode = 1;
