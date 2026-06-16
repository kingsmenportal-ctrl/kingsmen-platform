# Kingsmen Backup and Restore Proof

Status: **foundation built, staging drill pending**  
Production ready: **false**

This document defines the Kingsmen backup and restore boundary for the PostgreSQL/Supabase Truth Vault.

Kingsmen may not collect production personal data until a restore drill proves that data can be recovered without exposing secrets or raw candidate records in reports.

## Doctrine

- PostgreSQL/Supabase remains the Truth Vault.
- Backup archives must never be committed to Git.
- Database URLs must never be printed in reports.
- Restore drills must never target the same database as the source backup.
- Reports may contain counts, checksums, timestamps, RPO/RTO, and table names only.
- Reports must not contain raw candidate rows, IDs, identity numbers, email addresses, phone numbers, documents, service role keys, or payment data.
- Production launch remains blocked until a staging restore drill passes.

## Source backup command

PowerShell:

```powershell
$env:KINGSMEN_DATABASE_URL = "postgres://..."
$env:KINGSMEN_BACKUP_ROOT = "D:\\KingsmenBackups"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1
```

The backup script writes a local backup archive and a redacted local manifest. It uses `pg_dump` in custom format and computes a SHA-256 checksum.

## Restore drill command

PowerShell:

```powershell
$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "postgres://...restore-drill..."
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\\KingsmenBackups\\kingsmen-truth-vault-....dump"
```

The restore script refuses to run if the restore target equals the source database URL. It writes a counts-only restore drill report.

## Source-level proof commands

```bash
npm run backup:prove:restore
npm run backup:validate:restore
```

These commands prove that the backup/restore boundary exists in the repo. They do not prove that a real restore drill has been executed.

## Evidence required before production data

A real staging drill must produce:

1. backup archive exists outside Git;
2. backup SHA-256 checksum captured;
3. restore target is different from source;
4. restore completes successfully;
5. table count checks pass for core Truth Vault tables;
6. RPO and RTO are recorded;
7. report contains no secrets and no raw candidate data;
8. founder signs off the restore path.

## Launch status

The launch gate may recognize this source-level foundation, but production remains blocked until live staging restore evidence is stored in `reports/ops/` and reviewed.
