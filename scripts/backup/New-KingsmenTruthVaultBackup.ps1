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
$backupFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.dump"
$manifestFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.manifest.json"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (-not $DryRun) {
  & pg_dump --no-password $DatabaseUrl --format=custom --no-owner --no-privileges --file=$backupFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed. Database URL remains redacted."
  }
  if (-not (Test-Path $backupFile)) {
    throw "pg_dump returned success but did not create the expected archive."
  }
  $createdArchiveBytes = (Get-Item $backupFile).Length
  if ($createdArchiveBytes -lt 1) {
    throw "Backup archive is empty. No successful backup manifest was written."
  }

  # A successful pg_dump exit is not enough: verify that pg_restore can read
  # the custom archive catalog before describing it as a completed backup.
  & pg_restore --list $backupFile > $null 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore could not read the backup archive catalog. Backup is not accepted."
  }
}

$archiveExists = (Test-Path $backupFile) -and (-not $DryRun)
$sha256 = if ($archiveExists) { (Get-FileHash -Algorithm SHA256 -Path $backupFile).Hash } else { "DRY_RUN_NO_ARCHIVE" }
$archiveBytes = if ($archiveExists) { (Get-Item $backupFile).Length } else { 0 }

$manifest = [ordered]@{
  schema = "kingsmen.truth-vault-backup-manifest.v1"
  module = "Kingsmen Truth Vault Backup"
  status = $(if ($DryRun) { "DRY_RUN" } else { "BACKUP_CREATED_AND_ARCHIVE_VERIFIED" })
  passed = (-not $DryRun) -and $archiveExists -and ($archiveBytes -gt 0)
  productionReady = $false
  generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  backupFile = $backupFile
  archiveBytes = $archiveBytes
  archiveCatalogVerified = $archiveExists
  sha256 = $sha256
  format = "pg_dump_custom"
  ownerPrivilegesRestored = $false
  databaseUrlRedacted = $true
  rawCandidateRowsIncluded = $false
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
