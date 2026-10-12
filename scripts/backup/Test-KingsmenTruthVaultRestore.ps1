#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [string]$RestoreDatabaseUrl = $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL,
  [string]$SourceDatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$ExpectedSha256 = $env:KINGSMEN_BACKUP_EXPECTED_SHA256,
  [string]$ReportPath = "reports/ops/backup-restore-staging-drill-latest.json",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$startedAt = Get-Date
$failureReasons = @()

if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
  throw "KINGSMEN_RESTORE_DRILL_DATABASE_URL is required. Do not use the source database as the restore target."
}
if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) {
  throw "Backup file not found."
}
if (-not $DryRun -and [string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) {
  throw "KINGSMEN_DATABASE_URL is required for source/restore target identity verification."
}
if (-not $DryRun -and [string]::IsNullOrWhiteSpace($ExpectedSha256)) {
  throw "KINGSMEN_BACKUP_EXPECTED_SHA256 is required for a real restore drill."
}
if (-not $DryRun -and $ExpectedSha256 -notmatch '^[A-Fa-f0-9]{64}$') {
  throw "Expected backup SHA-256 must be a 64-character hexadecimal digest."
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) { throw "pg_restore is required for restore drill. Install PostgreSQL client tools." }
$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $psql) { throw "psql is required for target identity and count-only verification." }

$backupSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupFile).Hash
$checksumMatches = $false
if (-not $DryRun) {
  $checksumMatches = ($backupSha256 -ieq $ExpectedSha256)
  if (-not $checksumMatches) { throw "Backup SHA-256 does not match the independently supplied expected digest." }
}

# Validate the archive before any restore attempt; output is deliberately not captured in the report.
& pg_restore --list $BackupFile *> $null
if ($LASTEXITCODE -ne 0) { throw "pg_restore archive validation failed. No restore was attempted." }
$archiveValidated = $true

$sourceIdentity = $null
$restoreIdentity = $null
$targetsDiffer = $false
if (-not $DryRun) {
  $identityQuery = "select current_database() || '|' || coalesce(inet_server_addr()::text, 'local') || '|' || current_setting('port');"
  $sourceIdentity = (& psql $SourceDatabaseUrl -t -A -c $identityQuery 2>$null | Select-Object -First 1)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($sourceIdentity)) {
    throw "Could not verify source database identity; restore blocked."
  }
  $restoreIdentity = (& psql $RestoreDatabaseUrl -t -A -c $identityQuery 2>$null | Select-Object -First 1)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($restoreIdentity)) {
    throw "Could not verify restore database identity; restore blocked."
  }
  $targetsDiffer = ($sourceIdentity.Trim() -ne $restoreIdentity.Trim())
  if (-not $targetsDiffer) { throw "Source and restore URLs resolve to the same database identity. Restore blocked." }

  & pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$RestoreDatabaseUrl $BackupFile
  if ($LASTEXITCODE -ne 0) { throw "pg_restore failed. Database URLs remain redacted." }
}

$coreTables = @(
  "candidates", "applications", "idempotency_keys", "command_log",
  "workflow_runs", "evidence_ledger", "audit_events", "dead_letter_queue",
  "approval_requests"
)
$tableChecks = @()
foreach ($table in $coreTables) {
  $count = "DRY_RUN"
  $queryPassed = $false
  if (-not $DryRun) {
    $query = "select case when to_regclass('public.$table') is null then 'MISSING' else (select count(*)::text from public.$table) end;"
    $result = & psql $RestoreDatabaseUrl -t -A -c $query 2>$null
    if ($LASTEXITCODE -eq 0) {
      $value = (($result | Select-Object -First 1) -as [string]).Trim()
      if ($value -match '^\d+$') { $count = $value; $queryPassed = $true }
      else { $count = $value; $failureReasons += "TABLE_CHECK_$($table.ToUpper())_$value" }
    } else {
      $count = "QUERY_FAILED"
      $failureReasons += "TABLE_CHECK_$($table.ToUpper())_QUERY_FAILED"
    }
  }
  $tableChecks += [ordered]@{
    table = $table
    countOnly = $true
    count = $count
    queryPassed = $queryPassed
    rawRowsReturned = $false
  }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
$rpoMinutesEstimate = [math]::Round(($startedAt - (Get-Item -LiteralPath $BackupFile).LastWriteTime).TotalMinutes, 2)
$allTableChecksPassed = (-not $DryRun) -and ($tableChecks.Count -eq $coreTables.Count) -and (@($tableChecks | Where-Object { -not $_.queryPassed }).Count -eq 0)
$passed = (-not $DryRun) -and $archiveValidated -and $checksumMatches -and $targetsDiffer -and $allTableChecksPassed
if ($DryRun) { $status = "DRY_RUN_NOT_PROOF" }
elseif ($passed) { $status = "RESTORE_DRILL_PASSED" }
else { $status = "RESTORE_DRILL_FAILED" }

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v2"
  module = "Kingsmen Backup Restore Drill"
  status = $status
  passed = $passed
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFileName = [IO.Path]::GetFileName($BackupFile)
  backupSha256 = $backupSha256
  expectedSha256Provided = (-not [string]::IsNullOrWhiteSpace($ExpectedSha256))
  checksumMatchesExpected = $checksumMatches
  archiveValidated = $archiveValidated
  databaseUrlsRedacted = $true
  sourceAndRestoreTargetsDiffer = $targetsDiffer
  sourceIdentityReported = $false
  restoreIdentityReported = $false
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutesEstimateFromBackupFileTimestamp = $rpoMinutesEstimate
  rpoRequiresIndependentConfirmation = $true
  rtoSeconds = $rtoSeconds
  allRequiredTableChecksPassed = $allTableChecksPassed
  tableChecks = $tableChecks
  failureReasons = $failureReasons
  founderReviewRequired = $true
  nextAction = "Review redacted report and checksum provenance; independently confirm RPO, offsite retention, encryption, and access controls."
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs and database identities are redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20
if (-not $passed) { exit 1 }
