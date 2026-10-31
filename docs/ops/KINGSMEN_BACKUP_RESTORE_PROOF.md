# Kingsmen Backup and Restore Proof

Status: **foundation built, staging drill pending**  
Production ready: **false**

This document defines the Kingsmen backup and restore boundary for the PostgreSQL/Supabase Truth Vault.

Kingsmen may not collect production personal data until a restore drill proves that data can be recovered without exposing secrets or raw candidate records in reports.

## Doctrine

- PostgreSQL/Supabase remains the Truth Vault.
- Backup archives must never be committed to Git.
- Database URLs must never be printed in reports.
- Restore drills must target an explicitly approved, disposable database on an allow-listed host that differs from the source host and database. A different database alone is not sufficient authorization for a destructive restore.
- The custom-format database archive is a full database dump and **contains candidate/personal rows**. The backup command now wraps it in a streaming AES-256-GCM authenticated container using a passphrase from `KINGSMEN_BACKUP_PASSPHRASE` (minimum 20 characters; never put it in arguments, logs, or source control), verifies decrypt-and-hash round-trip, and removes temporary plaintext files on the successful path. Encrypted files still require restricted local/offsite storage, documented retention/deletion controls, and no Git/public-artifact exposure. This code-level encryption is not proof that an operational backup or restore has succeeded.
- Reports may contain counts, checksums, timestamps, RPO/RTO, and table names only.
- Reports must not contain raw candidate rows, IDs, identity numbers, email addresses, phone numbers, documents, service role keys, or payment data.
- Production launch remains blocked until a staging restore drill passes.

## Source backup command

PowerShell:

```powershell
$env:KINGSMEN_DATABASE_URL = "[source-database-url-set-outside-git]"
$env:KINGSMEN_BACKUP_ROOT = "D:\KingsmenBackups"
.\scripts\backup\New-KingsmenTruthVaultBackup.ps1
```

The backup script writes a `.kmbak` authenticated encrypted archive and a redacted manifest. It requires `pg_dump`, `pg_restore`, Node.js, and `KINGSMEN_BACKUP_PASSPHRASE`. It validates the custom-format catalog before encryption, performs authenticated decrypt-and-hash round-trip verification, and only accepts the encrypted archive after the plaintext and verification temp files are removed. Store the passphrase in an approved secret manager; never use a real passphrase in documentation or logs.

## Restore drill command

PowerShell:

```powershell
$env:KINGSMEN_DATABASE_URL = "[source-database-url-set-outside-git]"
$env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = "[separate-disposable-restore-target-url-set-outside-git]"
$env:KINGSMEN_RESTORE_DRILL_EXPECTED_HOST = "[exact disposable PostgreSQL hostname]"
$env:KINGSMEN_RESTORE_DRILL_EXPECTED_DATABASE = "[exact disposable database name]"
.\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile "D:\KingsmenBackups\kingsmen-truth-vault-....kmbak" -ConfirmDestructiveRestore
```

The restore script authenticates and decrypts `.kmbak` files to a temporary file before validating the PostgreSQL archive catalog; it removes the temporary decrypted file on normal completion and terminating errors. The restore script requires `KINGSMEN_BACKUP_PASSPHRASE`, source and restore-target URLs plus explicit `KINGSMEN_RESTORE_DRILL_EXPECTED_HOST` and `KINGSMEN_RESTORE_DRILL_EXPECTED_DATABASE` values. Before destructive restore it validates the target URI host against the approved exact host, requires the target host to differ from the source host, queries the live database/server identity, and checks the actual database name equals the approved disposable name. It refuses a same-database target, verifies the archive catalog, and requires `-ConfirmDestructiveRestore` before the destructive `pg_restore --clean` operation. These checks reduce accidental mis-targeting but do not replace separate-target review/change authorization. It uses `pg_restore --exit-on-error` and `psql` with `ON_ERROR_STOP`; any failed count query or non-numeric count aborts the drill instead of recording a pass. A `-DryRun` is preflight only and is never recorded as a completed restore. Reports contain hashed database identities and counts only.

## Source-level proof commands

```bash
npm run backup:prove:restore
npm run backup:validate:restore
```

These commands prove that the backup/restore boundary exists in the repo. They do not prove that a real restore drill has been executed.

## Evidence required before production data

The archive builder must produce a non-empty AES-256-GCM authenticated `.kmbak` container, pass an authenticated decrypt-and-hash round trip, and validate the decrypted custom-format archive catalog with `pg_restore --list`. The CI encryption suite must pass round-trip, tamper-rejection, and wrong-passphrase tests. A real staging drill must produce:

1. backup archive exists outside Git;
2. backup SHA-256 checksum captured;
3. restore target is different from source;
4. restore completes successfully;
5. table count checks pass for core Truth Vault tables;
6. RPO and RTO are recorded;
7. report contains no secrets and no raw candidate data;
8. source and restore database/server identities are recorded as hashes and confirmed different;
9. all required table-count queries succeed with numeric results (a failed query blocks the report);
10. founder signs off the restore path.

## Launch status

The launch gate may recognize this source-level foundation, but production remains blocked until live staging restore evidence is stored in `reports/ops/` and reviewed. Counts-only validation confirms table readability, not exact row parity or Supabase Storage object recovery; those require their own approved evidence. The restore script deliberately does not assert that the overall backup/restore gate is complete.
