# Kingsmen Backup and Restore Proof

Status: **foundation built, staging drill pending**  
Production ready: **false**

This document defines the Kingsmen backup and restore boundary for the PostgreSQL/Supabase Truth Vault.

Kingsmen may not collect production personal data until a restore drill proves recovery without exposing secrets or raw candidate records in reports.

## Doctrine

- PostgreSQL/Supabase remains the Truth Vault.
- Backup archives must never be committed to Git or stored under the repository.
- Backups must be encrypted before the plaintext temporary archive is removed.
- Database URLs, database identities, encryption recipients, and credentials must never be printed in reports.
- Backup generation must explicitly identify the staging project; production backups are blocked by this script.
- Restore drills must verify source and restore database identities differ, not merely compare URL strings.
- Restore must require an independently supplied expected SHA-256 and validate the archive before restoring.
- Reports may contain counts, checksums, timestamps, RPO/RTO estimates, and table names only.
- Reports must not contain raw candidate rows, IDs, identity numbers, email addresses, phone numbers, documents, service-role keys, or payment data.
- Dry-run reports are not runtime proof and must not pass.
- Production launch remains blocked until a real staging restore drill passes and the founder reviews the evidence.

## Source backup command

Configure these values in the staging operator's secure environment, not in chat or Git:

```powershell
$env:KINGSMEN_BACKUP_ENVIRONMENT = "staging"
$env:KINGSMEN_EXPECTED_SUPABASE_PROJECT_REF = "euhubhhnumtibbyufghm"
$env:KINGSMEN_DATABASE_URL = "[staging-database-url-set-outside-git]"
$env:KINGSMEN_BACKUP_ROOT = "D:\KingsmenBackups"
$env:KINGSMEN_BACKUP_GPG_RECIPIENT = "[approved-gpg-recipient-configured-outside-git]"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1
```

The backup script requires `pg_dump` and GPG, writes the encrypted `.dump.gpg` archive to an external root, computes SHA-256, and removes the plaintext temporary archive. The root must be outside the repository. The operator must separately confirm encrypted offsite retention and access controls; this script does not claim that offsite retention exists.

## Restore drill command

Configure source and restore database URLs in the staging operator's secure environment. The restore target must be a distinct disposable staging database, never production:

```powershell
$env:KINGSMEN_DATABASE_URL = "[source-staging-database-url-set-outside-git]"
$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "[distinct-restore-database-url-set-outside-git]"
$env:KINGSMEN_BACKUP_EXPECTED_SHA256 = "[independently-captured-64-character-sha256]"
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\KingsmenBackups\[encrypted-backup-file].dump.gpg"
```

**Operational prerequisite:** the restore script must decrypt the GPG archive into a protected temporary file before calling `pg_restore`. The current implementation accepts a PostgreSQL custom-format archive and therefore the encrypted archive must be decrypted in a controlled operator step before execution; never place the plaintext archive in Git or the report directory. Do not run the restore drill until this decryption path has been implemented and reviewed.

The restore script fails closed if the expected checksum is missing or mismatched, the archive fails validation, the source/restore database identities cannot be verified or are the same, or any required table check fails. It records a file-timestamp-based RPO estimate that requires independent confirmation; that estimate is not itself proof of recovery point.

## Source-level proof commands

```bash
npm run backup:prove:restore
npm run backup:validate:restore
```

These commands prove that the backup/restore boundary exists in the repository. They do not prove a real backup, encryption, or restore drill has run.

## Evidence required before production data

A real staging drill must produce:

1. encrypted backup archive exists outside Git;
2. archive checksum is independently captured and verified;
3. restore target is a distinct database confirmed by server/database identity;
4. restore completes successfully from a decrypted temporary archive;
5. every required table check passes;
6. RPO and RTO are captured and independently reviewed;
7. report contains no secrets, database URLs/identities, or raw candidate data;
8. encrypted offsite retention and access controls are confirmed;
9. founder reviews and signs off the restore path.

## Launch status

The launch gate may recognize source-level foundations only. Production remains blocked until live staging restore evidence is stored in `reports/ops/`, reviewed, and included in the final hashed evidence bundle.
