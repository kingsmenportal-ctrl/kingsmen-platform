#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const backup = readFileSync('scripts/backup/New-KingsmenTruthVaultBackup.ps1', 'utf8');
const restore = readFileSync('scripts/backup/Test-KingsmenTruthVaultRestore.ps1', 'utf8');

const checks = [
  ['backup rejects pg_dump failure', /pg_dump failed/.test(backup) && /\$LASTEXITCODE -ne 0/.test(backup)],
  ['backup requires a non-empty archive', /createdArchiveBytes = \(Get-Item \$backupFile\)\.Length/.test(backup) && /createdArchiveBytes -lt 1/.test(backup)],
  ['backup verifies the archive catalog with pg_restore', /pg_restore --list \$backupFile/.test(backup) && /archive catalog/.test(backup)],
  ['backup dry-run is explicitly not a successful backup', /passed = \(-not \$DryRun\)/.test(backup) && /DRY RUN ONLY/.test(backup)],
  ['full database archive declares candidate rows are included', /rawCandidateRowsIncluded = \$true/.test(backup)],
  ['archive declares personal data and no built-in encryption', /archiveContainsPersonalData = \$true/.test(backup) && /archiveEncryptionProvidedByScript = \$false/.test(backup)],
  ['archive requires encrypted restricted storage and retention controls', /encryptedStorageRequired = \$true/.test(backup) && /restrictedAccessStorageRequired = \$true/.test(backup) && /retentionPolicyRequired = \$true/.test(backup)],
  ['restore requires the source database URL', /SourceDatabaseUrl = \$env:KINGSMEN_DATABASE_URL/.test(restore) && /KINGSMEN_DATABASE_URL is required/.test(restore)],
  ['destructive restore requires explicit confirmation', /ConfirmDestructiveRestore/.test(restore) && /Destructive restore blocked/.test(restore)],
  ['destructive restore requires an explicit target host and database name', /KINGSMEN_RESTORE_DRILL_EXPECTED_HOST/.test(restore) && /KINGSMEN_RESTORE_DRILL_EXPECTED_DATABASE/.test(restore)],
  ['restore host must match the approved target and differ from source', /does not match the explicitly approved disposable restore host/.test(restore) && /Restore host must differ from the source host/.test(restore)],
  ['actual restored database name must match the approved target', /actualRestoreDatabaseName -cne \$ExpectedRestoreDatabaseName/.test(restore)],
  ['source and target are compared using PostgreSQL identity', /current_database\(\)/.test(restore) && /inet_server_addr\(\)/.test(restore) && /sourceIdentity -eq \$restoreIdentity/.test(restore)],
  ['restore blocks when source and target resolve to the same database', /Restore target resolves to the source database/.test(restore)],
  ['restore uses exit-on-error', /--exit-on-error/.test(restore)],
  ['archive catalog is checked before restore', restore.indexOf('pg_restore --list $BackupFile') < restore.indexOf('--exit-on-error')],
  ['count queries stop on SQL error', /--set=ON_ERROR_STOP=1/.test(restore) && /Count-only verification query failed/.test(restore)],
  ['invalid or missing counts fail closed', /count -notmatch '\^\\d\+\$'/.test(restore)],
  ['failed count sentinel cannot be reported as success', !restore.includes('QUERY_FAILED') && /throw "Count-only verification query failed/.test(restore)],
  ['dry-run never counts as a completed restore', /restoreExecuted = \$false/.test(restore) && /passed = \$drillPassed/.test(restore) && /DRY_RUN_PREFLIGHT_ONLY/.test(restore)],
  ['restore report keeps raw candidate rows out', /rawCandidateRowsReturned = \$false/.test(restore) && /countOnly = \$true/.test(restore)],
  ['restore report explicitly records missing row and storage parity proof', /row parity and Storage-object parity/.test(restore)]
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
