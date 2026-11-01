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
if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) {
  throw "Backup file not found. Database URL remains redacted."
}
if (-not [string]::IsNullOrWhiteSpace($SourceDatabaseUrl) -and $SourceDatabaseUrl -eq $RestoreDatabaseUrl) {
  throw "Restore target matches source database. Restore drill blocked."
}
$archive = Get-Item -LiteralPath $BackupFile
if ($archive.Length -le 0) {
  throw "Backup archive is empty. Restore drill blocked."
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) { throw "pg_restore is required. Install PostgreSQL client tools." }
$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $psql) { throw "psql is required for count-only verification. Install PostgreSQL client tools." }

$startedAt = Get-Date
$sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupFile).Hash
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
$failedChecks = @()

if (-not $DryRun) {
  & pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$RestoreDatabaseUrl $BackupFile
  if ($LASTEXITCODE -ne 0) {
    $failedChecks += "pg_restore_exit_code"
  } else {
    foreach ($table in $coreTables) {
      $count = "QUERY_FAILED"
      $query = "select count(*)::text from $table;"
      $result = & psql $RestoreDatabaseUrl -t -A -c $query 2>$null
      if ($LASTEXITCODE -eq 0) {
        $countText = $null
        if ($null -ne $result) {
          $firstLine = @($result | Select-Object -First 1)
          if ($firstLine.Count -gt 0 -and $null -ne $firstLine[0]) {
            $countText = ([string]$firstLine[0]).Trim()
          }
        }
        if ($countText -match '^\d+$') {
          $count = $countText
        } else {
          $count = "INVALID_COUNT_RESULT"
          $failedChecks += "count_query:$table"
        }
      } else {
        $failedChecks += "count_query:$table"
      }
      $tableChecks += [ordered]@{
        table = $table
        countOnly = $true
        count = $count
        rawRowsReturned = $false
      }
    }
  }
} else {
  foreach ($table in $coreTables) {
    $tableChecks += [ordered]@{
      table = $table
      countOnly = $true
      count = "DRY_RUN"
      rawRowsReturned = $false
    }
  }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
$passed = (-not $DryRun) -and ($failedChecks.Count -eq 0) -and ($tableChecks.Count -eq $coreTables.Count) -and (@($tableChecks | Where-Object { $_.count -notmatch '^\d+$' }).Count -eq 0)

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v1"
  module = "Kingsmen Backup Restore Drill"
  status = $(if ($DryRun) { "DRY_RUN" } elseif ($passed) { "RESTORE_DRILL_PASSED" } else { "RESTORE_DRILL_FAILED" })
  passed = $passed
  failedChecks = $failedChecks
  backupArchiveBytes = $archive.Length
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFile = [System.IO.Path]::GetFileName($BackupFile)
  backupSha256 = $sha256
  databaseUrlRedacted = $true
  sourceAndRestoreTargetsDiffer = $true
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutes = "manual_capture_required"
  rtoSeconds = $rtoSeconds
  tableChecks = $tableChecks
  founderReviewRequired = $true
  nextAction = "Review counts-only report, confirm RPO/RTO, and store encrypted offsite backup evidence before production data."
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20

if (-not $passed) {
  throw "RESTORE_DRILL_FAILED: verification incomplete or dry run. Review the redacted report at $ReportPath."
}
