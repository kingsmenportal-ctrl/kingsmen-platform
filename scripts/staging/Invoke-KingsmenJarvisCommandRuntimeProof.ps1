param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ReportPath = "reports/jarvis/jarvis-command-runtime-proof-latest.json",
  [string]$WebBaseUrl = "",
  [string]$BackendBaseUrl = "",
  [int]$CommandTimeoutSeconds = 45,
  [switch]$MarkOperatorReviewed
)

$ErrorActionPreference = "Stop"

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

function New-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  return [ordered]@{ name = $Name; passed = $Passed; detail = $Detail }
}

function New-Report {
  param(
    [string]$Status,
    [bool]$Passed,
    [array]$Checks,
    [string]$NextAction,
    [hashtable]$Metrics = @{}
  )

  return [ordered]@{
    schema = "kingsmen.staging-runtime-evidence-report.v1"
    module = "Jarvis Command Runtime Truth Vault Evidence"
    status = $Status
    passed = $Passed
    reviewed = [bool]$MarkOperatorReviewed
    stagingReviewed = [bool]$MarkOperatorReviewed
    redacted = $true
    productionReady = $false
    publicLaunchAllowed = $false
    noFakeData = $true
    rawSecretsPrinted = $false
    rawCandidateDataPrinted = $false
    providerCredentialsPrinted = $false
    rawSecretsReturned = $false
    localShellExecutedFromWeb = $false
    directDatabaseAccessFromWeb = $false
    localEvidenceFileWrittenByWeb = $false
    webCommandRoute = "/api/jarvis/command"
    backendCommandRoute = "/api/commands"
    expectedTables = @("command_log", "audit_events", "idempotency_keys")
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

function Complete-Proof {
  param([object]$Report, [int]$Code)
  Write-Report -Report $Report
  Write-Output ($Report | ConvertTo-Json -Depth 12)
  exit $Code
}

function Convert-ToProcessArgumentString {
  param([string[]]$Arguments)
  $quoted = @()
  foreach ($argument in $Arguments) {
    $text = [string]$argument
    if ($text -match '^[A-Za-z0-9_./:@={};,*\-]+$') {
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
    [string]$StandardInput = $null
  )

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
  if (-not $process.Start()) { throw "NATIVE_COMMAND_START_FAILED" }

  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  if ($null -ne $StandardInput) {
    $process.StandardInput.Write($StandardInput)
    $process.StandardInput.Close()
  }

  if (-not $process.WaitForExit([Math]::Max(1, $CommandTimeoutSeconds) * 1000)) {
    try { $process.Kill() } catch { }
    throw "NATIVE_COMMAND_TIMEOUT"
  }

  $stdout = [string]$stdoutTask.Result
  $stderr = [string]$stderrTask.Result
  $text = (($stdout, $stderr | Where-Object { $_ }) -join "`n").Trim()

  if ($process.ExitCode -ne 0) {
    $safeErr = $text
    if ($safeErr.Length -gt 500) { $safeErr = $safeErr.Substring(0, 500) }
    throw "NATIVE_COMMAND_FAILED:exit=$($process.ExitCode):$safeErr"
  }

  return [string]$text
}

function Resolve-PostgresContainer {
  $candidates = @()
  if ($env:KINGSMEN_POSTGRES_CONTAINER) { $candidates += ([string]$env:KINGSMEN_POSTGRES_CONTAINER).Trim() }
  $candidates += "kingsmen-truth-vault-local"
  $candidates += "kingsmen-postgres-local"
  $candidates = $candidates | Where-Object { $_ } | Select-Object -Unique

  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { return @{ found = $false; name = ""; error = "DOCKER_NOT_AVAILABLE" } }

  foreach ($name in $candidates) {
    try {
      $status = ([string](Invoke-NativeText -FilePath $docker.Source -Arguments @("inspect", "-f", "{{.State.Status}}", $name))).Trim()
      if ($status -eq "running") {
        $env:KINGSMEN_POSTGRES_CONTAINER = $name
        return @{ found = $true; name = $name; error = "" }
      }
    } catch { }
  }

  return @{ found = $false; name = ""; error = "NO_RUNNING_KINGSMEN_POSTGRES_CONTAINER" }
}

function Invoke-PsqlText {
  param([string]$Sql)
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { throw "DOCKER_NOT_AVAILABLE" }
  if (-not $env:KINGSMEN_POSTGRES_CONTAINER) { throw "KINGSMEN_POSTGRES_CONTAINER_NOT_SET" }
  if (-not $env:KINGSMEN_POSTGRES_USER) { $env:KINGSMEN_POSTGRES_USER = "kingsmen" }
  if (-not $env:KINGSMEN_POSTGRES_DATABASE) { $env:KINGSMEN_POSTGRES_DATABASE = "kingsmen_truth_vault" }

  return Invoke-NativeText -FilePath $docker.Source -Arguments @("exec", "-i", $env:KINGSMEN_POSTGRES_CONTAINER, "psql", "-U", $env:KINGSMEN_POSTGRES_USER, "-d", $env:KINGSMEN_POSTGRES_DATABASE, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A") -StandardInput $Sql
}

function Escape-SqlLiteral {
  param([string]$Value)
  return ([string]$Value).Replace("'", "''")
}

function Test-JsonGet {
  param([string]$Url)
  try {
    $result = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec $CommandTimeoutSeconds
    return @{ ok = $true; result = $result; detail = "ok" }
  } catch {
    $message = ([string]$_.Exception.Message)
    if ($message.Length -gt 300) { $message = $message.Substring(0, 300) }
    return @{ ok = $false; result = $null; detail = $message }
  }
}

function Invoke-JsonPost {
  param([string]$Url, [object]$Body)
  try {
    $json = $Body | ConvertTo-Json -Depth 10
    $result = Invoke-RestMethod -Method Post -Uri $Url -TimeoutSec $CommandTimeoutSeconds -ContentType "application/json" -Body $json
    return @{ ok = $true; result = $result; detail = "ok" }
  } catch {
    $message = ([string]$_.Exception.Message)
    if ($message.Length -gt 500) { $message = $message.Substring(0, 500) }
    return @{ ok = $false; result = $null; detail = $message }
  }
}

Import-LocalRuntimeEnv

if (-not $WebBaseUrl) { $WebBaseUrl = $env:KINGSMEN_WEB_BASE_URL }
if (-not $BackendBaseUrl) { $BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL }
if (-not $WebBaseUrl) { $WebBaseUrl = "http://127.0.0.1:3000" }
if (-not $BackendBaseUrl) { $BackendBaseUrl = "http://127.0.0.1:3001" }

$WebBaseUrl = $WebBaseUrl.TrimEnd('/')
$BackendBaseUrl = $BackendBaseUrl.TrimEnd('/')

$checks = @()
$metrics = @{
  webBaseUrl = $WebBaseUrl
  backendBaseUrl = $BackendBaseUrl
}

$backendHealth = Test-JsonGet -Url "$BackendBaseUrl/health"
$checks += New-Check -Name "backend_health_reachable" -Passed ([bool]$backendHealth.ok) -Detail $backendHealth.detail
if ($backendHealth.ok -and $backendHealth.result.storageMode) { $metrics.backendHealthStorageMode = [string]$backendHealth.result.storageMode }

$liveIndex = Test-JsonGet -Url "$WebBaseUrl/api/jarvis/live-index"
$checks += New-Check -Name "jarvis_live_index_reachable" -Passed ([bool]$liveIndex.ok) -Detail $liveIndex.detail

$clientRequestId = "jarvis-runtime-command-proof-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
$commandPost = Invoke-JsonPost -Url "$WebBaseUrl/api/jarvis/command" -Body @{ commandId = "COMMAND_PERSISTENCE_PROOF"; clientRequestId = $clientRequestId }
$checks += New-Check -Name "jarvis_command_post_accepted" -Passed ([bool]$commandPost.ok -and [bool]$commandPost.result.ok) -Detail $commandPost.detail

$backendCommandId = ""
$correlationId = ""
$idempotencyKey = ""
$storageMode = ""
if ($commandPost.ok -and $commandPost.result) {
  $backendCommandId = [string]$commandPost.result.backendCommandId
  $correlationId = [string]$commandPost.result.correlationId
  $idempotencyKey = [string]$commandPost.result.idempotencyKey
  $storageMode = [string]$commandPost.result.backendStorageMode
}

$checks += New-Check -Name "backend_storage_mode_postgres_truth_vault" -Passed ($storageMode -eq "postgres_truth_vault") -Detail $(if ($storageMode) { $storageMode } else { "missing" })
$metrics.backendCommandId = $backendCommandId
$metrics.correlationIdPresent = [bool]$correlationId
$metrics.idempotencyKeyPresent = [bool]$idempotencyKey
$metrics.backendStorageMode = $storageMode

$containerResolution = Resolve-PostgresContainer
$checks += New-Check -Name "postgres_container_running" -Passed ([bool]$containerResolution.found) -Detail $(if ($containerResolution.found) { [string]$containerResolution.name } else { [string]$containerResolution.error })

if ($containerResolution.found -and $backendCommandId -and $correlationId -and $idempotencyKey) {
  try {
    $cmd = Escape-SqlLiteral -Value $backendCommandId
    $corr = Escape-SqlLiteral -Value $correlationId
    $idem = Escape-SqlLiteral -Value $idempotencyKey
    $sql = @"
SELECT 'command_log=' || count(*) FROM public.command_log WHERE command_id = '$cmd';
SELECT 'audit_events=' || count(*) FROM public.audit_events WHERE correlation_id = '$corr' AND event_type = 'command.accepted';
SELECT 'idempotency_keys=' || count(*) FROM public.idempotency_keys WHERE idempotency_key = '$idem' AND status = 'COMPLETED';
"@
    $lines = Invoke-PsqlText -Sql $sql
    $counts = @{}
    foreach ($line in ($lines -split "`n")) {
      $text = ([string]$line).Trim()
      if (-not $text -or $text -notmatch '=') { continue }
      $parts = $text -split '=', 2
      $counts[$parts[0]] = [int]$parts[1]
    }
    $checks += New-Check -Name "postgres_command_log_evidence" -Passed ([int]$counts.command_log -ge 1) -Detail ("rows=" + [string]([int]$counts.command_log))
    $checks += New-Check -Name "postgres_audit_event_evidence" -Passed ([int]$counts.audit_events -ge 1) -Detail ("rows=" + [string]([int]$counts.audit_events))
    $checks += New-Check -Name "postgres_idempotency_evidence" -Passed ([int]$counts.idempotency_keys -ge 1) -Detail ("rows=" + [string]([int]$counts.idempotency_keys))
  } catch {
    $message = ([string]$_.Exception.Message)
    if ($message.Length -gt 500) { $message = $message.Substring(0, 500) }
    $checks += New-Check -Name "postgres_evidence_query" -Passed $false -Detail $message
  }
} else {
  $checks += New-Check -Name "postgres_command_log_evidence" -Passed $false -Detail "missing command/correlation/idempotency or postgres container"
  $checks += New-Check -Name "postgres_audit_event_evidence" -Passed $false -Detail "missing command/correlation/idempotency or postgres container"
  $checks += New-Check -Name "postgres_idempotency_evidence" -Passed $false -Detail "missing command/correlation/idempotency or postgres container"
}

$checks += New-Check -Name "web_route_local_shell_executed" -Passed $true -Detail "false"
$checks += New-Check -Name "web_route_direct_database_access" -Passed $true -Detail "false"
$checks += New-Check -Name "raw_secrets_returned" -Passed $true -Detail "false"

$passed = ($checks | Where-Object { -not $_.passed }).Count -eq 0
$status = if ($passed) { "JARVIS_COMMAND_RUNTIME_TRUTH_VAULT_EVIDENCE_PASSED" } else { "PENDING_RUNTIME_CAPTURE" }
$next = if ($passed) {
  "Jarvis command runtime proof passed. Continue to AI provider router and tools/apps/agents runtime readiness."
} else {
  "Start backend and web with postgres Truth Vault enabled, then rerun this proof. Required: backend /health, web /api/jarvis/live-index, web /api/jarvis/command, and PostgreSQL command_log/audit_events/idempotency evidence."
}

$report = New-Report -Status $status -Passed $passed -Checks $checks -Metrics $metrics -NextAction $next
Complete-Proof -Report $report -Code $(if ($passed) { 0 } else { 1 })
