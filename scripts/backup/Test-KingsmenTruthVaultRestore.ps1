#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [string]$RestoreDatabaseUrl = $env:KINGSMEN_RESTORE_DRILL_DATABASE_URL,
  [string]$SourceDatabaseUrl = $env:KINGSMEN_DATABASE_URL,
  [string]$SourceProjectRef = $env:KINGSMEN_EXPECTED_SUPABASE_PROJECT_REF,
  [string]$RestoreProjectRef = $env:KINGSMEN_RESTORE_EXPECTED_SUPABASE_PROJECT_REF,
  [string]$SourceEnvironment = $env:KINGSMEN_BACKUP_ENVIRONMENT,
  [string]$RestoreEnvironment = $env:KINGSMEN_RESTORE_ENVIRONMENT,
  [string]$ExpectedSha256 = $env:KINGSMEN_BACKUP_EXPECTED_SHA256,
  [string]$ReportPath = "reports/ops/backup-restore-staging-drill-latest.json",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$startedAt = Get-Date
$endedAt = $startedAt
$failureReasons = @()
$tableChecks = @()
$backupSha256 = "NOT_COMPUTED"
$checksumMatches = $false
$archiveValidated = $false
$targetsDiffer = $false
$sourceAndRestoreAreStaging = $false
$allTableChecksPassed = $false
$passed = $false
$rtoSeconds = 0
$rpoMinutesEstimate = $null
$temporaryPlaintext = $null
$restoreInputFile = $null
$sourceIdentity = $null
$restoreIdentity = $null

try {
  if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) { throw "KINGSMEN_RESTORE_DRILL_DATABASE_URL_REQUIRED" }
  if ([string]::IsNullOrWhiteSpace($SourceDatabaseUrl)) { throw "KINGSMEN_DATABASE_URL_REQUIRED" }
  if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) { throw "BACKUP_FILE_MISSING" }
  if ($SourceEnvironment -ne "staging") { throw "SOURCE_ENVIRONMENT_MUST_BE_STAGING" }
  if ($RestoreEnvironment -ne "staging") { throw "RESTORE_ENVIRONMENT_MUST_BE_STAGING" }
  if ([string]::IsNullOrWhiteSpace($SourceProjectRef) -or $SourceProjectRef -notmatch '^[a-z0-9]{20}
  if ([string]::IsNullOrWhiteSpace($RestoreProjectRef) -or $RestoreProjectRef -notmatch '^[a-z0-9]{20}$') { throw "RESTORE_STAGING_PROJECT_REF_REQUIRED" }
  if ($SourceProjectRef -eq $RestoreProjectRef) { throw "SOURCE_AND_RESTORE_PROJECT_REFS_MUST_DIFFER" }
  if ($SourceDatabaseUrl -notmatch [regex]::Escape($SourceProjectRef)) { throw "SOURCE_URL_DOES_NOT_MATCH_EXPECTED_STAGING_PROJECT" }
  if ($RestoreDatabaseUrl -notmatch [regex]::Escape($RestoreProjectRef)) { throw "RESTORE_URL_DOES_NOT_MATCH_EXPECTED_STAGING_PROJECT" }
  $sourceAndRestoreAreStaging = $true

  if (-not $DryRun -and [string]::IsNullOrWhiteSpace($ExpectedSha256)) { throw "EXPECTED_BACKUP_SHA256_REQUIRED" }
  if (-not $DryRun -and $ExpectedSha256 -notmatch '^[A-Fa-f0-9]{64}$') { throw "EXPECTED_BACKUP_SHA256_INVALID" }

  $pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
  $psql = Get-Command "psql" -ErrorAction SilentlyContinue
  $gpg = Get-Command "gpg" -ErrorAction SilentlyContinue
  if (-not $pgRestore) { throw "PG_RESTORE_REQUIRED" }
  if (-not $psql) { throw "PSQL_REQUIRED" }
  if (-not $DryRun -and -not $gpg) { throw "GPG_REQUIRED_FOR_ENCRYPTED_BACKUP" }
  if (-not $BackupFile.EndsWith(".gpg", [StringComparison]::OrdinalIgnoreCase)) { throw "ENCRYPTED_GPG_BACKUP_REQUIRED" }

  $backupSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupFile).Hash
  if (-not $DryRun) {
    $checksumMatches = ($backupSha256 -ieq $ExpectedSha256)
    if (-not $checksumMatches) { throw "BACKUP_SHA256_MISMATCH" }
  }

  if (-not $DryRun) {
    $identityQuery = "select current_database() || '|' || coalesce(inet_server_addr()::text, 'local') || '|' || current_setting('port');"
    $sourceOutput = & psql $SourceDatabaseUrl -t -A -c $identityQuery 2>$null
    $sourceExitCode = $LASTEXITCODE
    $sourceIdentity = ($sourceOutput | Select-Object -First 1)
    if ($sourceExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($sourceIdentity)) { throw "SOURCE_DATABASE_IDENTITY_UNVERIFIED" }

    $restoreOutput = & psql $RestoreDatabaseUrl -t -A -c $identityQuery 2>$null
    $restoreExitCode = $LASTEXITCODE
    $restoreIdentity = ($restoreOutput | Select-Object -First 1)
    if ($restoreExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($restoreIdentity)) { throw "RESTORE_DATABASE_IDENTITY_UNVERIFIED" }

    $targetsDiffer = ($sourceIdentity.Trim() -ne $restoreIdentity.Trim())
    if (-not $targetsDiffer) { throw "SOURCE_AND_RESTORE_DATABASE_IDENTITIES_MATCH" }

    $temporaryPlaintext = Join-Path ([IO.Path]::GetTempPath()) ("kingsmen-restore-" + [guid]::NewGuid().ToString("N") + ".dump")
    & gpg --batch --yes --decrypt --output $temporaryPlaintext $BackupFile *> $null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temporaryPlaintext -PathType Leaf)) { throw "GPG_DECRYPT_FAILED" }
    $restoreInputFile = $temporaryPlaintext
  }

  if ($DryRun) {
    # Dry-run validates only the encrypted file's presence and metadata; it does not claim archive or restore proof.
    $restoreInputFile = $null
  } else {
    & pg_restore --list $restoreInputFile *> $null
    if ($LASTEXITCODE -ne 0) { throw "PG_RESTORE_ARCHIVE_VALIDATION_FAILED" }
    $archiveValidated = $true

    & pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$RestoreDatabaseUrl $restoreInputFile
    if ($LASTEXITCODE -ne 0) { throw "PG_RESTORE_FAILED" }

    $coreTables = @("candidates", "applications", "idempotency_keys", "command_log", "workflow_runs", "evidence_ledger", "audit_events", "dead_letter_queue", "approval_requests")
    foreach ($table in $coreTables) {
      $query = "select case when to_regclass('public.$table') is null then 'MISSING' else (select count(*)::text from public.$table) end;"
      $result = & psql $RestoreDatabaseUrl -t -A -c $query 2>$null
      $queryExitCode = $LASTEXITCODE
      $value = (($result | Select-Object -First 1) -as [string])
      if ($null -ne $value) { $value = $value.Trim() }
      $queryPassed = ($queryExitCode -eq 0 -and $value -match '^\d+$')
      if (-not $queryPassed) {
        if ($queryExitCode -ne 0) { $value = "QUERY_FAILED" }
        $failureReasons += "TABLE_CHECK_FAILED_$($table.ToUpper())"
      }
      $tableChecks += [ordered]@{
        table = $table
        countOnly = $true
        count = $(if ($queryPassed) { $value } else { $value })
        queryPassed = $queryPassed
        rawRowsReturned = $false
      }
    }
    $allTableChecksPassed = ($tableChecks.Count -eq 9) -and (@($tableChecks | Where-Object { -not $_.queryPassed }).Count -eq 0)
    if (-not $allTableChecksPassed) { throw "REQUIRED_TABLE_CHECKS_FAILED" }
    $rpoMinutesEstimate = [math]::Round(($startedAt - (Get-Item -LiteralPath $BackupFile).LastWriteTime).TotalMinutes, 2)
    $passed = $archiveValidated -and $checksumMatches -and $targetsDiffer -and $sourceAndRestoreAreStaging -and $allTableChecksPassed
  }
}
catch {
  $failureReasons += $_.Exception.Message
  $passed = $false
}
finally {
  if ($temporaryPlaintext -and (Test-Path -LiteralPath $temporaryPlaintext -PathType Leaf)) {
    Remove-Item -LiteralPath $temporaryPlaintext -Force -ErrorAction SilentlyContinue
  }
  $endedAt = Get-Date
  $rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
}

if ($DryRun) { $status = "DRY_RUN_NOT_PROOF" }
elseif ($passed) { $status = "RESTORE_DRILL_PASSED" }
else { $status = "RESTORE_DRILL_FAILED" }

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v3"
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
  databaseIdentitiesRedacted = $true
  sourceAndRestoreProjectRefsDiffer = ($SourceProjectRef -ne $RestoreProjectRef)
  sourceAndRestoreTargetsDiffer = $targetsDiffer
  sourceAndRestoreAreStaging = $sourceAndRestoreAreStaging
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutesEstimateFromBackupFileTimestamp = $rpoMinutesEstimate
  rpoRequiresIndependentConfirmation = $true
  rtoSeconds = $rtoSeconds
  allRequiredTableChecksPassed = $allTableChecksPassed
  tableChecks = $tableChecks
  failureReasons = $failureReasons
  founderReviewRequired = $true
  nextAction = "Review redacted report; independently confirm RPO, offsite retention, encryption, and access controls."
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs and database identities are redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20
if (-not $passed) { exit 1 }
) { throw "SOURCE_STAGING_PROJECT_REF_REQUIRED" }
  if ([string]::IsNullOrWhiteSpace($RestoreProjectRef) -or $RestoreProjectRef -notmatch '^[a-z0-9]{20}$') { throw "RESTORE_STAGING_PROJECT_REF_REQUIRED" }
  if ($SourceProjectRef -eq $RestoreProjectRef) { throw "SOURCE_AND_RESTORE_PROJECT_REFS_MUST_DIFFER" }
  if ($SourceDatabaseUrl -notmatch [regex]::Escape($SourceProjectRef)) { throw "SOURCE_URL_DOES_NOT_MATCH_EXPECTED_STAGING_PROJECT" }
  if ($RestoreDatabaseUrl -notmatch [regex]::Escape($RestoreProjectRef)) { throw "RESTORE_URL_DOES_NOT_MATCH_EXPECTED_STAGING_PROJECT" }
  $sourceAndRestoreAreStaging = $true

  if (-not $DryRun -and [string]::IsNullOrWhiteSpace($ExpectedSha256)) { throw "EXPECTED_BACKUP_SHA256_REQUIRED" }
  if (-not $DryRun -and $ExpectedSha256 -notmatch '^[A-Fa-f0-9]{64}$') { throw "EXPECTED_BACKUP_SHA256_INVALID" }

  $pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
  $psql = Get-Command "psql" -ErrorAction SilentlyContinue
  $gpg = Get-Command "gpg" -ErrorAction SilentlyContinue
  if (-not $pgRestore) { throw "PG_RESTORE_REQUIRED" }
  if (-not $psql) { throw "PSQL_REQUIRED" }
  if (-not $DryRun -and -not $gpg) { throw "GPG_REQUIRED_FOR_ENCRYPTED_BACKUP" }
  if (-not $BackupFile.EndsWith(".gpg", [StringComparison]::OrdinalIgnoreCase)) { throw "ENCRYPTED_GPG_BACKUP_REQUIRED" }

  $backupSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupFile).Hash
  if (-not $DryRun) {
    $checksumMatches = ($backupSha256 -ieq $ExpectedSha256)
    if (-not $checksumMatches) { throw "BACKUP_SHA256_MISMATCH" }
  }

  if (-not $DryRun) {
    $identityQuery = "select current_database() || '|' || coalesce(inet_server_addr()::text, 'local') || '|' || current_setting('port');"
    $sourceOutput = & psql $SourceDatabaseUrl -t -A -c $identityQuery 2>$null
    $sourceExitCode = $LASTEXITCODE
    $sourceIdentity = ($sourceOutput | Select-Object -First 1)
    if ($sourceExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($sourceIdentity)) { throw "SOURCE_DATABASE_IDENTITY_UNVERIFIED" }

    $restoreOutput = & psql $RestoreDatabaseUrl -t -A -c $identityQuery 2>$null
    $restoreExitCode = $LASTEXITCODE
    $restoreIdentity = ($restoreOutput | Select-Object -First 1)
    if ($restoreExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($restoreIdentity)) { throw "RESTORE_DATABASE_IDENTITY_UNVERIFIED" }

    $targetsDiffer = ($sourceIdentity.Trim() -ne $restoreIdentity.Trim())
    if (-not $targetsDiffer) { throw "SOURCE_AND_RESTORE_DATABASE_IDENTITIES_MATCH" }

    $temporaryPlaintext = Join-Path ([IO.Path]::GetTempPath()) ("kingsmen-restore-" + [guid]::NewGuid().ToString("N") + ".dump")
    & gpg --batch --yes --decrypt --output $temporaryPlaintext $BackupFile *> $null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temporaryPlaintext -PathType Leaf)) { throw "GPG_DECRYPT_FAILED" }
    $restoreInputFile = $temporaryPlaintext
  }

  if ($DryRun) {
    # Dry-run validates only the encrypted file's presence and metadata; it does not claim archive or restore proof.
    $restoreInputFile = $null
  } else {
    & pg_restore --list $restoreInputFile *> $null
    if ($LASTEXITCODE -ne 0) { throw "PG_RESTORE_ARCHIVE_VALIDATION_FAILED" }
    $archiveValidated = $true

    & pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$RestoreDatabaseUrl $restoreInputFile
    if ($LASTEXITCODE -ne 0) { throw "PG_RESTORE_FAILED" }

    $coreTables = @("candidates", "applications", "idempotency_keys", "command_log", "workflow_runs", "evidence_ledger", "audit_events", "dead_letter_queue", "approval_requests")
    foreach ($table in $coreTables) {
      $query = "select case when to_regclass('public.$table') is null then 'MISSING' else (select count(*)::text from public.$table) end;"
      $result = & psql $RestoreDatabaseUrl -t -A -c $query 2>$null
      $queryExitCode = $LASTEXITCODE
      $value = (($result | Select-Object -First 1) -as [string])
      if ($null -ne $value) { $value = $value.Trim() }
      $queryPassed = ($queryExitCode -eq 0 -and $value -match '^\d+$')
      if (-not $queryPassed) {
        if ($queryExitCode -ne 0) { $value = "QUERY_FAILED" }
        $failureReasons += "TABLE_CHECK_FAILED_$($table.ToUpper())"
      }
      $tableChecks += [ordered]@{
        table = $table
        countOnly = $true
        count = $(if ($queryPassed) { $value } else { $value })
        queryPassed = $queryPassed
        rawRowsReturned = $false
      }
    }
    $allTableChecksPassed = ($tableChecks.Count -eq 9) -and (@($tableChecks | Where-Object { -not $_.queryPassed }).Count -eq 0)
    if (-not $allTableChecksPassed) { throw "REQUIRED_TABLE_CHECKS_FAILED" }
    $rpoMinutesEstimate = [math]::Round(($startedAt - (Get-Item -LiteralPath $BackupFile).LastWriteTime).TotalMinutes, 2)
    $passed = $archiveValidated -and $checksumMatches -and $targetsDiffer -and $sourceAndRestoreAreStaging -and $allTableChecksPassed
  }
}
catch {
  $failureReasons += $_.Exception.Message
  $passed = $false
}
finally {
  if ($temporaryPlaintext -and (Test-Path -LiteralPath $temporaryPlaintext -PathType Leaf)) {
    Remove-Item -LiteralPath $temporaryPlaintext -Force -ErrorAction SilentlyContinue
  }
  $endedAt = Get-Date
  $rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
}

if ($DryRun) { $status = "DRY_RUN_NOT_PROOF" }
elseif ($passed) { $status = "RESTORE_DRILL_PASSED" }
else { $status = "RESTORE_DRILL_FAILED" }

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v3"
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
  databaseIdentitiesRedacted = $true
  sourceAndRestoreProjectRefsDiffer = ($SourceProjectRef -ne $RestoreProjectRef)
  sourceAndRestoreTargetsDiffer = $targetsDiffer
  sourceAndRestoreAreStaging = $sourceAndRestoreAreStaging
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  rpoMinutesEstimateFromBackupFileTimestamp = $rpoMinutesEstimate
  rpoRequiresIndependentConfirmation = $true
  rtoSeconds = $rtoSeconds
  allRequiredTableChecksPassed = $allTableChecksPassed
  tableChecks = $tableChecks
  failureReasons = $failureReasons
  founderReviewRequired = $true
  nextAction = "Review redacted report; independently confirm RPO, offsite retention, encryption, and access controls."
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Restore drill report written. Database URLs and database identities are redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20
if (-not $passed) { exit 1 }
