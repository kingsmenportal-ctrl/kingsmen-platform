# Kingsmen Backup/Restore Drill — Execution Procedure

Status: prepared, not executed. Release and public launch remain blocked until an authorized isolated restore passes.

## Preconditions / operator inputs

The authorized operator must supply/confirm:
- approval to back up staging and restore only into an isolated disposable target;
- source ref `euhubhhnumtibbyufghm` / PostgreSQL 17.11;
- source URL injected as `KINGSMEN_DATABASE_URL` and distinct restore URL injected as `KINGSMEN_RESTORE_DRILL_DATABASE_URL` through a secure environment/secret manager;
- a separate Supabase restore project/branch with known distinct identity, adequate storage/compute, owner authorization, cost approval if required, and cleanup plan;
- PowerShell 5.1+, `pg_dump`, `pg_restore`, `psql`;
- secured local/offsite encrypted storage outside the repository, access controls and retention plan;
- controlled window to prevent test writes contaminating the drill;
- accepted RPO/RTO targets, operator/reviewer names, UTC start/end.

The live branch inventory showed only `main` with `with_data=false`; that is not restore proof. Creating a branch may incur cost and is not done here.

## 1. Create backup

From repository root:

```powershell
$env:KINGSMEN_DATABASE_URL = '<secure injection; never commit or echo>'
$env:KINGSMEN_BACKUP_ROOT = 'D:\\KingsmenBackups'
.\\scripts\\backup\\New-KingsmenTruthVaultBackup.ps1
```

The script runs pg_dump custom format and writes a redacted manifest and SHA-256. Then:
- confirm archive exists, is non-zero, manifest says `BACKUP_CREATED` and size matches;
- independently run `Get-FileHash -Algorithm SHA256 <archive>` and compare;
- run `pg_restore --list <archive>`; retain non-sensitive exit result/TOC in restricted evidence;
- make encrypted offsite copy, verify copied checksum, and record storage/retention location outside Git;
- scan manifest/report for credentials and PII.

Source-level commands `npm run backup:prove:restore` and `npm run backup:validate:restore` do not create/restore a backup; they only check repository proof artifacts.

## 2. Verify source vs restore target

Set both URLs securely. Confirm in the Supabase Dashboard that the target is an isolated restore project/branch, not a production database or the only staging source. Check URL strings differ, then use the restore script's database-identity preflight (database name/server address/port) to block accidental same-target restore. An operator must independently confirm target identity because aliases can hide same-target endpoints.

## 3. Restore

```powershell
$env:KINGSMEN_DATABASE_URL = '<source URL securely injected>'
$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = '<separate restore URL securely injected>'
$backup = 'D:\\KingsmenBackups\\<timestamp>\\kingsmen-truth-vault-<timestamp>.dump'
.\\scripts\\backup\\Test-KingsmenTruthVaultRestore.ps1 -BackupFile $backup -ReportPath 'reports/ops/backup-restore-staging-drill-latest.json'
if ($LASTEXITCODE -ne 0) { throw 'Restore drill failed; preserve report and stop.' }
```

Use `pg_restore --exit-on-error --single-transaction` so a failed restore does not leave a partially restored schema. The revised script must verify archive readability, target identity, core table presence and count query success; any failure means `passed=false` and exit non-zero.

Core count-only table set: candidates, applications, idempotency_keys, command_log, workflow_runs, evidence_ledger, audit_events, dead_letter_queue, approval_requests. These are sanity checks, not a row-by-row data equivalence proof. Also compare schema/migration ledger and key catalog inventory.

## 4. Integrity/security checks

1. Archive SHA-256 and file size recorded; independent checksum matches.
2. `pg_restore --list` exits zero.
3. Source and restore DB identities demonstrably differ, verified in dashboard and sanitized script result.
4. Restore exits zero; errors abort the transaction.
5. Every required table exists and count-only query succeeds.
6. Migration ledger and catalog comparison covers tables, constraints, indexes, RLS/policies, triggers/functions and grants.
7. Scan report for URLs/passwords/JWTs/service-role keys and candidate PII; all must be absent.
8. Record backup timestamp/RPO, restore start/end/RTO and whether targets were met.
9. Keep archive and full evidence outside Git; restrict access.

## 5. Failure and cleanup

- If either target identity is ambiguous or the same: do not restore.
- If archive validation, restore, table presence or count query fails: status `RESTORE_DRILL_FAILED`, `passed=false`; stop all staging mutations.
- Destroy a disposable restore target only with explicit owner approval after evidence review. Never delete the only backup.
- Record sanitized failure, log path, operator and next action.

## 6. Evidence record

Capture source project ref, restore project/branch ref, distinct-target check, archive path in restricted storage, bytes, checksum, client versions, backup timestamp, restore start/end, RPO/RTO, table-count statuses, schema/ledger/catalog comparison, secret/PII scan, operator/reviewer, cleanup decision and evidence report SHA-256.

A source-level validator or script-generated `passed=true` is not enough unless all assertions really executed. Keep `productionReady=false` and `publicLaunchAllowed=false` even after the drill; this closes the recovery gate, not the entire release.
