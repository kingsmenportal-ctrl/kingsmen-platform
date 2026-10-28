#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [string]$RestoreDatabaseUrl = $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL,
  [string]$SourceDatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$ReportPath = "reports/ops/backup-restore-staging-drill-latest.json",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$startedAt = Get-Date
$failures = New-Object System.Collections.Generic.List[string]
$tableChecks = @()
$targetIdentityChecked = $false
$restoreSucceeded = $false
$sourceAndRestoreTargetsDiffer = $false

if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
  throw "KINGSMEN_RESTORE_DRILL_DATABASE_URL is required. Do not use source database as restore target."
}
if ([string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) {
  throw "KINGSMEN_DATABASE_URL is required so the source and restore targets can be compared."
}
if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}
if ($SourceDatabaseUrl -eq $RestoreDatabaseUrl) {
  throw "Restore target matches source database. Restore drill blocked."
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) { throw "pg_restore is required. Install PostgreSQL client tools." }
$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $psql) { throw "psql is required for database identity and count-only verification." }

# Archive TOC must parse before any database write.
$null = & pg_restore --list $BackupFile 2>$null
if ($LASTEXITCODE -ne 0) { throw "Backup archive failed pg_restore --list validation." }
$sha256 = (Get-FileHash -Algorithm SHA256 -Path $BackupFile).Hash
$archiveBytes = (Get-Item $BackupFile).Length
if ($archiveBytes -le 0) { throw "Backup archive is empty." }

function Get-DbIdentity {
  param([string]$ConnectionString, [string]$Label)
  $query = "select current_database() || '|' || coalesce(inet_server_addr()::text,'local') || '|' || coalesce(inet_server_port()::text,'');"
  $value = & psql $ConnectionString -X -v ON_ERROR_STOP=1 -t -A -c $query 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $value) {
    throw "$Label database identity could not be verified; connection URL remains redacted."
  }
  return ($value | Select-Object -First 1).Trim()
}

if (-not $DryRun) {
  $sourceIdentity = Get-DbIdentity -ConnectionString $SourceDatabaseUrl -Label "Source"
  $restoreIdentity = Get-DbIdentity -ConnectionString $RestoreDatabaseUrl -Label "Restore target"
  if ($sourceIdentity -eq $restoreIdentity) {
    throw "Restore target matches source database identity. Restore drill blocked."
  }
  $targetIdentityChecked = $true
  $sourceAndRestoreTargetsDiffer = $true

  # Single transaction plus exit-on-error prevents a failed restore leaving partial schema/data.
  $null = & pg_restore --clean --if-exists --exit-on-error --single-transaction --no-owner --no-privileges "--dbname=$RestoreDatabaseUrl" $BackupFile 2>$null
  $restoreExit = $LASTEXITCODE
  if ($restoreExit -eq 0) {
    $restoreSucceeded = $true
  } else {
    $failures.Add("pg_restore_failed")
  }
} else {
  $failures.Add("dry_run_is_not_restore_evidence")
}

$coreTables = @(
  "candidates",
  "applications",
  "idempotency_keys",
  "command_log",
  "workflow_runs",
  "evidence_ledger",
  "audit_events",
  "dead_letter_queue",
  "approval_requests"
)

foreach ($table in $coreTables) {
  if ($DryRun -or -not $restoreSucceeded) {
    $tableChecks += [ordered]@{
      table = $table; countOnly = $true; count = "NOT_RUN"
      tablePresent = $false; queryPassed = $false; rawRowsReturned = $false
    }
    continue
  }

  $existsQuery = "select to_regclass('public.$table') is not null;"
  $existsResult = & psql $RestoreDatabaseUrl -X -v ON_ERROR_STOP=1 -t -A -c $existsQuery 2>$null
  if ($LASTEXITCODE -ne 0 -or (($existsResult | Select-Object -First 1).Trim() -ne "t")) {
    $failures.Add("missing_table_or_presence_check_failed:$table")
    $tableChecks += [ordered]@{
      table = $table; countOnly = $true; count = "MISSING_TABLE"
      tablePresent = $false; queryPassed = $false; rawRowsReturned = $false
    }
    continue
  }

  # Table names come only from the fixed list above; no untrusted identifier is interpolated.
  $countQuery = "select count(*)::text from public.$table;"
  $countResult = & psql $RestoreDatabaseUrl -X -v ON_ERROR_STOP=1 -t -A -c $countQuery 2>$null
  if ($LASTEXITCODE -eq 0 -and $countResult) {
    $count = ($countResult | Select-Object -First 1).Trim()
    $queryPassed = $count -match '^\d+$'
  } else {
    $count = "QUERY_FAILED"
    $queryPassed = $false
  }
  if (-not $queryPassed) { $failures.Add("count_query_failed:$table") }
  $tableChecks += [ordered]@{
    table = $table; countOnly = $true; count = $count
    tablePresent = $true; queryPassed = $queryPassed; rawRowsReturned = $false
  }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
$passed = (-not $DryRun) -and $restoreSucceeded -and $targetIdentityChecked -and $sourceAndRestoreTargetsDiffer -and ($failures.Count -eq 0)
$status = if ($DryRun) { "DRY_RUN_NOT_EVIDENCE" } elseif ($passed) { "RESTORE_DRILL_PASSED" } else { "RESTORE_DRILL_FAILED" }

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v1"
  module = "Kingsmen Backup Restore Drill"
  status = $status
  passed = $passed
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFile = $BackupFile
  backupSha256 = $sha256
  archiveBytes = $archiveBytes
  archiveTocValidationPassed = $true
  databaseUrlRedacted = $true
  targetIdentityChecked = $targetIdentityChecked
  sourceAndRestoreTargetsDiffer = $sourceAndRestoreTargetsDiffer
  restoreSucceeded = $restoreSucceeded
  verificationMode = "public core table presence and count-only sanity; not row-by-row equivalence"
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutes = "manual_capture_required"
  rtoSeconds = $rtoSeconds
  tableChecks = $tableChecks
  failures = @($failures)
  founderReviewRequired = $true
  nextAction = if ($passed) { "Review schema/migration/catalog comparison, approve RPO/RTO and store evidence offsite." } else { "Drill failed or is only a dry run. Stop; review failures and do not enable production data." }
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20
if (-not $passed) { exit 1 }
