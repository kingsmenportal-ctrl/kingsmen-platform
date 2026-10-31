#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$BackupRoot = $env:KINGSMEN_BACKUP_ROOT,
  [string]$DatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$AgeRecipient = $env:KINGSMEN_BACKUP_AGE_RECIPIENT,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { $DatabaseUrl = $env:DATABASE_URL }
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "KINGSMEN_DATABASE_URL or DATABASE_URL is required. Do not print or commit the value."
}
if ([string]::IsNullOrWhiteSpace($AgeRecipient)) {
  throw "KINGSMEN_BACKUP_AGE_RECIPIENT is required. Configure an age public recipient outside Git."
}

$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) { throw "pg_dump is required for the PostgreSQL backup." }
$age = Get-Command "age" -ErrorAction SilentlyContinue
if (-not $age) { throw "age is required. Unencrypted database archives are not accepted." }

if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
  $BackupRoot = Join-Path (Get-Location) ".local\backups"
}

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupDir = Join-Path $BackupRoot $stamp
$plainDump = Join-Path $backupDir "kingsmen-truth-vault-$stamp.dump"
$encryptedFile = "$plainDump.age"
$manifestFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.manifest.json"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

try {
  if (-not $DryRun) {
    & $pgDump.Source $DatabaseUrl --format=custom --no-owner --no-privileges "--file=$plainDump"
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed. Database URL remains redacted." }

    & $age.Source -r $AgeRecipient -o $encryptedFile $plainDump
    if ($LASTEXITCODE -ne 0) { throw "age encryption failed. Database URL and recipient remain redacted." }
    if (-not (Test-Path $encryptedFile) -or (Get-Item $encryptedFile).Length -le 0) {
      throw "Encrypted archive was not created."
    }
  }
} finally {
  # Remove the unencrypted intermediate as soon as encryption completes or fails.
  if (Test-Path $plainDump) {
    Remove-Item -Force -ErrorAction SilentlyContinue $plainDump
  }
}

$encryptedExists = (Test-Path $encryptedFile) -and (-not $DryRun)
$sha256 = if ($encryptedExists) {
  (Get-FileHash -Algorithm SHA256 -Path $encryptedFile).Hash
} else { "DRY_RUN_NO_ENCRYPTED_ARCHIVE" }
$archiveBytes = if ($encryptedExists) { (Get-Item $encryptedFile).Length } else { 0 }
$plaintextRemoved = -not (Test-Path $plainDump)

$manifest = [ordered]@{
  schema = "kingsmen.truth-vault-backup-manifest.v2"
  module = "Kingsmen Truth Vault Backup"
  status = $(if ($DryRun) { "DRY_RUN" } elseif ($encryptedExists -and $plaintextRemoved) { "ENCRYPTED_BACKUP_CREATED" } else { "BACKUP_FAILED" })
  productionReady = $false
  generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  backupFile = $(if ($encryptedExists) { Split-Path -Leaf $encryptedFile } else { "" })
  archiveBytes = $archiveBytes
  sha256 = $sha256
  format = "pg_dump_custom"
  encryption = "age"
  encryptedAtRest = [bool]$encryptedExists
  plaintextTemporaryRemoved = [bool]$plaintextRemoved
  ownerPrivilegesRestored = $false
  databaseUrlRedacted = $true
  backupRootRedacted = $true
  candidateDataIncluded = $true
  rawCandidateRowsPrinted = $false
  privateStorageObjectsIncluded = $false
  storageParityRequired = $true
  committedToGit = $false
  restoreRequiredBeforeProductionData = $true
}

$manifest | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $manifestFile
Write-Host "Kingsmen encrypted database backup manifest written. Database URL and encryption recipient redacted."
Write-Host $manifestFile
$manifest | ConvertTo-Json -Depth 20

if (-not $DryRun -and (-not $encryptedExists -or -not $plaintextRemoved)) {
  throw "BACKUP_ENCRYPTION_OR_PLAINTEXT_CLEANUP_FAILED"
}
