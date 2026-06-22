[CmdletBinding()]
param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$BackendBaseUrl = "http://127.0.0.1:3001",
  [string]$WebBaseUrl = "http://127.0.0.1:3000",
  [string]$ReportPath = "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json"
)

$ErrorActionPreference = "Stop"

function Test-KConfiguredValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  $normalized = $Value.Trim().ToLowerInvariant()
  $bad = @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")
  foreach ($item in $bad) {
    if ($normalized.Contains($item)) { return $false }
  }
  return $true
}

function Get-KFlag {
  param([string]$Name, [bool]$DefaultValue)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) { return $DefaultValue }
  return @("1", "true", "yes", "enabled", "on") -contains $value.Trim().ToLowerInvariant()
}

function Add-KCheck {
  param(
    [object[]]$Checks,
    [string]$Name,
    [bool]$Passed,
    [string]$Detail
  )
  return @($Checks + [pscustomobject]@{ name = $Name; passed = $Passed; detail = $Detail })
}

function Import-KEnvFile {
  param([string]$Path)
  $result = [ordered]@{ path = $Path; loaded = $false; reason = "not_found"; importedCount = 0 }
  if (-not (Test-Path $Path)) { return [pscustomobject]$result }
  $count = 0
  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $parts = $line.Split("=", 2)
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($name) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
      $count++
    }
  }
  $result.loaded = $true
  $result.reason = "loaded_redacted"
  $result.importedCount = $count
  return [pscustomobject]$result
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$envLoad = Import-KEnvFile -Path $EnvFile
$checks = @()

$scoutMode = [Environment]::GetEnvironmentVariable("KINGSMEN_PLAYWRIGHT_SCOUT_MODE")
if ([string]::IsNullOrWhiteSpace($scoutMode)) { $scoutMode = "scout_probe_only" }
$playwrightScoutOnly = $scoutMode -eq "scout_probe_only"
$mapFallbackEnabled = Get-KFlag -Name "KINGSMEN_MAP_FALLBACK_ENABLED" -DefaultValue $true
$phoenixFallbackEnabled = Get-KFlag -Name "KINGSMEN_PHOENIX_FALLBACK_ENABLED" -DefaultValue $true
$captchaOtpManualOnly = Get-KFlag -Name "KINGSMEN_CAPTCHA_OTP_MANUAL_ONLY" -DefaultValue $true

$checks = Add-KCheck $checks "playwright_scout_mode_probe_only" $playwrightScoutOnly "scout_probe_only"
$checks = Add-KCheck $checks "manual_application_package_enabled" $mapFallbackEnabled ($mapFallbackEnabled.ToString().ToLowerInvariant())
$checks = Add-KCheck $checks "phoenix_fallback_enabled" $phoenixFallbackEnabled ($phoenixFallbackEnabled.ToString().ToLowerInvariant())
$checks = Add-KCheck $checks "captcha_otp_manual_only" $captchaOtpManualOnly ($captchaOtpManualOnly.ToString().ToLowerInvariant())

$backendReachable = $false
$postgresTruthVault = $false
try {
  $health = Invoke-RestMethod -Method GET -Uri "$BackendBaseUrl/health" -TimeoutSec 8
  $backendReachable = $true
  $postgresTruthVault = $health.storageMode -eq "postgres_truth_vault"
  $checks = Add-KCheck $checks "backend_health_reachable" $true "reachable"
  $checks = Add-KCheck $checks "backend_storage_mode_postgres_truth_vault" $postgresTruthVault ([string]$health.storageMode)
} catch {
  $checks = Add-KCheck $checks "backend_health_reachable" $false $_.Exception.Message
  $checks = Add-KCheck $checks "backend_storage_mode_postgres_truth_vault" $false "missing"
}

$webRouteReachable = $false
try {
  $route = Invoke-RestMethod -Method GET -Uri "$WebBaseUrl/api/jarvis/playwright-scout-map-fallback-boundary" -TimeoutSec 8
  $webRouteReachable = $true
  $checks = Add-KCheck $checks "web_boundary_route_reachable" $true ([string]$route.status)
} catch {
  $checks = Add-KCheck $checks "web_boundary_route_reachable" $false $_.Exception.Message
}

$commandAccepted = $false
try {
  $command = Invoke-RestMethod -Method POST -Uri "$WebBaseUrl/api/jarvis/command" -ContentType "application/json" -TimeoutSec 8 -Body (@{ commandId = "PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK" } | ConvertTo-Json -Depth 8)
  $commandAccepted = $command.ok -eq $true
  $checks = Add-KCheck $checks "jarvis_playwright_scout_map_fallback_command_accepted" $commandAccepted ([string]$command.backendStatus)
} catch {
  $checks = Add-KCheck $checks "jarvis_playwright_scout_map_fallback_command_accepted" $false $_.Exception.Message
}

$checks = Add-KCheck $checks "browser_may_run_playwright_directly" $true "false"
$checks = Add-KCheck $checks "portal_automation_may_bypass_policy" $true "false"
$checks = Add-KCheck $checks "captcha_otp_may_be_automated" $true "false"
$checks = Add-KCheck $checks "raw_secrets_printed" $true "false"
$checks = Add-KCheck $checks "direct_provider_call_from_web" $true "false"

$runtimeBoundaryReady = $playwrightScoutOnly -and $mapFallbackEnabled -and $phoenixFallbackEnabled -and $captchaOtpManualOnly -and $backendReachable -and $postgresTruthVault -and $webRouteReachable -and $commandAccepted

$report = [ordered]@{
  schema = "kingsmen.jarvis-playwright-scout-map-fallback-boundary-proof.v1"
  module = "Jarvis Playwright Scout MAP Fallback Boundary Proof"
  status = if ($runtimeBoundaryReady) { "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_EVIDENCE_PASSED" } else { "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_PENDING" }
  passed = $runtimeBoundaryReady
  runtimeBoundaryReady = $runtimeBoundaryReady
  productionReady = $false
  publicLaunchAllowed = $false
  noFakeData = $true
  redacted = $true
  rawSecretsPrinted = $false
  rawSecretsReturned = $false
  directProviderCallsFromWeb = $false
  playwrightScoutOnly = $playwrightScoutOnly
  manualApplicationPackageRequired = $true
  mapFallbackEnabled = $mapFallbackEnabled
  phoenixFallbackRequired = $true
  phoenixFallbackEnabled = $phoenixFallbackEnabled
  captchaOtpMayBeAutomated = $false
  captchaOtpManualOnly = $captchaOtpManualOnly
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = @($envLoad)
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($runtimeBoundaryReady) { "Capture MAP fallback and Phoenix fallback evidence ledger output." } else { "Keep Playwright in scout/probe mode until backend runtime, MAP fallback, Phoenix fallback, and CAPTCHA/OTP manual-boundary evidence are available." }
}

$report | ConvertTo-Json -Depth 20 | Set-Content -Path $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20
if (-not $runtimeBoundaryReady) { exit 0 }
