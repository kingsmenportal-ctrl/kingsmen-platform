# Kingsmen Backup and Restore Proof

Status: encrypted database-restore foundation; live staging drill and private Storage parity pending
Production ready: false

This procedure is a safety boundary for the PostgreSQL/Supabase Truth Vault. The database archive may contain candidate, identity-review, application, finance and operational records. Treat the archive as highly sensitive even though reports are counts-only.

## Encrypted database backup

The database archive is created with pg_dump in custom format, encrypted with age, and checksummed after encryption. The unencrypted intermediate is removed in a finally block. An unencrypted archive is not accepted. Backup archives, private age identities, database URLs and candidate data must never be committed to Git.

Create an age identity using the approved age-keygen tool. Keep the private identity offline or in an approved secrets vault, separate from the backup location. Configure the public recipient only:

    $env:KINGSMEN_DATABASE_URL = '[source PostgreSQL URI set outside Git]'
    $env:KINGSMEN_BACKUP_AGE_RECIPIENT = '[age public recipient]'
    $env:KINGSMEN_BACKUP_ROOT = 'E:\KingsmenBackups'
    .\scripts\backup\New-KingsmenTruthVaultBackup.ps1

Required tools: pg_dump and age. Verify the encrypted archive SHA-256 and copy it to the approved offsite backup location. The database backup includes personal data and must be access-controlled; the counts-only manifest does not mean the archive itself contains no candidate data.

## Isolated database restore

The restore requires source and target PostgreSQL URIs, an age identity file, and explicit target database-name confirmation. It compares normalized host/port/database identity and rejects an identical source and target. It also requires the target to have no public tables or views before restoring. It does not use pg_restore --clean.

    $env:KINGSMEN_BACKUP_AGE_IDENTITY_FILE = 'E:\KingsmenKeys\kingsmen-backup-identity.txt'
    $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL = '[isolated restore PostgreSQL URI set outside Git]'
    .\scripts\backup\Test-KingsmenTruthVaultRestore.ps1 -BackupFile 'E:\KingsmenBackups\[timestamp]\kingsmen-truth-vault-[timestamp].dump.age' -SourceDatabaseUrl $env:KINGSMEN_DATABASE_URL -RestoreDatabaseUrl $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL -ConfirmRestoreDatabaseName '[exact isolated target database name]'

The restore report contains table names, counts, checksum, timestamps, RTO and redacted failure codes only. Missing or failed count queries fail the drill. The decrypted temporary dump is removed after the restore attempt. Database credentials are passed to PostgreSQL client tools through process environment variables rather than command-line arguments.

## Private Storage parity is a separate gate

The encrypted PostgreSQL archive does not contain bytes stored in Supabase Storage. Storage metadata in PostgreSQL is not a substitute for object-byte backup. Private bucket/object backup, encryption, isolated restore, object count/size/hash parity, signed-access checks and reviewer confirmation remain mandatory and are not marked complete by this database-only script.

## Evidence required before launch

1. Encrypted database archive exists outside Git and its SHA-256 is recorded.
2. Unencrypted temporary archive is removed.
3. Restore target is explicitly confirmed, isolated and distinct from source.
4. Database restore completes and all required table-count parity checks pass.
5. Private Storage objects are separately backed up and restored with count/size/hash parity.
6. RPO and RTO are measured and recorded.
7. Reports contain no raw candidate rows, secrets, database URLs, identity numbers, emails, phone numbers, document bytes or payment data.
8. Independent review and founder sign-off are recorded.

## Source-level proof

    npm run backup:prove:restore
    npm run backup:validate:restore
    npm run backup:security:test

These checks validate source boundaries only. They do not claim that a real encrypted staging backup, database restore or private Storage restore has been executed.

## Launch status

Production data and public launch remain blocked until a real staging database restore and private Storage parity drill pass with reviewed evidence.
