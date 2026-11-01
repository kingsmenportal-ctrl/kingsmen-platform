#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$BackupRoot = $env:KINGSMEN_BACKUP_ROOT,
  [string]$DatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  $DatabaseUrl = $env:DATABASE_URL
}
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "KINGSMEN_DATABASE_URL or DATABASE_URL is required. Do not print or commit the value."
}
if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
  $BackupRoot = Join-Path (Get-Location) ".local\backups"
}

$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump is required for backup. Install PostgreSQL client tools on the founder/staging machine."
}
$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) {
  throw "pg_restore is required to verify the custom-format backup archive."
}

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupDir = Join-Path $BackupRoot $stamp
$backupFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.kmbak"
$plainFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.dump.partial"
$verifiedFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.verify.partial"
$encryptionHelper = Join-Path (Get-Location) "scripts/backup/encrypt-backup.mjs"
trap {
  if (Test-Path $plainFile) { Remove-Item -LiteralPath $plainFile -Force -ErrorAction SilentlyContinue }
  if (Test-Path $verifiedFile) { Remove-Item -LiteralPath $verifiedFile -Force -ErrorAction SilentlyContinue }
  throw
}
$manifestFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.manifest.json"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (-not $DryRun) {
  if ([string]::IsNullOrWhiteSpace($env:KINGSMEN_BACKUP_PASSPHRASE) -or $env:KINGSMEN_BACKUP_PASSPHRASE.Length -lt 20) {
    throw "KINGSMEN_BACKUP_PASSPHRASE must contain at least 20 characters. Secret value is never printed."
  }
  if (-not (Test-Path $encryptionHelper)) { throw "Streaming authenticated backup encryption helper is missing." }
  $node = Get-Command "node" -ErrorAction SilentlyContinue
  if (-not $node) { throw "Node.js is required for authenticated backup encryption." }
  & pg_dump --no-password $DatabaseUrl --format=custom --no-owner --no-privileges --file=$plainFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed. Database URL remains redacted."
  }
  if (-not (Test-Path $plainFile)) {
    throw "pg_dump returned success but did not create the expected temporary archive."
  }
  $createdArchiveBytes = (Get-Item $plainFile).Length
  if ($createdArchiveBytes -lt 1) {
    throw "Backup archive is empty. No successful backup manifest was written."
  }

  # A successful pg_dump exit is not enough: verify that pg_restore can read
  # the custom archive catalog before describing it as a completed backup.
  & pg_restore --list $plainFile > $null 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore could not read the backup archive catalog. Backup is not accepted."
  }
  # Encrypt to an authenticated AES-256-GCM container; never report plaintext as backup evidence.
  & node $encryptionHelper encrypt $plainFile $backupFile
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $backupFile)) { throw "Authenticated archive encryption failed. Backup is not accepted." }
  & node $encryptionHelper decrypt $backupFile $verifiedFile
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $verifiedFile)) { throw "Encrypted archive authentication verification failed." }
  $plainHash = (Get-FileHash -Algorithm SHA256 -Path $plainFile).Hash
  $verifiedHash = (Get-FileHash -Algorithm SHA256 -Path $verifiedFile).Hash
  if ($plainHash -ne $verifiedHash) { throw "Encrypted backup verification did not match the original archive." }
  Remove-Item -LiteralPath $plainFile -Force
  Remove-Item -LiteralPath $verifiedFile -Force
}

$archiveExists = (Test-Path $backupFile) -and (-not $DryRun) -and (-not (Test-Path $plainFile)) -and (-not (Test-Path $verifiedFile))
$sha256 = if ($archiveExists) { (Get-FileHash -Algorithm SHA256 -Path $backupFile).Hash } else { "DRY_RUN_NO_ARCHIVE" }
$archiveBytes = if ($archiveExists) { (Get-Item $backupFile).Length } else { 0 }

$manifest = [ordered]@{
  schema = "kingsmen.truth-vault-backup-manifest.v1"
  module = "Kingsmen Truth Vault Backup"
  status = $(if ($DryRun) { "DRY_RUN" } else { "ENCRYPTED_BACKUP_CREATED_AND_AUTHENTICATED" })
  passed = (-not $DryRun) -and $archiveExists -and ($archiveBytes -gt 0)
  productionReady = $false
  generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  backupFile = $backupFile
  archiveBytes = $archiveBytes
  archiveCatalogVerified = $archiveExists
  encryption = "AES-256-GCM"
  encryptionAuthenticated = $archiveExists
  plaintextArchiveRemoved = $archiveExists
  sha256 = $sha256
  format = "kingsmen_aes_256_gcm_envelope_with_pg_dump_custom_payload"
  ownerPrivilegesRestored = $false
  databaseUrlRedacted = $true
  # The authenticated encrypted container protects a full pg_dump that includes candidate/personal rows.
  rawCandidateRowsIncluded = $true
  archiveContainsPersonalData = $true
  archiveEncryptionProvidedByScript = $true
  encryptedStorageRequired = $true
  restrictedAccessStorageRequired = $true
  retentionPolicyRequired = $true
  committedToGit = $false
  restoreRequiredBeforeProductionData = $true
}

$manifest | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $manifestFile
Write-Host "Kingsmen Truth Vault backup manifest written. Database URL redacted."
Write-Host $manifestFile
$manifest | ConvertTo-Json -Depth 20

if ($DryRun) {
  Write-Host "DRY RUN ONLY: no backup archive was created; this is not backup evidence."
  exit 0
}
if (-not $manifest.passed) {
  throw "Backup did not satisfy archive verification. Do not use it for a restore drill."
}
