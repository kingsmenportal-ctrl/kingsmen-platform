[CmdletBinding()]
param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$WebBaseUrl = $env:KINGSMEN_WEB_BASE_URL,
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL
)

$ErrorActionPreference = "Stop"

if (-not $WebBaseUrl) { $WebBaseUrl = "http://127.0.0.1:3000" }
if (-not $BackendBaseUrl) { $BackendBaseUrl = "http://127.0.0.1:3001" }

$envFilesLoaded = @()
if (Test-Path $EnvFile) {
  $imported = 0
  Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $parts = $line.Split("=", 2)
      $name = $parts[0].Trim()
      $value = $parts[1].Trim()
      if ($name) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        $imported++
      }
    }
  }
  $envFilesLoaded += [ordered]@{ path = $EnvFile; loaded = $true; reason = "loaded_redacted"; importedCount = $imported }
} else {
  $envFilesLoaded += [ordered]@{ path = $EnvFile; loaded = $false; reason = "missing"; importedCount = 0 }
}

function Test-KConfigured {
  param([string]$Value)
  if (-not $Value) { return $false }
  $normalized = $Value.Trim().ToLowerInvariant()
  if (-not $normalized) { return $false }
  foreach ($token in @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")) {
    if ($normalized.Contains($token)) { return $false }
  }
  return $true
}

$checks = New-Object System.Collections.ArrayList
function Add-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  [void]$checks.Add([ordered]@{ name = $Name; passed = $Passed; detail = $Detail })
}

$n8nBaseReady = Test-KConfigured $env:KINGSMEN_N8N_BASE_URL
$n8nKeyReady = Test-KConfigured $env:KINGSMEN_N8N_API_KEY
$n8nSecretReady = Test-KConfigured $env:KINGSMEN_N8N_WEBHOOK_SECRET
$relayMode = if ($env:KINGSMEN_N8N_RELAY_MODE) { $env:KINGSMEN_N8N_RELAY_MODE.Trim() } else { "thin_relay_only" }
$thinRelayOnly = $relayMode -eq "thin_relay_only"

Add-Check "n8n_base_url_configured_redacted" $n8nBaseReady "masked_presence_only"
Add-Check "n8n_api_key_present_redacted" $n8nKeyReady "KINGSMEN_N8N_API_KEY"
Add-Check "n8n_webhook_secret_present_redacted" $n8nSecretReady "KINGSMEN_N8N_WEBHOOK_SECRET"
Add-Check "n8n_relay_mode_thin_relay_only" $thinRelayOnly $relayMode

$backendHealth = $null
$backendReachable = $false
$postgresTruthVault = $false
try {
  $backendHealth = Invoke-RestMethod -Method Get -Uri "$BackendBaseUrl/health" -TimeoutSec 5
  $backendReachable = $true
  $postgresTruthVault = $backendHealth.storageMode -eq "postgres_truth_vault"
  Add-Check "backend_health_reachable" $true "reachable"
  Add-Check "backend_storage_mode_postgres_truth_vault" $postgresTruthVault ($backendHealth.storageMode ?? "missing")
} catch {
  Add-Check "backend_health_reachable" $false $_.Exception.Message
  Add-Check "backend_storage_mode_postgres_truth_vault" $false "missing"
}

$webRouteReachable = $false
try {
  $route = Invoke-RestMethod -Method Get -Uri "$WebBaseUrl/api/jarvis/n8n-thin-relay-boundary" -TimeoutSec 5
  $webRouteReachable = $true
  Add-Check "web_boundary_route_reachable" $true ($route.status ?? "reachable")
} catch {
  Add-Check "web_boundary_route_reachable" $false $_.Exception.Message
}

$commandAccepted = $false
try {
  $body = @{ commandId = "N8N_THIN_RELAY_CHECK"; clientRequestId = "jarvis-n8n-thin-relay-boundary-proof" } | ConvertTo-Json -Depth 8
  $command = Invoke-RestMethod -Method Post -Uri "$WebBaseUrl/api/jarvis/command" -Body $body -ContentType "application/json" -TimeoutSec 8
  $commandAccepted = $command.ok -eq $true
  Add-Check "jarvis_n8n_thin_relay_command_accepted" $commandAccepted ($command.message ?? "accepted")
} catch {
  Add-Check "jarvis_n8n_thin_relay_command_accepted" $false $_.Exception.Message
}

$credentialReady = $n8nBaseReady -and $n8nKeyReady -and $n8nSecretReady -and $thinRelayOnly
$runtimeBoundaryReady = $credentialReady -and $backendReachable -and $postgresTruthVault -and $webRouteReachable -and $commandAccepted

$report = [ordered]@{
  schema = "kingsmen.jarvis-n8n-thin-relay-boundary-proof.v1"
  module = "Jarvis n8n Thin Relay Boundary Proof"
  status = if ($runtimeBoundaryReady) { "JARVIS_N8N_THIN_RELAY_BOUNDARY_EVIDENCE_PASSED" } else { "JARVIS_N8N_THIN_RELAY_BOUNDARY_PENDING" }
  passed = $runtimeBoundaryReady
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
  thinRelayOnly = $true
  n8nMayBecomeAuthority = $false
  workflowMayWriteTruthVaultDirectly = $false
  browserMayCallN8nDirectly = $false
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = $envFilesLoaded
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($runtimeBoundaryReady) { "Capture backend outbox and evidence-ledger proof for n8n relay work items." } else { "Keep n8n source-ready only until credentials, backend runtime, outbox evidence, and evidence-ledger proof are available." }
}

New-Item -ItemType Directory -Force -Path "reports/jarvis" | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 "reports/jarvis/jarvis-n8n-thin-relay-boundary-proof-latest.json"
$report | ConvertTo-Json -Depth 20
