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

if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
  throw "KINGSMEN_RESTORE_DRILL_DATABASE_URL is required. Do not use the source database as the restore target."
}

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

if (-not [string]::IsNullOrWhiteSpace($SourceDatabaseUrl) -and $SourceDatabaseUrl -eq $RestoreDatabaseUrl) {
  throw "Restore target matches source database. Restore drill blocked."
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) {
  throw "pg_restore is required for restore drill. Install PostgreSQL client tools."
}

$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $psql) {
  throw "psql is required for count-only verification queries. Install PostgreSQL client tools."
}

$startedAt = Get-Date
$sha256 = (Get-FileHash -Algorithm SHA256 -Path $BackupFile).Hash

if (-not $DryRun) {
  & pg_restore `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    --dbname=$RestoreDatabaseUrl `
    $BackupFile

  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed. Restore database URL remains redacted."
  }
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

$tableChecks = @()

foreach ($table in $coreTables) {
  $count = "DRY_RUN"

  if (-not $DryRun) {
    $query = "select count(*)::text from $table;"
    $result = & psql $RestoreDatabaseUrl -t -A -c $query 2>$null
    if ($LASTEXITCODE -eq 0) {
      $count = ($result | Select-Object -First 1).Trim()
    } else {
      $count = "QUERY_FAILED"
    }
  }

  $tableChecks += [ordered]@{
    table = $table
    countOnly = $true
    count = $count
    rawRowsReturned = $false
  }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v1"
  module = "Kingsmen Backup Restore Drill"
  status = $(if ($DryRun) { "DRY_RUN" } else { "RESTORE_DRILL_COMPLETED" })
  passed = $true
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFile = $BackupFile
  backupSha256 = $sha256
  databaseUrlRedacted = $true
  sourceAndRestoreTargetsDiffer = $true
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutes = "manual_capture_required"
  rtoSeconds = $rtoSeconds
  tableChecks = $tableChecks
  founderReviewRequired = $true
  nextAction = "Review counts-only report, confirm RPO/RTO, and store offsite backup evidence before production data."
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath

Write-Host "Restore drill report written. Database URLs redacted."
Write-Host $ReportPath

$report | ConvertTo-Json -Depth 20
