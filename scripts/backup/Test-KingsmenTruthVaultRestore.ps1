#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [string]$RestoreDatabaseUrl = $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL,
  [string]$SourceDatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$ReportPath = "reports/ops/backup-restore-staging-drill-latest.json",
  [switch]$ConfirmDestructiveRestore,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) {
  throw "KINGSMEN_DATABASE_URL is required so the source and restore targets can be compared. Do not print or commit the value."
}
if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
  throw "KINGSMEN_RESTORE_DRILL_DATABASE_URL is required. Do not use the source database as the restore target."
}
if (-not $DryRun -and -not $ConfirmDestructiveRestore) {
  throw "Destructive restore blocked. Re-run only against an approved disposable restore target with -ConfirmDestructiveRestore."
}
if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
if (-not $pgRestore) {
  throw "pg_restore is required for restore drill. Install PostgreSQL client tools."
}
$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $psql) {
  throw "psql is required for database identity and count-only verification queries."
}

# Do not compare raw connection strings: different users/passwords can point to
# the same database. Compare the identity returned by PostgreSQL itself and
# report only hashes of those identities.
$identityQuery = "select current_database() || '|' || coalesce(inet_server_addr()::text, 'local') || '|' || coalesce(inet_server_port()::text, '')"

$sourceIdentityOutput = & psql --no-password --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 --command=$identityQuery $SourceDatabaseUrl 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Could not verify the source database identity. No restore was attempted."
}
$sourceIdentity = (($sourceIdentityOutput | Out-String).Trim())
if ([string]::IsNullOrWhiteSpace($sourceIdentity) -or $sourceIdentity -notmatch '^[^|]+\|[^|]+\|[^|]*$') {
  throw "Source database identity response was invalid. No restore was attempted."
}

$restoreIdentityOutput = & psql --no-password --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 --command=$identityQuery $RestoreDatabaseUrl 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Could not verify the restore target database identity. No restore was attempted."
}
$restoreIdentity = (($restoreIdentityOutput | Out-String).Trim())
if ([string]::IsNullOrWhiteSpace($restoreIdentity) -or $restoreIdentity -notmatch '^[^|]+\|[^|]+\|[^|]*$') {
  throw "Restore target database identity response was invalid. No restore was attempted."
}
if ($sourceIdentity -eq $restoreIdentity) {
  throw "Restore target resolves to the source database. Restore drill blocked."
}

$sha256 = (Get-FileHash -Algorithm SHA256 -Path $BackupFile).Hash
& pg_restore --list $BackupFile > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Backup archive catalog verification failed. Restore was not attempted."
}

$sourceIdentityHash = [BitConverter]::ToString(
  ([System.Security.Cryptography.SHA256]::Create()).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($sourceIdentity))
).Replace("-", "").ToLowerInvariant()
$restoreIdentityHash = [BitConverter]::ToString(
  ([System.Security.Cryptography.SHA256]::Create()).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($restoreIdentity))
).Replace("-", "").ToLowerInvariant()

$startedAt = Get-Date
$restoreExecuted = $false
if (-not $DryRun) {
  # --exit-on-error prevents a partial restore from being treated as success.
  # This command is destructive to the target; an explicit switch is required.
  & pg_restore --exit-on-error --clean --if-exists --no-owner --no-privileges --dbname=$RestoreDatabaseUrl $BackupFile > $null 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore reported an error. The restore drill is failed; database URLs remain redacted."
  }
  $restoreExecuted = $true
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
  $query = "select count(*)::text from public.$table;"
  $result = & psql --no-password --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 --command=$query $RestoreDatabaseUrl 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "Count-only verification query failed for a required Truth Vault table. Restore drill is failed."
  }
  $count = (($result | Out-String).Trim())
  if ($count -notmatch '^\d+$') {
    throw "Count-only verification did not return a valid non-negative integer. Restore drill is failed."
  }
  $tableChecks += [ordered]@{
    table = $table
    countOnly = $true
    count = [long]$count
    rawRowsReturned = $false
    queryPassed = $true
  }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
$allChecksPassed = $tableChecks.Count -eq $coreTables.Count -and @($tableChecks | Where-Object { -not $_.queryPassed }).Count -eq 0
$drillPassed = $restoreExecuted -and $allChecksPassed

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v2"
  module = "Kingsmen Backup Restore Drill"
  status = $(if ($DryRun) { "DRY_RUN_PREFLIGHT_ONLY" } elseif ($drillPassed) { "RESTORE_DRILL_COMPLETED" } else { "RESTORE_DRILL_FAILED" })
  passed = $drillPassed
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  restoreExecuted = $restoreExecuted
  restoreTargetIdentityVerified = $true
  sourceAndRestoreTargetsDiffer = ($sourceIdentity -ne $restoreIdentity)
  sourceDatabaseIdentitySha256 = $sourceIdentityHash
  restoreDatabaseIdentitySha256 = $restoreIdentityHash
  backupArchiveCatalogVerified = $true
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFile = $BackupFile
  backupSha256 = $sha256
  databaseUrlRedacted = $true
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutes = "manual_capture_required"
  rtoSeconds = $rtoSeconds
  tableChecks = $tableChecks
  countChecksComplete = $allChecksPassed
  founderReviewRequired = $true
  evidenceLimit = "Counts prove required tables are readable after restore; source-to-restore row parity and Storage-object parity require separate approved evidence."
  nextAction = $(if ($DryRun) { "Preflight only. Run an approved restore with -ConfirmDestructiveRestore against a disposable target, then review counts, RPO/RTO and Storage evidence." } else { "Review counts-only report, confirm RPO/RTO and Storage-object recovery, and store offsite evidence before production data." })
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20

if (-not $drillPassed) {
  if ($DryRun) { exit 0 }
  throw "Restore drill did not complete all required steps. Do not mark the backup/restore gate complete."
}
