param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ReportPath = "reports/staging/backup-restore-drill-staging-latest.json",
  [string]$RestoreDatabaseName = "",
  [int]$CommandTimeoutSeconds = 180,
  [switch]$MarkOperatorReviewed,
  [switch]$PreserveRestoreDatabase
)

$ErrorActionPreference = "Stop"

function Write-Stage {
  param([string]$Name)
  Write-Output "KINGSMEN_BACKUP_RESTORE_STAGE=$Name"
}

function Import-LocalRuntimeEnv {
  $envPath = Join-Path $RepoRoot ".local/kingsmen.local-postgres.env"
  if (-not (Test-Path $envPath)) { return }
  foreach ($line in Get-Content -Path $envPath) {
    if ($line -match '^[A-Z0-9_]+=') {
      $parts = $line -split '=', 2
      $name = $parts[0]
      $value = $parts[1]
      if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}

function New-BackupRestoreReport {
  param(
    [string]$Status,
    [bool]$Passed,
    [array]$Checks,
    [string]$NextAction,
    [hashtable]$Metrics = @{}
  )

  return [ordered]@{
    schema = "kingsmen.staging-runtime-evidence-report.v1"
    module = "Backup Restore Drill Staging Evidence"
    status = $Status
    passed = $Passed
    reviewed = [bool]$MarkOperatorReviewed
    stagingReviewed = [bool]$MarkOperatorReviewed
    redacted = $true
    productionReady = $false
    publicLaunchAllowed = $false
    rawSecretsPrinted = $false
    rawCandidateDataPrinted = $false
    providerCredentialsPrinted = $false
    backupCommittedToGit = $false
    restoreTargetMatchesSource = $false
    countOnly = $true
    checks = $Checks
    metrics = $Metrics
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    nextAction = $NextAction
  }
}

function Write-Report {
  param([object]$Report)
  $fullPath = Join-Path $RepoRoot $ReportPath
  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Report | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -Path $fullPath
}

function Fail-Drill {
  param([string]$Reason)
  $report = New-BackupRestoreReport -Status "PENDING_STAGING_CAPTURE" -Passed $false -Checks @(@{ name = "backup_restore_drill"; passed = $false; detail = $Reason }) -NextAction "Fix the backup/restore drill prerequisite, then rerun Invoke-KingsmenBackupRestoreStagingDrill.ps1."
  Write-Report -Report $report
  Write-Output ($report | ConvertTo-Json -Depth 12)
  exit 1
}

function Invoke-DockerText {
  param(
    [string[]]$Arguments,
    [string]$Stage = "docker_command"
  )
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE" }

  Write-Stage $Stage

  $id = [Guid]::NewGuid().ToString("N")
  $stdoutPath = Join-Path $env:TEMP "kingsmen-docker-$id.out"
  $stderrPath = Join-Path $env:TEMP "kingsmen-docker-$id.err"

  try {
    $process = Start-Process -FilePath $docker.Source -ArgumentList $Arguments -NoNewWindow -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $completed = $process.WaitForExit($CommandTimeoutSeconds * 1000)
    if (-not $completed) {
      try { $process.Kill() } catch { }
      throw "DOCKER_COMMAND_TIMEOUT:$Stage"
    }

    $stdout = if (Test-Path $stdoutPath) { Get-Content -Raw -Path $stdoutPath } else { "" }
    $stderr = if (Test-Path $stderrPath) { Get-Content -Raw -Path $stderrPath } else { "" }

    if ($process.ExitCode -ne 0) {
      $safeErr = ([string]$stderr).Trim()
      if ($safeErr.Length -gt 500) { $safeErr = $safeErr.Substring(0, 500) }
      throw "DOCKER_COMMAND_FAILED:$Stage:$safeErr"
    }

    return $stdout
  } finally {
    try { Remove-Item -Force -ErrorAction SilentlyContinue $stdoutPath, $stderrPath } catch { }
  }
}

function Invoke-PsqlText {
  param([string]$DatabaseName, [string]$Sql, [string]$Stage = "psql_sql")
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE" }
  Write-Stage $Stage
  $Sql | & $docker.Source exec -i $env:KINGSMEN_POSTGRES_CONTAINER psql -U $env:KINGSMEN_POSTGRES_USER -d $DatabaseName -v ON_ERROR_STOP=1 -q -t -A
  if ($LASTEXITCODE -ne 0) { throw "PSQL_SQL_FAILED:$Stage" }
}

function Get-TableCounts {
  param([string]$DatabaseName)
  $sql = @'
SELECT 'candidates=' || count(*) FROM public.candidates;
SELECT 'applications=' || count(*) FROM public.applications;
SELECT 'evidence_ledger=' || count(*) FROM public.evidence_ledger;
SELECT 'workflow_runs=' || count(*) FROM public.workflow_runs;
SELECT 'audit_events=' || count(*) FROM public.audit_events;
SELECT 'production_readiness_checks=' || count(*) FROM public.production_readiness_checks;
'@
  $lines = Invoke-PsqlText -DatabaseName $DatabaseName -Sql $sql -Stage "capture_counts_$DatabaseName"
  $counts = @{}
  foreach ($line in $lines) {
    $text = ([string]$line).Trim()
    if (-not $text -or $text -notmatch '=') { continue }
    $parts = $text -split '=', 2
    $counts[$parts[0]] = [int]$parts[1]
  }
  return $counts
}

function Compare-Counts {
  param([hashtable]$SourceCounts, [hashtable]$RestoreCounts)
  $checks = @()
  foreach ($key in $SourceCounts.Keys) {
    $source = [int]$SourceCounts[$key]
    $restore = [int]$RestoreCounts[$key]
    $checks += @{ name = "count_match_$key"; passed = ($source -eq $restore); detail = "source=$source restore=$restore" }
  }
  return $checks
}

Import-LocalRuntimeEnv

if (-not $env:KINGSMEN_POSTGRES_CONTAINER) { Fail-Drill "KINGSMEN_POSTGRES_CONTAINER_NOT_CONFIGURED" }
if (-not $env:KINGSMEN_POSTGRES_DATABASE) { Fail-Drill "KINGSMEN_POSTGRES_DATABASE_NOT_CONFIGURED" }
if (-not $env:KINGSMEN_POSTGRES_USER) { Fail-Drill "KINGSMEN_POSTGRES_USER_NOT_CONFIGURED" }

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) { Fail-Drill "DOCKER_NOT_AVAILABLE" }

try {
  Invoke-DockerText -Arguments @("inspect", $env:KINGSMEN_POSTGRES_CONTAINER) -Stage "inspect_postgres_container" | Out-Null
} catch {
  Fail-Drill "POSTGRES_CONTAINER_NOT_AVAILABLE"
}

if (-not $RestoreDatabaseName) {
  $RestoreDatabaseName = "kingsmen_restore_drill_" + (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
}

if ($RestoreDatabaseName -eq $env:KINGSMEN_POSTGRES_DATABASE) {
  Fail-Drill "RESTORE_TARGET_MATCHES_SOURCE_DATABASE"
}

$dumpPath = "/tmp/kingsmen-backup-restore-drill-$($RestoreDatabaseName).dump"
$startedAt = Get-Date
$sourceCounts = @{}
$restoreCounts = @{}
$checks = @()

try {
  $sourceCounts = Get-TableCounts -DatabaseName $env:KINGSMEN_POSTGRES_DATABASE
  $checks += @{ name = "source_counts_captured"; passed = $true; detail = "count_only" }

  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "pg_dump", "-U", $env:KINGSMEN_POSTGRES_USER, "-d", $env:KINGSMEN_POSTGRES_DATABASE, "-Fc", "-f", $dumpPath) -Stage "pg_dump_source_database" | Out-Null
  $checks += @{ name = "pg_dump_completed"; passed = $true; detail = "custom_format_dump_inside_container" }

  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "dropdb", "-U", $env:KINGSMEN_POSTGRES_USER, "--if-exists", $RestoreDatabaseName) -Stage "drop_existing_restore_database" | Out-Null
  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "createdb", "-U", $env:KINGSMEN_POSTGRES_USER, $RestoreDatabaseName) -Stage "create_restore_database" | Out-Null
  $checks += @{ name = "restore_database_created"; passed = $true; detail = "separate_restore_target" }

  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "pg_restore", "-U", $env:KINGSMEN_POSTGRES_USER, "-d", $RestoreDatabaseName, "--clean", "--if-exists", $dumpPath) -Stage "pg_restore_into_restore_database" | Out-Null
  $checks += @{ name = "pg_restore_completed"; passed = $true; detail = "restored_to_separate_database" }

  $restoreCounts = Get-TableCounts -DatabaseName $RestoreDatabaseName
  $checks += @{ name = "restore_counts_captured"; passed = $true; detail = "count_only" }
  $checks += Compare-Counts -SourceCounts $sourceCounts -RestoreCounts $restoreCounts

  $elapsed = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 3)
  $allPassed = -not ($checks | Where-Object { $_.passed -ne $true })

  if (-not $PreserveRestoreDatabase) {
    Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "dropdb", "-U", $env:KINGSMEN_POSTGRES_USER, "--if-exists", $RestoreDatabaseName) -Stage "cleanup_restore_database" | Out-Null
    $checks += @{ name = "restore_database_cleaned_up"; passed = $true; detail = "restore_target_removed" }
  }

  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "rm", "-f", $dumpPath) -Stage "remove_container_dump_file" | Out-Null
  $checks += @{ name = "container_dump_removed"; passed = $true; detail = "dump_not_left_in_container" }

  $metrics = @{
    rtoSeconds = $elapsed
    rpoEvidence = "local_staging_drill_dump_completed"
    sourceTableCount = $sourceCounts.Keys.Count
    restoreTableCount = $restoreCounts.Keys.Count
    restoreDatabasePreserved = [bool]$PreserveRestoreDatabase
    commandTimeoutSeconds = $CommandTimeoutSeconds
  }

  $report = New-BackupRestoreReport -Status ($(if ($allPassed) { "BACKUP_RESTORE_STAGING_DRILL_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed ([bool]$allPassed) -Checks $checks -Metrics $metrics -NextAction "Backup/restore drill passed. Continue to secrets runtime health proof."
  Write-Report -Report $report
  Write-Output ($report | ConvertTo-Json -Depth 12)
  if (-not $allPassed) { exit 1 }
} catch {
  try { Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "rm", "-f", $dumpPath) -Stage "cleanup_after_exception_remove_dump" | Out-Null } catch { }
  if (-not $PreserveRestoreDatabase -and $RestoreDatabaseName -and $RestoreDatabaseName -ne $env:KINGSMEN_POSTGRES_DATABASE) {
    try { Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "dropdb", "-U", $env:KINGSMEN_POSTGRES_USER, "--if-exists", $RestoreDatabaseName) -Stage "cleanup_after_exception_drop_restore_database" | Out-Null } catch { }
  }
  $safeReason = ([string]$_.Exception.Message)
  if ($safeReason.Length -gt 500) { $safeReason = $safeReason.Substring(0, 500) }
  $report = New-BackupRestoreReport -Status "PENDING_STAGING_CAPTURE" -Passed $false -Checks ($checks + @(@{ name = "backup_restore_exception"; passed = $false; detail = $safeReason })) -NextAction "Inspect Docker/PostgreSQL state, then rerun the backup/restore drill."
  Write-Report -Report $report
  Write-Output ($report | ConvertTo-Json -Depth 12)
  exit 1
}
