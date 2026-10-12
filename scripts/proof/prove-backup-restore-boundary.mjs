#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/ops/backup-restore-proof-latest.json');

function rel(path) {
  return join(repoRoot, path);
}

function read(path) {
  return readFileSync(rel(path), 'utf8');
}

const requiredFiles = [
  'manifests/ops/backup-restore-proof-v1.json',
  'docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md',
  'scripts/backup/New-KingsmenTruthVaultBackup.ps1',
  'scripts/backup/Test-KingsmenTruthVaultRestore.ps1'
];

const checks = [];
const failed = [];

function check(name, passed, detail, evidencePath) {
  const result = { name, passed, detail, evidencePath };
  checks.push(result);
  if (!passed) failed.push(result);
}

for (const file of requiredFiles) {
  check(`file_exists:${file}`, existsSync(rel(file)), file, file);
}

if (existsSync(rel('scripts/backup/New-KingsmenTruthVaultBackup.ps1'))) {
  const backupScript = read('scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_uses_pg_dump', backupScript.includes('pg_dump'), 'pg_dump required for PostgreSQL backup', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_uses_sha256', backupScript.includes('Get-FileHash') && backupScript.includes('SHA256'), 'backup checksum required', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_redacts_database_url', backupScript.includes('databaseUrlRedacted') && backupScript.includes('Do not print'), 'database URL must be redacted', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_blocks_git_claim', backupScript.includes('committedToGit = $false'), 'backup archives cannot be committed', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_staging_only', backupScript.includes('KINGSMEN_BACKUP_ENVIRONMENT') && backupScript.includes('ExpectedProjectRef'), 'backup is restricted to an explicitly identified staging project', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_encrypted', backupScript.includes('GpgRecipient') && backupScript.includes('GPG/OpenPGP') && backupScript.includes('Remove-Item -LiteralPath $plainFile'), 'plaintext archive is encrypted then removed', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
  check('backup_external_root_required', backupScript.includes('repository-local defaults are disabled'), 'backup storage must be external to repository', 'scripts/backup/New-KingsmenTruthVaultBackup.ps1');
}

if (existsSync(rel('scripts/backup/Test-KingsmenTruthVaultRestore.ps1'))) {
  const restoreScript = read('scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_uses_pg_restore', restoreScript.includes('pg_restore'), 'pg_restore required for restore drill', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_blocks_same_target', restoreScript.includes('Source and restore URLs resolve to the same database identity') && restoreScript.includes('Restore blocked'), 'restore target identity must differ from source', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_requires_checksum', restoreScript.includes('ExpectedSha256') && restoreScript.includes('checksumMatches'), 'real restore requires independently supplied SHA-256', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_validates_archive', restoreScript.includes('pg_restore --list') && restoreScript.includes('archiveValidated'), 'archive is validated before restore', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_fails_closed', restoreScript.includes('$passed = (-not $DryRun)') && restoreScript.includes('if (-not $passed) { exit 1 }'), 'dry run and failed checks cannot report success', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_counts_only', restoreScript.includes('countOnly = $true') && restoreScript.includes('rawRowsReturned = $false'), 'restore report must use count-only verification', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
  check('restore_records_rto', restoreScript.includes('rtoSeconds'), 'restore drill must record RTO', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1');
}

if (existsSync(rel('manifests/ops/backup-restore-proof-v1.json'))) {
  const manifest = JSON.parse(read('manifests/ops/backup-restore-proof-v1.json'));
  check('manifest_key', manifest.manifestKey === 'backup-restore-proof-v1', manifest.manifestKey, 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_not_production_ready', manifest.productionReady === false, String(manifest.productionReady), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_blocks_git_backup_storage', manifest.backupStorageAllowedInGit === false, String(manifest.backupStorageAllowedInGit), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_blocks_raw_rows', manifest.rawCandidateRowsAllowedInReports === false, String(manifest.rawCandidateRowsAllowedInReports), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_requires_different_restore_target', manifest.backupStrategy?.restoreTargetMustDifferFromSource === true, String(manifest.backupStrategy?.restoreTargetMustDifferFromSource), 'manifests/ops/backup-restore-proof-v1.json');
  check('manifest_has_ten_scenarios', Array.isArray(manifest.proofScenarios) && manifest.proofScenarios.length >= 10, String(manifest.proofScenarios?.length ?? 0), 'manifests/ops/backup-restore-proof-v1.json');
}

const report = {
  schema: 'kingsmen.backup-restore-source-proof.v1',
  module: 'Kingsmen Backup and Restore Proof',
  status: failed.length === 0 ? 'BACKUP_RESTORE_SOURCE_PROOF_PASSED' : 'BACKUP_RESTORE_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  productionDataAllowed: false,
  stagingRestoreDrillCompleted: false,
  databaseUrlRedacted: true,
  rawCandidateRowsReturned: false,
  backupStorageAllowedInGit: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length === 0
    ? 'Run validate-backup-restore-proof, then perform a live staging backup/restore drill before production data.'
    : 'Repair backup/restore proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
