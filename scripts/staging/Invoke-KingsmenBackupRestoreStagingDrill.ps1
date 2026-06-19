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
  $script:KingsmenBackupRestoreStage = $Name
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

function Convert-OutputToText {
  param([object[]]$Output)
  if (-not $Output) { return "" }
  return (($Output | ForEach-Object { [string]$_ }) -join "`n")
}

function Convert-ToProcessArgumentString {
  param([string[]]$Arguments)
  $quoted = @()
  foreach ($argument in $Arguments) {
    $text = [string]$argument
    if ($text -match '^[A-Za-z0-9_./:@={}\-]+$') {
      $quoted += $text
      continue
    }
    $escaped = $text -replace '\\', '\\' -replace '"', '\"'
    $quoted += '"' + $escaped + '"'
  }
  return ($quoted -join ' ')
}

function Invoke-NativeText {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$Stage,
    [string]$StandardInput = $null
  )

  Write-Stage $Stage

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  $psi.Arguments = Convert-ToProcessArgumentString -Arguments $Arguments
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  if ($null -ne $StandardInput) { $psi.RedirectStandardInput = $true }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi

  if (-not $process.Start()) { throw "NATIVE_COMMAND_START_FAILED:$Stage" }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  if ($null -ne $StandardInput) {
    $process.StandardInput.Write($StandardInput)
    $process.StandardInput.Close()
  }

  $timeoutMs = [Math]::Max(1, $CommandTimeoutSeconds) * 1000
  if (-not $process.WaitForExit($timeoutMs)) {
    try { $process.Kill() } catch { }
    try { $process.WaitForExit(5000) | Out-Null } catch { }
    throw "NATIVE_COMMAND_TIMEOUT:${Stage}:$($CommandTimeoutSeconds)s"
  }

  $stdout = [string]$stdoutTask.Result
  $stderr = [string]$stderrTask.Result
  $text = (($stdout, $stderr | Where-Object { $_ }) -join "`n").Trim()

  if ($process.ExitCode -ne 0) {
    $safeErr = $text
    if ($safeErr.Length -gt 500) { $safeErr = $safeErr.Substring(0, 500) }
    throw "NATIVE_COMMAND_FAILED:${Stage}:exit=$($process.ExitCode):$safeErr"
  }

  return [string]$text
}

function Invoke-DockerText {
  param(
    [string[]]$Arguments,
    [string]$Stage = "docker_command"
  )
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE" }
  return Invoke-NativeText -FilePath $docker.Source -Arguments $Arguments -Stage $Stage
}

function Resolve-PostgresContainer {
  $candidates = @()
  if ($env:KINGSMEN_POSTGRES_CONTAINER) { $candidates += ([string]$env:KINGSMEN_POSTGRES_CONTAINER).Trim() }
  $candidates += "kingsmen-truth-vault-local"
  $candidates += "kingsmen-postgres-local"
  $candidates = $candidates | Where-Object { $_ } | Select-Object -Unique

  $lastError = ""
  foreach ($name in $candidates) {
    try {
      $status = ([string](Invoke-DockerText -Arguments @("inspect", "-f", "{{.State.Status}}", $name) -Stage "inspect_postgres_container_$name")).Trim()
      if ($status -eq "running") {
        $env:KINGSMEN_POSTGRES_CONTAINER = $name
        return @{ found = $true; name = $name; status = $status; error = "" }
      }
      $lastError = "CONTAINER_NOT_RUNNING:${name}:${status}"
    } catch {
      $lastError = ([string]$_.Exception.Message)
      if ($lastError.Length -gt 300) { $lastError = $lastError.Substring(0, 300) }
    }
  }

  try {
    $containerList = [string](Invoke-DockerText -Arguments @("ps", "-a", "--format", "{{.Names}}") -Stage "list_docker_containers")
    $names = $containerList -split "`n" | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ }
    foreach ($name in $names) {
      if ($name -match 'kingsmen.*(truth|postgres)|postgres.*kingsmen') {
        $status = ([string](Invoke-DockerText -Arguments @("inspect", "-f", "{{.State.Status}}", $name) -Stage "inspect_discovered_postgres_container_$name")).Trim()
        if ($status -eq "running") {
          $env:KINGSMEN_POSTGRES_CONTAINER = $name
          return @{ found = $true; name = $name; status = $status; error = "" }
        }
        $lastError = "DISCOVERED_CONTAINER_NOT_RUNNING:${name}:${status}"
      }
    }
  } catch {
    $lastError = ([string]$_.Exception.Message)
    if ($lastError.Length -gt 300) { $lastError = $lastError.Substring(0, 300) }
  }

  if (-not $lastError) { $lastError = "NO_KINGSMEN_POSTGRES_CONTAINER_FOUND" }
  return @{ found = $false; name = ""; status = ""; error = $lastError }
}

function Invoke-PsqlText {
  param([string]$DatabaseName, [string]$Sql, [string]$Stage = "psql_sql")
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE" }
  return Invoke-NativeText -FilePath $docker.Source -Arguments @("exec", "-i", $env:KINGSMEN_POSTGRES_CONTAINER, "psql", "-U", $env:KINGSMEN_POSTGRES_USER, "-d", $DatabaseName, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A") -Stage $Stage -StandardInput $Sql
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
  foreach ($line in ($lines -split "`n")) {
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

if (-not $env:KINGSMEN_POSTGRES_DATABASE) { $env:KINGSMEN_POSTGRES_DATABASE = "kingsmen_truth_vault" }
if (-not $env:KINGSMEN_POSTGRES_USER) { $env:KINGSMEN_POSTGRES_USER = "kingsmen" }

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) { Fail-Drill "DOCKER_NOT_AVAILABLE" }

$containerResolution = Resolve-PostgresContainer
if (-not $containerResolution.found) {
  Fail-Drill "POSTGRES_CONTAINER_NOT_AVAILABLE:$($containerResolution.error)"
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
  $checks += @{ name = "postgres_container_resolved"; passed = $true; detail = "container_running" }
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

  if (-not $PreserveRestoreDatabase) {
    Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "dropdb", "-U", $env:KINGSMEN_POSTGRES_USER, "--if-exists", $RestoreDatabaseName) -Stage "cleanup_restore_database" | Out-Null
    $checks += @{ name = "restore_database_cleaned_up"; passed = $true; detail = "restore_target_removed" }
  }

  Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "rm", "-f", $dumpPath) -Stage "remove_container_dump_file" | Out-Null
  $checks += @{ name = "container_dump_removed"; passed = $true; detail = "dump_not_left_in_container" }

  $allPassed = -not ($checks | Where-Object { $_.passed -ne $true })

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
  try {
    if ($env:KINGSMEN_POSTGRES_CONTAINER) {
      Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "rm", "-f", $dumpPath) -Stage "cleanup_after_exception_remove_dump" | Out-Null
    }
  } catch { }
  if (-not $PreserveRestoreDatabase -and $RestoreDatabaseName -and $RestoreDatabaseName -ne $env:KINGSMEN_POSTGRES_DATABASE -and $env:KINGSMEN_POSTGRES_CONTAINER) {
    try { Invoke-DockerText -Arguments @("exec", $env:KINGSMEN_POSTGRES_CONTAINER, "dropdb", "-U", $env:KINGSMEN_POSTGRES_USER, "--if-exists", $RestoreDatabaseName) -Stage "cleanup_after_exception_drop_restore_database" | Out-Null } catch { }
  }
  $safeReason = ([string]$_.Exception.Message)
  if ($safeReason.Length -gt 500) { $safeReason = $safeReason.Substring(0, 500) }
  $report = New-BackupRestoreReport -Status "PENDING_STAGING_CAPTURE" -Passed $false -Checks ($checks + @(@{ name = "backup_restore_exception"; passed = $false; detail = $safeReason })) -NextAction "Inspect Docker/PostgreSQL state, then rerun the backup/restore drill."
  Write-Report -Report $report
  Write-Output ($report | ConvertTo-Json -Depth 12)
  exit 1
}
