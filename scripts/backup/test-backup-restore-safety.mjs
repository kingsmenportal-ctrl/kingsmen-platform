#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const backup = readFileSync('scripts/backup/New-KingsmenTruthVaultBackup.ps1', 'utf8');
const restore = readFileSync('scripts/backup/Test-KingsmenTruthVaultRestore.ps1', 'utf8');
const crypto = readFileSync('scripts/backup/encrypt-backup.mjs', 'utf8');

const checks = [
  ['encryption helper uses AES-256-GCM, scrypt and authentication tag', /aes-256-gcm/.test(crypto) && /scrypt/.test(crypto) && /setAuthTag/.test(crypto)],
  ['backup requires passphrase without printing its value', /KINGSMEN_BACKUP_PASSPHRASE/.test(backup) && /Secret value is never printed/.test(backup)],
  ['backup rejects pg_dump failure', /pg_dump failed/.test(backup) && /\$LASTEXITCODE -ne 0/.test(backup)],
  ['backup requires a non-empty temporary archive', /createdArchiveBytes = \(Get-Item \$plainFile\)\.Length/.test(backup) && /createdArchiveBytes -lt 1/.test(backup)],
  ['backup validates plaintext pg_dump catalog before encryption', /pg_restore --list \$plainFile/.test(backup) && /archive catalog/.test(backup)],
  ['backup encrypts then decrypts to verify authenticated round trip', /encrypt \$plainFile \$backupFile/.test(backup) && /decrypt \$backupFile \$verifiedFile/.test(backup) && /plainHash -ne \$verifiedHash/.test(backup)],
  ['backup removes temporary plaintext and verification files', /Remove-Item -LiteralPath \$plainFile/.test(backup) && /Remove-Item -LiteralPath \$verifiedFile/.test(backup)],
  ['dry-run cannot be successful backup evidence', /passed = \(-not \$DryRun\)/.test(backup) && /DRY RUN ONLY/.test(backup)],
  ['full database archive declares candidate rows are included', /rawCandidateRowsIncluded = \$true/.test(backup)],
  ['manifest claims script encryption only after archive exists', /archiveEncryptionProvidedByScript = \$true/.test(backup) && /encryptionAuthenticated = \$archiveExists/.test(backup)],
  ['restore decrypts and authenticates encrypted archive before catalog check', /decrypt \$BackupFile/.test(restore) && /encryptedArchiveAuthenticatedBeforeRestore/.test(restore)],
  ['restore cleanup trap removes decrypted temporary archive', /trap \{/.test(restore) && /Remove-Item -LiteralPath \$decryptedTempFile/.test(restore)],
  ['restore requires source database URL', /SourceDatabaseUrl = \$env:KINGSMEN_DATABASE_URL/.test(restore) && /KINGSMEN_DATABASE_URL is required/.test(restore)],
  ['destructive restore requires explicit confirmation', /ConfirmDestructiveRestore/.test(restore) && /Destructive restore blocked/.test(restore)],
  ['destructive restore requires explicit target host and database name', /KINGSMEN_RESTORE_DRILL_EXPECTED_HOST/.test(restore) && /KINGSMEN_RESTORE_DRILL_EXPECTED_DATABASE/.test(restore)],
  ['restore uses PostgreSQL identity and exit-on-error', /current_database\(\)/.test(restore) && /inet_server_addr\(\)/.test(restore) && /--exit-on-error/.test(restore)],
  ['count queries stop on SQL error and invalid counts fail closed', /--set=ON_ERROR_STOP=1/.test(restore) && /Count-only verification query failed/.test(restore) && /count -notmatch '\^\\d\+\$'/.test(restore)],
  ['dry-run never counts as completed restore', /restoreExecuted = \$false/.test(restore) && /passed = \$drillPassed/.test(restore) && /DRY_RUN_PREFLIGHT_ONLY/.test(restore)],
  ['restore report keeps raw candidate rows out and records parity limits', /rawCandidateRowsReturned = \$false/.test(restore) && /row parity and Storage-object parity/.test(restore)]
];

const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log((passed ? 'PASS ' : 'FAIL ') + name);
console.log(JSON.stringify({
  schema: 'kingsmen.backup-restore-safety-tests.v1',
  status: failures.length === 0 ? 'PASSED' : 'FAILED',
  passed: failures.length === 0,
  passedChecks: checks.length - failures.length,
  totalChecks: checks.length,
  failedChecks: failures.map(([name]) => name),
  liveDatabaseTouched: false
}, null, 2));
assert.equal(failures.length, 0, 'Backup/restore safety regression checks must all pass.');
