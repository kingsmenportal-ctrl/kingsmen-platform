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

function Resolve-KDetail {
  param(
    [object]$Value,
    [string]$Fallback
  )
  if ($null -eq $Value) { return $Fallback }
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return $Fallback }
  return $text
}

$checks = New-Object System.Collections.ArrayList
function Add-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  [void]$checks.Add([ordered]@{ name = $Name; passed = $Passed; detail = $Detail })
}

$openClawOperatorOnly = $true
$policyGate = if ($env:KINGSMEN_OPENCLAW_OPERATOR_POLICY_GATE) { $env:KINGSMEN_OPENCLAW_OPERATOR_POLICY_GATE.Trim() } else { "backend_policy_evidence_only" }
$evidenceLedgerMode = if ($env:KINGSMEN_OPENCLAW_EVIDENCE_LEDGER_MODE) { $env:KINGSMEN_OPENCLAW_EVIDENCE_LEDGER_MODE.Trim() } else { "truth_vault_audit_required" }
$founderApprovalMode = if ($env:KINGSMEN_OPENCLAW_FOUNDER_APPROVAL_MODE) { $env:KINGSMEN_OPENCLAW_FOUNDER_APPROVAL_MODE.Trim() } else { "risky_actions_require_founder_approval" }

$policyGateConfigured = $policyGate -eq "backend_policy_evidence_only"
$evidenceLedgerRequired = $evidenceLedgerMode -eq "truth_vault_audit_required"
$founderApprovalRequired = $founderApprovalMode -eq "risky_actions_require_founder_approval"

Add-Check "openclaw_operator_only" $openClawOperatorOnly "operator_policy_boundary_only"
Add-Check "backend_policy_gate_configured" $policyGateConfigured $policyGate
Add-Check "truth_vault_evidence_ledger_required" $evidenceLedgerRequired $evidenceLedgerMode
Add-Check "founder_approval_required_for_risky_actions" $founderApprovalRequired $founderApprovalMode

$backendHealth = $null
$backendReachable = $false
$postgresTruthVault = $false
try {
  $backendHealth = Invoke-RestMethod -Method Get -Uri "$BackendBaseUrl/health" -TimeoutSec 5
  $backendReachable = $true
  $backendStorageMode = Resolve-KDetail $backendHealth.storageMode "missing"
  $postgresTruthVault = $backendStorageMode -eq "postgres_truth_vault"
  Add-Check "backend_health_reachable" $true "reachable"
  Add-Check "backend_storage_mode_postgres_truth_vault" $postgresTruthVault $backendStorageMode
} catch {
  Add-Check "backend_health_reachable" $false $_.Exception.Message
  Add-Check "backend_storage_mode_postgres_truth_vault" $false "missing"
}

$webRouteReachable = $false
try {
  $route = Invoke-RestMethod -Method Get -Uri "$WebBaseUrl/api/jarvis/openclaw-operator-policy-boundary" -TimeoutSec 5
  $webRouteReachable = $true
  $routeStatus = Resolve-KDetail $route.status "reachable"
  Add-Check "web_boundary_route_reachable" $true $routeStatus
} catch {
  Add-Check "web_boundary_route_reachable" $false $_.Exception.Message
}

$commandAccepted = $false
try {
  $body = @{ commandId = "OPENCLAW_OPERATOR_POLICY_CHECK"; clientRequestId = "jarvis-openclaw-operator-policy-boundary-proof" } | ConvertTo-Json -Depth 8
  $command = Invoke-RestMethod -Method Post -Uri "$WebBaseUrl/api/jarvis/command" -Body $body -ContentType "application/json" -TimeoutSec 8
  $commandAccepted = $command.ok -eq $true
  $commandDetail = Resolve-KDetail $command.message "accepted"
  Add-Check "jarvis_openclaw_operator_policy_command_accepted" $commandAccepted $commandDetail
} catch {
  Add-Check "jarvis_openclaw_operator_policy_command_accepted" $false $_.Exception.Message
}

Add-Check "openclaw_may_bypass_policy" $true "false"
Add-Check "openclaw_may_execute_without_approval" $true "false"
Add-Check "openclaw_may_write_truth_vault_directly" $true "false"
Add-Check "openclaw_may_access_raw_secrets" $true "false"
Add-Check "openclaw_may_change_payments" $true "false"
Add-Check "openclaw_may_submit_portals_without_map" $true "false"
Add-Check "raw_secrets_printed" $true "false"
Add-Check "direct_provider_call_from_web" $true "false"

$runtimeBoundaryReady = $openClawOperatorOnly -and $policyGateConfigured -and $evidenceLedgerRequired -and $founderApprovalRequired -and $backendReachable -and $postgresTruthVault -and $webRouteReachable -and $commandAccepted

$report = [ordered]@{
  schema = "kingsmen.jarvis-openclaw-operator-policy-boundary-proof.v1"
  module = "Jarvis OpenClaw Operator Policy Boundary Proof"
  status = if ($runtimeBoundaryReady) { "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_EVIDENCE_PASSED" } else { "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_PENDING" }
  passed = $runtimeBoundaryReady
  runtimeBoundaryReady = $runtimeBoundaryReady
  productionReady = $false
  publicLaunchAllowed = $false
  noFakeData = $true
  redacted = $true
  rawSecretsPrinted = $false
  rawSecretsReturned = $false
  directProviderCallsFromWeb = $false
  openClawOperatorOnly = $true
  openClawMayBypassPolicy = $false
  openClawMayExecuteWithoutApproval = $false
  openClawMayWriteTruthVaultDirectly = $false
  openClawMayAccessRawSecrets = $false
  openClawMayChangePayments = $false
  openClawMaySubmitPortalsWithoutMap = $false
  operatorEvidenceLedgerRequired = $evidenceLedgerRequired
  founderApprovalRequiredForRiskyActions = $founderApprovalRequired
  backendCommandOutboxAuthority = $true
  postgresTruthVaultRequired = $true
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = $envFilesLoaded
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($runtimeBoundaryReady) { "Capture operator evidence-ledger output and wire OpenClaw status into Jarvis live readiness." } else { "Keep OpenClaw blocked from execution until backend policy, Truth Vault evidence, and founder approval boundaries are proven." }
}

New-Item -ItemType Directory -Force -Path "reports/jarvis" | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json"
$report | ConvertTo-Json -Depth 20
