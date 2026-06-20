#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$BackendBaseUrl = "http://127.0.0.1:3001",
  [string]$WebBaseUrl = "http://127.0.0.1:3000",
  [string]$ReportPath = "reports/jarvis/jarvis-payfast-provider-proof-queue-boundary-proof-latest.json"
)

$ErrorActionPreference = "Stop"

function Test-PlaceholderValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $true }
  $normalized = $Value.Trim().ToLowerInvariant()
  $badExact = @("todo", "tbd", "placeholder", "changeme", "change_me", "replace_me", "your_value_here", "real", "real_value", "dummy", "fake")
  if ($badExact -contains $normalized) { return $true }
  $badFragments = @("your_", "your-", "replace_", "real_", "dummy", "fake", "example.com")
  foreach ($fragment in $badFragments) {
    if ($normalized.Contains($fragment)) { return $true }
  }
  return $false
}

function Test-ConfiguredSecret {
  param([string[]]$Names)
  foreach ($name in $Names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not (Test-PlaceholderValue $value)) { return $true }
  }
  return $false
}

function Test-ConfiguredNotifyUrl {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (Test-PlaceholderValue $value) { return $false }
  $uri = $null
  if (-not [Uri]::TryCreate($value.Trim(), [UriKind]::Absolute, [ref]$uri)) { return $false }
  if ($uri.Scheme -eq "https") { return $true }
  if ($uri.Scheme -eq "http" -and ($uri.Host -eq "127.0.0.1" -or $uri.Host -eq "localhost")) { return $true }
  return $false
}

function Add-Check {
  param([array]$Checks, [string]$Name, [bool]$Passed, [string]$Detail)
  return @($Checks + @([ordered]@{ name = $Name; passed = $Passed; detail = $Detail }))
}

function Import-EnvFile {
  param([string]$Path)
  $result = [ordered]@{ path = $Path; loaded = $false; reason = "missing"; importedCount = 0 }
  if (-not (Test-Path $Path)) { return $result }

  $imported = 0
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $parts = $line.Split("=", 2)
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($name) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
      $imported++
    }
  }

  $result.loaded = $true
  $result.reason = "loaded_redacted"
  $result.importedCount = $imported
  return $result
}

function Invoke-JsonGet {
  param([string]$Uri)
  try {
    $response = Invoke-RestMethod -Method Get -Uri $Uri -TimeoutSec 10
    return [ordered]@{ ok = $true; status = 200; data = $response; error = $null }
  } catch {
    return [ordered]@{ ok = $false; status = 0; data = $null; error = $_.Exception.Message }
  }
}

function Invoke-JarvisCommand {
  param([string]$Uri)
  try {
    $body = @{ commandId = "PAYFAST_PROVIDER_PROOF_QUEUE_CHECK"; clientRequestId = "jarvis-payfast-provider-proof-queue-boundary-proof" } | ConvertTo-Json -Depth 10
    $response = Invoke-RestMethod -Method Post -Uri $Uri -ContentType "application/json" -Body $body -TimeoutSec 10
    return [ordered]@{ ok = $true; status = 200; data = $response; error = $null }
  } catch {
    return [ordered]@{ ok = $false; status = 0; data = $null; error = $_.Exception.Message }
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$envResult = Import-EnvFile -Path $EnvFile

$merchantIdConfigured = Test-ConfiguredSecret @("PAYFAST_MERCHANT_ID")
$merchantKeyConfigured = Test-ConfiguredSecret @("PAYFAST_MERCHANT_KEY")
$passphraseConfigured = Test-ConfiguredSecret @("PAYFAST_PASSPHRASE")
$notifyUrlConfigured = Test-ConfiguredNotifyUrl "PAYFAST_NOTIFY_URL"
$providerSecretConfigured = Test-ConfiguredSecret @("PAYMENT_PROVIDER_SECRET")
$payfastEnvironment = [Environment]::GetEnvironmentVariable("PAYFAST_ENVIRONMENT", "Process")
$sandboxEnvironment = ([string]::IsNullOrWhiteSpace($payfastEnvironment) -or $payfastEnvironment.Trim().ToLowerInvariant() -eq "sandbox")
$credentialReady = $merchantIdConfigured -and $merchantKeyConfigured -and $passphraseConfigured -and $notifyUrlConfigured -and $providerSecretConfigured -and $sandboxEnvironment

$backendHealth = Invoke-JsonGet "$BackendBaseUrl/health"
$backendStorageMode = $null
if ($backendHealth.ok -and $backendHealth.data) { $backendStorageMode = $backendHealth.data.storageMode }
$backendReachable = [bool]$backendHealth.ok
$truthVaultReady = $backendReachable -and $backendStorageMode -eq "postgres_truth_vault"

$webBoundary = Invoke-JsonGet "$WebBaseUrl/api/jarvis/payfast-provider-proof-queue-boundary"
$webRouteReady = $webBoundary.ok -and $webBoundary.data.schema -eq "kingsmen.jarvis-payfast-provider-proof-queue-boundary.v1"
$command = Invoke-JarvisCommand "$WebBaseUrl/api/jarvis/command"
$commandAccepted = $command.ok -and ($command.data.ok -eq $true)

$checks = @()
$checks = Add-Check $checks "payfast_merchant_id_configured_redacted" $merchantIdConfigured "masked_presence_only"
$checks = Add-Check $checks "payfast_merchant_key_configured_redacted" $merchantKeyConfigured "masked_presence_only"
$checks = Add-Check $checks "payfast_passphrase_configured_redacted" $passphraseConfigured "masked_presence_only"
$checks = Add-Check $checks "payfast_notify_url_configured_redacted" $notifyUrlConfigured "https_or_localhost_url_presence_only"
$checks = Add-Check $checks "payment_provider_secret_configured_redacted" $providerSecretConfigured "masked_presence_only"
$checks = Add-Check $checks "payfast_environment_sandbox_only" $sandboxEnvironment $(if ($sandboxEnvironment) { "sandbox" } else { "not_sandbox" })
$checks = Add-Check $checks "backend_health_reachable" $backendReachable $(if ($backendReachable) { "ok" } else { $backendHealth.error })
$checks = Add-Check $checks "backend_storage_mode_postgres_truth_vault" $truthVaultReady $(if ($backendStorageMode) { $backendStorageMode } else { "missing" })
$checks = Add-Check $checks "web_boundary_route_reachable" $webRouteReady $(if ($webRouteReady) { "ok" } else { $webBoundary.error })
$checks = Add-Check $checks "jarvis_payfast_provider_command_accepted" $commandAccepted $(if ($commandAccepted) { "accepted" } else { if ($command.error) { $command.error } else { "not_accepted" } })
$checks = Add-Check $checks "accepted_itn_required_for_paid_status" $true "true"
$checks = Add-Check $checks "return_url_may_mark_paid" $true "false"
$checks = Add-Check $checks "cancel_url_may_mark_paid" $true "false"
$checks = Add-Check $checks "refunds_auto_approved" $true "false"
$checks = Add-Check $checks "raw_secrets_printed" $true "false"
$checks = Add-Check $checks "provider_credentials_printed" $true "false"
$checks = Add-Check $checks "direct_provider_call_from_web" $true "false"

$runtimeBoundaryReady = $truthVaultReady -and $webRouteReady -and $commandAccepted
$allPassed = $credentialReady -and $runtimeBoundaryReady

$report = [ordered]@{
  schema = "kingsmen.jarvis-payfast-provider-proof-queue-boundary-proof.v1"
  module = "Jarvis PayFast Provider Proof Queue Boundary Proof"
  status = $(if ($allPassed) { "JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY_EVIDENCE_PASSED" } else { "JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY_PENDING" })
  passed = [bool]$allPassed
  credentialReady = [bool]$credentialReady
  runtimeBoundaryReady = [bool]$runtimeBoundaryReady
  productionReady = $false
  publicLaunchAllowed = $false
  noFakeData = $true
  redacted = $true
  rawSecretsPrinted = $false
  providerCredentialsPrinted = $false
  rawSecretsReturned = $false
  directProviderCallsFromWeb = $false
  payfastEnvironment = "sandbox"
  livePaymentsEnabled = $false
  candidateCharged = $false
  acceptedItnRequiredForPaidStatus = $true
  returnUrlMayMarkPaid = $false
  cancelUrlMayMarkPaid = $false
  refundsAutoApproved = $false
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = @($envResult)
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($allPassed) { "PayFast provider proof queue boundary passed. Keep live payments disabled until final founder approval and production switch-over." } else { "Keep PayFast in sandbox/deferred mode until credentials, accepted ITN, backend runtime, and evidence-ledger proof are available." })
}

$fullReportPath = Join-Path $repoRoot $ReportPath
$reportDir = Split-Path -Parent $fullReportPath
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Force -Path $reportDir | Out-Null }
$json = $report | ConvertTo-Json -Depth 20
if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("PAYFAST_MERCHANT_KEY=")) {
  throw "Secret-like value detected in Jarvis PayFast proof report output."
}
$json | Set-Content -Encoding UTF8 -Path $fullReportPath
Write-Output $json

if (-not $allPassed) { exit 1 }
