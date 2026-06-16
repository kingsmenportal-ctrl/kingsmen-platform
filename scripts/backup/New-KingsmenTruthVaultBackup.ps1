#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$BackupRoot = $env:KINGSMEN_BACKUP_ROOT,
  [string]$DatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-KingsmenSafeMessage {
  param([string]$Message)
  Write-Host $Message
}

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

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupDir = Join-Path $BackupRoot $stamp
$backupFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.dump"
$manifestFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.manifest.json"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (-not $DryRun) {
  & pg_dump $DatabaseUrl `
    --format=custom `
    --no-owner `
    --no-privileges `
    --file=$backupFile

  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed. Database URL remains redacted."
  }
}

$sha256 = if ((Test-Path $backupFile) -and -not $DryRun) {
  (Get-FileHash -Algorithm SHA256 -Path $backupFile).Hash
} else {
  "DRY_RUN_NO_ARCHIVE"
}

$archiveBytes = if ((Test-Path $backupFile) -and -not $DryRun) {
  (Get-Item $backupFile).Length
} else {
  0
}

$manifest = [ordered]@{
  schema = "kingsmen.truth-vault-backup-manifest.v1"
  module = "Kingsmen Truth Vault Backup"
  status = $(if ($DryRun) { "DRY_RUN" } else { "BACKUP_CREATED" })
  productionReady = $false
  generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  backupFile = $backupFile
  archiveBytes = $archiveBytes
  sha256 = $sha256
  format = "pg_dump_custom"
  ownerPrivilegesRestored = $false
  databaseUrlRedacted = $true
  rawCandidateRowsIncluded = $false
  committedToGit = $false
  restoreRequiredBeforeProductionData = $true
}

$manifest | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $manifestFile

Write-KingsmenSafeMessage "Kingsmen Truth Vault backup manifest written. Database URL redacted."
Write-KingsmenSafeMessage $manifestFile

$manifest | ConvertTo-Json -Depth 20
