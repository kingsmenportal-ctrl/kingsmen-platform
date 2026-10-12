#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$BackupRoot = $env:KINGSMEN_BACKUP_ROOT,
  [string]$DatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$ExpectedProjectRef = $env:KINGSMEN_EXPECTED_SUPABASE_PROJECT_REF,
  [string]$BackupEnvironment = $env:KINGSMEN_BACKUP_ENVIRONMENT,
  [string]$GpgRecipient = $env:KINGSMEN_BACKUP_GPG_RECIPIENT,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
function Write-KingsmenSafeMessage { param([string]$Message) Write-Host $Message }

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { $DatabaseUrl = $env:DATABASE_URL }
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "KINGSMEN_DATABASE_URL is required. Do not print or commit the value." }
if ($BackupEnvironment -ne "staging") { throw "KINGSMEN_BACKUP_ENVIRONMENT must be explicitly set to staging. Production backup is blocked by this script." }
if ([string]::IsNullOrWhiteSpace($ExpectedProjectRef)) { throw "KINGSMEN_EXPECTED_SUPABASE_PROJECT_REF is required." }
if ($ExpectedProjectRef -notmatch '^[a-z0-9]{20}$') { throw "Expected Supabase project ref is not in the expected format." }
if ($DatabaseUrl -notmatch [regex]::Escape($ExpectedProjectRef)) { throw "Database URL does not identify the explicitly expected staging project. Backup blocked." }
if ([string]::IsNullOrWhiteSpace($BackupRoot)) { throw "KINGSMEN_BACKUP_ROOT must point to an approved external backup location; repository-local defaults are disabled." }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$fullBackupRoot = [IO.Path]::GetFullPath($BackupRoot)
if ($fullBackupRoot.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup root must be outside the repository to prevent accidental Git inclusion."
}
if (-not $DryRun -and [string]::IsNullOrWhiteSpace($GpgRecipient)) {
  throw "KINGSMEN_BACKUP_GPG_RECIPIENT is required for encrypted staging backups."
}

$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) { throw "pg_dump is required for backup. Install PostgreSQL client tools." }
$gpg = Get-Command "gpg" -ErrorAction SilentlyContinue
if (-not $DryRun -and -not $gpg) { throw "gpg is required to encrypt the backup before the plaintext temporary archive is removed." }

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupDir = Join-Path $fullBackupRoot $stamp
$plainFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.plain.dump"
$backupFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.dump.gpg"
$manifestFile = Join-Path $backupDir "kingsmen-truth-vault-$stamp.manifest.json"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$archiveBytes = 0
$sha256 = "DRY_RUN_NO_ARCHIVE"
$encrypted = $false
try {
  if (-not $DryRun) {
    & pg_dump $DatabaseUrl --format=custom --no-owner --no-privileges --file=$plainFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed. Database URL remains redacted." }

    & gpg --batch --yes --trust-model always --encrypt --recipient $GpgRecipient --output $backupFile $plainFile *> $null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $backupFile -PathType Leaf)) {
      throw "GPG encryption failed; backup is not accepted as complete."
    }
    Remove-Item -LiteralPath $plainFile -Force
    $encrypted = $true
    $sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupFile).Hash
    $archiveBytes = (Get-Item -LiteralPath $backupFile).Length
  }
}
finally {
  if (Test-Path -LiteralPath $plainFile -PathType Leaf) {
    Remove-Item -LiteralPath $plainFile -Force -ErrorAction SilentlyContinue
  }
}

$passed = (-not $DryRun) -and $encrypted -and $archiveBytes -gt 0 -and $sha256 -match '^[A-Fa-f0-9]{64}$'
$manifest = [ordered]@{
  schema = "kingsmen.truth-vault-backup-manifest.v2"
  module = "Kingsmen Truth Vault Backup"
  status = $(if ($DryRun) { "DRY_RUN_NOT_PROOF" } elseif ($passed) { "ENCRYPTED_BACKUP_CREATED" } else { "BACKUP_FAILED" })
  passed = $passed
  productionReady = $false
  productionDataAllowed = $false
  generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  backupFileName = [IO.Path]::GetFileName($backupFile)
  archiveBytes = $archiveBytes
  sha256 = $sha256
  format = "pg_dump_custom_gpg_encrypted"
  encrypted = $encrypted
  encryptionMethod = "GPG/OpenPGP"
  encryptionRecipientReported = $false
  expectedProjectRef = $ExpectedProjectRef
  backupEnvironment = "staging"
  databaseUrlRedacted = $true
  backupRootRedacted = $true
  rawCandidateRowsIncluded = $false
  committedToGit = $false
  externalRetentionAndAccessReviewRequired = $true
  restoreRequiredBeforeProductionData = $true
}
$manifest | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $manifestFile
Write-KingsmenSafeMessage "Kingsmen encrypted staging backup manifest written. Database URL and encryption recipient redacted."
Write-KingsmenSafeMessage $manifestFile
$manifest | ConvertTo-Json -Depth 20
if (-not $passed) { exit 1 }
