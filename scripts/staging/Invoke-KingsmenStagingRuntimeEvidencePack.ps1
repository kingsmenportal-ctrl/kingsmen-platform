param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL,
  [switch]$RunDatabaseProbe,
  [switch]$RunWebProbe,
  [switch]$MarkOperatorReviewed,
  [switch]$PreserveExistingPassedReports
)

$ErrorActionPreference = "Stop"

function New-Report {
  param(
    [string]$Module,
    [string]$Status,
    [bool]$Passed,
    [array]$Checks,
    [string]$NextAction
  )

  return [ordered]@{
    schema = "kingsmen.staging-runtime-evidence-report.v1"
    module = $Module
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
    checks = $Checks
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    nextAction = $NextAction
  }
}

function Write-Report {
  param([string]$Path, [object]$Report)

  $fullPath = Join-Path $RepoRoot $Path
  if ($PreserveExistingPassedReports -and (Test-Path $fullPath)) {
    try {
      $existing = Get-Content -Raw -Path $fullPath | ConvertFrom-Json
      if ($existing.passed -eq $true) { return }
    } catch { }
  }

  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Report | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -Path $fullPath
}

function Invoke-HealthProbe {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    return [ordered]@{ attempted = $true; passed = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300); statusCode = $response.StatusCode }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; statusCode = $null; error = "HEALTH_PROBE_FAILED" }
  }
}

function Invoke-DatabaseProbe {
  if (-not $RunDatabaseProbe) { return [ordered]@{ attempted = $false; passed = $false; reason = "RUN_DATABASE_PROBE_NOT_SET" } }
  if (-not $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "KINGSMEN_DATABASE_URL_NOT_CONFIGURED" } }
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $psql) { return [ordered]@{ attempted = $true; passed = $false; reason = "PSQL_NOT_AVAILABLE" } }

  $oldUrl = $env:DATABASE_URL
  try {
    $env:DATABASE_URL = $env:KINGSMEN_DATABASE_URL
    & $psql.Source $env:DATABASE_URL -v ON_ERROR_STOP=1 -q -t -c "select 1" | Out-Null
    if ($LASTEXITCODE -eq 0) { return [ordered]@{ attempted = $true; passed = $true; reason = "DATABASE_SELECT_1_OK" } }
    return [ordered]@{ attempted = $true; passed = $false; reason = "DATABASE_SELECT_1_FAILED" }
  } catch {
    return [ordered]@{ attempted = $true; passed = $false; reason = "DATABASE_PROBE_EXCEPTION" }
  } finally {
    $env:DATABASE_URL = $oldUrl
  }
}

$databaseProbe = Invoke-DatabaseProbe
Write-Report -Path "reports/staging/truth-vault-persistence-staging-latest.json" -Report (New-Report -Module "Truth Vault Persistence Staging Evidence" -Status ($(if ($databaseProbe.passed) { "TRUTH_VAULT_STAGING_PROBE_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed ([bool]$databaseProbe.passed) -Checks @(@{ name = "database_probe"; passed = [bool]$databaseProbe.passed; detail = $databaseProbe.reason }) -NextAction "Run with -RunDatabaseProbe after KINGSMEN_DATABASE_URL is configured outside Git.")

$webChecks = @()
$webPassed = $false
if ($RunWebProbe -and $BackendBaseUrl) {
  $health = Invoke-HealthProbe -Url (($BackendBaseUrl.TrimEnd('/')) + "/health")
  $system = Invoke-HealthProbe -Url (($BackendBaseUrl.TrimEnd('/')) + "/api/system/health")
  $webChecks = @(
    @{ name = "backend_health"; passed = [bool]$health.passed; detail = if ($health.statusCode) { "HTTP_$($health.statusCode)" } else { "NO_STATUS" } },
    @{ name = "backend_system_health"; passed = [bool]$system.passed; detail = if ($system.statusCode) { "HTTP_$($system.statusCode)" } else { "NO_STATUS" } }
  )
  $webPassed = [bool]$health.passed -and [bool]$system.passed
} else {
  $webChecks = @(@{ name = "web_probe"; passed = $false; detail = "RUN_WEB_PROBE_OR_BACKEND_BASE_URL_NOT_SET" })
}
Write-Report -Path "reports/staging/web-backend-boundary-staging-latest.json" -Report (New-Report -Module "Web Backend Boundary Staging Evidence" -Status ($(if ($webPassed) { "WEB_BACKEND_STAGING_PROBE_PASSED" } else { "PENDING_STAGING_CAPTURE" })) -Passed $webPassed -Checks $webChecks -NextAction "Run with -RunWebProbe and KINGSMEN_BACKEND_BASE_URL configured outside Git.")

$pendingReports = @(
  @{ path = "reports/staging/rls-sql-isolation-staging-latest.json"; module = "RLS SQL Isolation Staging Evidence"; action = "Apply RLS migration to staging and capture role-isolation report." },
  @{ path = "reports/staging/payfast-provider-sandbox-staging-latest.json"; module = "PayFast Provider Sandbox Staging Evidence"; action = "Run real PayFast sandbox checkout/ITN proof against staging notify URL." },
  @{ path = "reports/staging/backup-restore-drill-staging-latest.json"; module = "Backup Restore Drill Staging Evidence"; action = "Run backup and restore drill scripts against staging and restore-drill databases." },
  @{ path = "reports/security/secrets-wiring-runtime-health-latest.json"; module = "Secrets Runtime Health Staging Evidence"; action = "Run Test-KingsmenSecretWiring.ps1 in staging after configuring secrets outside Git." },
  @{ path = "reports/staging/communications-provider-staging-latest.json"; module = "Communications Provider Staging Evidence"; action = "Run provider send/receive, bounce, opt-out, urgent WhatsApp, and SMS fallback proof." },
  @{ path = "reports/staging/observability-incident-staging-latest.json"; module = "Observability Incident Staging Evidence"; action = "Run staging health, alert, DLQ, redaction, and incident drill proof." },
  @{ path = "reports/staging/legal-privacy-publication-staging-latest.json"; module = "Legal Privacy Publication Staging Evidence"; action = "Publish and review policy surfaces, then capture consent/refund/data-subject request proof." },
  @{ path = "reports/repo/main-branch-protection-apply-latest.json"; module = "Main Branch Protection Apply Evidence"; action = "Apply GitHub branch protection and capture the redacted apply report." }
)

foreach ($item in $pendingReports) {
  Write-Report -Path $item.path -Report (New-Report -Module $item.module -Status "PENDING_STAGING_CAPTURE" -Passed $false -Checks @(@{ name = "runtime_evidence_required"; passed = $false; detail = $item.action }) -NextAction $item.action)
}

$summary = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-capture-summary.v1"
  module = "Staging Runtime Evidence Capture Runner"
  status = "STAGING_RUNTIME_EVIDENCE_CAPTURE_RECORDED"
  passed = $false
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawCandidateDataPrinted = $false
  providerCredentialsPrinted = $false
  generatedReports = 10
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = "Complete each pending staging report, then run final:collect:evidence."
}

Write-Output ($summary | ConvertTo-Json -Depth 12)
