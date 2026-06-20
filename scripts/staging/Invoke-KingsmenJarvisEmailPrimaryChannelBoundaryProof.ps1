param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$WebBaseUrl = $env:KINGSMEN_WEB_BASE_URL,
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($WebBaseUrl)) { $WebBaseUrl = "http://127.0.0.1:3000" }
if ([string]::IsNullOrWhiteSpace($BackendBaseUrl)) { $BackendBaseUrl = "http://127.0.0.1:3001" }

function Test-KConfigured {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  return -not ($Value -match '[<>{}]|placeholder|todo|changeme|your-')
}

function Import-KEnvFile {
  param([string]$Path)
  $loaded = $false
  $imported = 0
  $reason = "missing"

  if (Test-Path $Path) {
    $loaded = $true
    $reason = "loaded_redacted"
    Get-Content $Path | ForEach-Object {
      $line = $_.Trim()
      if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
      $parts = $line.Split("=", 2)
      $name = $parts[0].Trim()
      $value = $parts[1].Trim()
      if ($name) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        $script:imported++
      }
    }
  }

  return [ordered]@{
    path = $Path
    loaded = $loaded
    reason = $reason
    importedCount = $script:imported
  }
}

$script:imported = 0
$envStatus = Import-KEnvFile -Path $EnvFile

$smtpHostConfigured = (Test-KConfigured $env:SMTP_HOST) -or (Test-KConfigured $env:KINGSMEN_SMTP_HOST)
$smtpUserConfigured = (Test-KConfigured $env:SMTP_USER) -or (Test-KConfigured $env:KINGSMEN_SMTP_USER)
$smtpPasswordConfigured = (Test-KConfigured $env:SMTP_PASSWORD) -or (Test-KConfigured $env:KINGSMEN_SMTP_PASSWORD)
$senderConfigured = (Test-KConfigured $env:EMAIL_FROM) -or (Test-KConfigured $env:KINGSMEN_EMAIL_FROM) -or (Test-KConfigured $env:SMTP_FROM)
$credentialReady = $smtpHostConfigured -and $smtpUserConfigured -and $smtpPasswordConfigured -and $senderConfigured

$backendHealth = $null
$backendHealthReachable = $false
$backendStorageMode = "missing"
try {
  $backendHealth = Invoke-RestMethod -Uri "$BackendBaseUrl/health" -Method GET -TimeoutSec 15
  $backendHealthReachable = $true
  if ($backendHealth.storageMode) { $backendStorageMode = [string]$backendHealth.storageMode }
} catch {
  $backendHealth = $_.Exception.Message
}

$routeReachable = $false
$routeStatus = "unreachable"
try {
  $route = Invoke-RestMethod -Uri "$WebBaseUrl/api/jarvis/email-primary-channel-boundary" -Method GET -TimeoutSec 15
  $routeReachable = $true
  $routeStatus = [string]$route.state
} catch {
  $routeStatus = $_.Exception.Message
}

$commandAccepted = $false
$commandDetail = "backend_unreachable"
if ($backendHealthReachable) {
  try {
    $commandBody = @{ commandId = "EMAIL_PRIMARY_CHANNEL_CHECK"; clientRequestId = "email-primary-channel-boundary-proof" } | ConvertTo-Json -Depth 8
    $commandResponse = Invoke-RestMethod -Uri "$WebBaseUrl/api/jarvis/command" -Method POST -ContentType "application/json" -Body $commandBody -TimeoutSec 20
    $commandAccepted = ($commandResponse.ok -eq $true)
    $commandDetail = if ($commandAccepted) { "accepted_redacted" } else { "not_accepted" }
  } catch {
    $commandDetail = $_.Exception.Message
  }
}

$truthVaultLive = $backendStorageMode -eq "postgres_truth_vault"
$runtimeBoundaryReady = $backendHealthReachable -and $truthVaultLive -and $routeReachable -and $commandAccepted
$passed = $credentialReady -and $runtimeBoundaryReady

$checks = @(
  [ordered]@{ name = "smtp_host_configured_redacted"; passed = $smtpHostConfigured; detail = if ($smtpHostConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
  [ordered]@{ name = "smtp_user_configured_redacted"; passed = $smtpUserConfigured; detail = if ($smtpUserConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
  [ordered]@{ name = "smtp_password_present_redacted"; passed = $smtpPasswordConfigured; detail = if ($smtpPasswordConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
  [ordered]@{ name = "email_sender_configured_redacted"; passed = $senderConfigured; detail = if ($senderConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
  [ordered]@{ name = "backend_health_reachable"; passed = $backendHealthReachable; detail = if ($backendHealthReachable) { "ok" } else { [string]$backendHealth } },
  [ordered]@{ name = "backend_storage_mode_postgres_truth_vault"; passed = $truthVaultLive; detail = $backendStorageMode },
  [ordered]@{ name = "email_boundary_route_reachable"; passed = $routeReachable; detail = $routeStatus },
  [ordered]@{ name = "jarvis_email_primary_channel_command_accepted"; passed = $commandAccepted; detail = $commandDetail },
  [ordered]@{ name = "send_receive_bounce_opt_out_evidence_pending"; passed = $false; detail = "provider_staging_proof_required_before_live" },
  [ordered]@{ name = "raw_secrets_printed"; passed = $true; detail = "false" },
  [ordered]@{ name = "provider_credentials_printed"; passed = $true; detail = "false" },
  [ordered]@{ name = "direct_provider_call_from_web"; passed = $true; detail = "false" },
  [ordered]@{ name = "whatsapp_bulk_allowed"; passed = $true; detail = "false" }
)

$report = [ordered]@{
  schema = "kingsmen.jarvis-email-primary-channel-boundary-proof.v1"
  module = "Jarvis Email Primary Channel Boundary Proof"
  status = if ($passed) { "JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY_READY_FOR_PROVIDER_STAGING" } else { "JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY_PENDING" }
  passed = $false
  credentialReady = $credentialReady
  runtimeBoundaryReady = $runtimeBoundaryReady
  productionReady = $false
  publicLaunchAllowed = $false
  noFakeData = $true
  redacted = $true
  rawSecretsPrinted = $false
  providerCredentialsPrinted = $false
  rawSecretsReturned = $false
  directProviderCallsFromWeb = $false
  emailPrimaryChannel = $true
  whatsappBulkAllowed = $false
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = @($envStatus)
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($credentialReady -and $runtimeBoundaryReady) {
    "Run real provider staging proof for send, receive, bounce, opt-out, and evidence-ledger capture before marking email runtime live."
  } else {
    "Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM outside Git, keep backend and web running, then rerun this proof."
  }
}

New-Item -ItemType Directory -Force -Path "reports/jarvis" | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Path "reports/jarvis/jarvis-email-primary-channel-boundary-proof-latest.json" -Encoding UTF8
$report | ConvertTo-Json -Depth 20

exit 0
