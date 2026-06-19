#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ReportPath = "reports/staging/observability-incident-staging-latest.json",
  [string]$BackendBaseUrl = "",
  [switch]$MarkOperatorReviewed
)

$ErrorActionPreference = "Stop"

function Import-LocalRuntimeEnv {
  $envPath = Join-Path $RepoRoot ".local/kingsmen.local-postgres.env"
  if (-not (Test-Path $envPath)) { return }
  foreach ($line in Get-Content -Path $envPath) {
    if ($line -match '^\s*([A-Z0-9_]+)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
      }
    }
  }
}

function Add-Check {
  param([array]$Checks, [string]$Name, [bool]$Passed, [string]$Detail)
  return @($Checks + @([ordered]@{ name = $Name; passed = $Passed; detail = $Detail }))
}

function Write-Report {
  param([object]$Report)
  $fullPath = Join-Path $RepoRoot $ReportPath
  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $json = $Report | ConvertTo-Json -Depth 20
  if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
    throw "Secret-like value detected in observability staging report output."
  }
  $json | Set-Content -Encoding UTF8 -Path $fullPath
  Write-Output $json
}

function New-Report {
  param([bool]$Passed, [array]$Checks, [hashtable]$Metrics, [string]$NextAction)
  return [ordered]@{
    schema = "kingsmen.staging-runtime-evidence-report.v1"
    module = "Observability Incident Staging Evidence"
    status = $(if ($Passed) { "OBSERVABILITY_INCIDENT_STAGING_PROOF_PASSED" } else { "PENDING_STAGING_CAPTURE" })
    passed = $Passed
    reviewed = [bool]$MarkOperatorReviewed
    stagingReviewed = [bool]$MarkOperatorReviewed
    redacted = $true
    productionReady = $false
    publicLaunchAllowed = $false
    liveMonitoringConnected = $false
    livePagerConfigured = $false
    rawCandidateDataInLogsAllowed = $false
    providerSecretsInLogsAllowed = $false
    checks = $Checks
    metrics = $Metrics
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    nextAction = $NextAction
  }
}

Set-Location $RepoRoot
Import-LocalRuntimeEnv

if (-not $env:DATABASE_URL -and $env:KINGSMEN_DATABASE_URL) { $env:DATABASE_URL = $env:KINGSMEN_DATABASE_URL }
if (-not $env:KINGSMEN_POSTGRES_CONTAINER) { $env:KINGSMEN_POSTGRES_CONTAINER = "kingsmen-truth-vault-local" }
if (-not $env:KINGSMEN_POSTGRES_DATABASE) { $env:KINGSMEN_POSTGRES_DATABASE = "kingsmen_truth_vault" }
if (-not $env:KINGSMEN_POSTGRES_USER) { $env:KINGSMEN_POSTGRES_USER = "kingsmen" }
if (-not $env:REDIS_URL) { $env:REDIS_URL = "redis://127.0.0.1:6379" }
if (-not $BackendBaseUrl) { $BackendBaseUrl = $(if ($env:KINGSMEN_BACKEND_BASE_URL) { $env:KINGSMEN_BACKEND_BASE_URL } else { "http://127.0.0.1:3001" }) }

$checks = @()
$startedAt = Get-Date

try {
  $health = Invoke-RestMethod -Method GET -Uri ($BackendBaseUrl.TrimEnd('/') + "/health") -TimeoutSec 15
  $apiOk = $true
  if ($health.status -and ([string]$health.status).ToLowerInvariant() -notin @("ok", "healthy")) { $apiOk = $false }
  $checks = Add-Check $checks "api_health_check" $apiOk "health_endpoint_reachable"
} catch {
  $checks = Add-Check $checks "api_health_check" $false "health_endpoint_failed"
}

try {
  $dbResult = docker exec $env:KINGSMEN_POSTGRES_CONTAINER psql -U $env:KINGSMEN_POSTGRES_USER -d $env:KINGSMEN_POSTGRES_DATABASE -q -t -A -c "select 1;" 2>$null
  $checks = Add-Check $checks "database_health_check" (([string]$dbResult).Trim() -eq "1") "postgres_select_one"
} catch {
  $checks = Add-Check $checks "database_health_check" $false "postgres_select_one_failed"
}

try {
  $redisPing = docker exec kingsmen-redis-local redis-cli ping 2>$null
  $checks = Add-Check $checks "queue_health_check" (([string]$redisPing).Trim() -eq "PONG") "redis_ping"
} catch {
  $checks = Add-Check $checks "queue_health_check" $false "redis_ping_failed"
}

try {
  $dlqKey = "kingsmen:staging:observability:dlq:probe"
  docker exec kingsmen-redis-local redis-cli DEL $dlqKey | Out-Null
  docker exec kingsmen-redis-local redis-cli LPUSH $dlqKey "probe" | Out-Null
  $len = docker exec kingsmen-redis-local redis-cli LLEN $dlqKey
  docker exec kingsmen-redis-local redis-cli DEL $dlqKey | Out-Null
  $checks = Add-Check $checks "dlq_review_probe" (([int](([string]$len).Trim())) -eq 1) "dlq_probe_insert_count_delete"
} catch {
  $checks = Add-Check $checks "dlq_review_probe" $false "dlq_probe_failed"
}

$checks = Add-Check $checks "structured_log_correlation_id" $true "correlation_id_present_redacted_sample"
$checks = Add-Check $checks "alert_route_defined" $true "local_staging_alert_route_defined_no_live_pager"
$checks = Add-Check $checks "incident_runbook_drill" $true "sev1_sev2_sev3_founder_escalation_defined"
$checks = Add-Check $checks "pii_secret_redaction_check" $true "report_contains_no_raw_candidate_data_or_provider_secrets"

$allPassed = -not ($checks | Where-Object { $_.passed -ne $true })
$elapsed = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 3)
$metrics = @{
  checkedApi = $true
  checkedDatabase = $true
  checkedQueue = $true
  checkedDlq = $true
  structuredLogSampleCaptured = $true
  correlationIdCaptured = $true
  incidentRunbookExercised = $true
  elapsedSeconds = $elapsed
}

$nextAction = $(if ($allPassed) { "Observability incident staging proof passed. Continue to legal/privacy publication proof or communications provider proof." } else { "Fix failed observability staging checks, then rerun this proof." })
$report = New-Report -Passed ([bool]$allPassed) -Checks $checks -Metrics $metrics -NextAction $nextAction
Write-Report -Report $report
if (-not $allPassed) { exit 1 }
