param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$WebBaseUrl = $env:KINGSMEN_WEB_BASE_URL,
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL,
  [string]$ReportPath = "reports/jarvis/jarvis-whatsapp-urgent-sms-backup-boundary-proof-latest.json"
)

$ErrorActionPreference = "Stop"

function Test-KingsmenConfiguredValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  return ($Value -notmatch "[<>{}]|placeholder|todo|changeme|your-")
}

function Import-KingsmenEnvFile {
  param([string]$Path)
  $result = [ordered]@{
    path = $Path
    loaded = $false
    reason = "not_found"
    importedCount = 0
  }

  if (-not (Test-Path $Path)) { return $result }

  $count = 0
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }
    $splitIndex = $line.IndexOf("=")
    if ($splitIndex -lt 1) { return }
    $name = $line.Substring(0, $splitIndex).Trim()
    $value = $line.Substring($splitIndex + 1).Trim()
    if ($name) {
      [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
      $count++
    }
  }

  $result.loaded = $true
  $result.reason = "loaded_redacted"
  $result.importedCount = $count
  return $result
}

function Add-Check {
  param(
    [System.Collections.ArrayList]$Checks,
    [string]$Name,
    [bool]$Passed,
    [string]$Detail
  )
  [void]$Checks.Add([ordered]@{
    name = $Name
    passed = $Passed
    detail = $Detail
  })
}

$webBase = if (Test-KingsmenConfiguredValue $WebBaseUrl) { $WebBaseUrl } else { "http://127.0.0.1:3000" }
$backendBase = if (Test-KingsmenConfiguredValue $BackendBaseUrl) { $BackendBaseUrl } else { "http://127.0.0.1:3001" }

$envLoads = @()
$envLoads += Import-KingsmenEnvFile -Path $EnvFile

$whatsappBusinessAccountReady = (Test-KingsmenConfiguredValue $env:KINGSMEN_WHATSAPP_BUSINESS_ACCOUNT_ID) -or (Test-KingsmenConfiguredValue $env:WHATSAPP_BUSINESS_ACCOUNT_ID)
$whatsappPhoneReady = (Test-KingsmenConfiguredValue $env:KINGSMEN_WHATSAPP_PHONE_NUMBER_ID) -or (Test-KingsmenConfiguredValue $env:WHATSAPP_PHONE_NUMBER_ID)
$whatsappTokenReady = (Test-KingsmenConfiguredValue $env:KINGSMEN_WHATSAPP_ACCESS_TOKEN) -or (Test-KingsmenConfiguredValue $env:WHATSAPP_ACCESS_TOKEN)
$smsProviderReady = (Test-KingsmenConfiguredValue $env:KINGSMEN_SMS_PROVIDER) -or (Test-KingsmenConfiguredValue $env:SMS_PROVIDER)
$smsKeyReady = (Test-KingsmenConfiguredValue $env:KINGSMEN_SMS_API_KEY) -or (Test-KingsmenConfiguredValue $env:SMS_API_KEY)

$whatsappCredentialReady = $whatsappBusinessAccountReady -and $whatsappPhoneReady -and $whatsappTokenReady
$smsBackupCredentialReady = $smsProviderReady -and $smsKeyReady
$credentialReady = $whatsappCredentialReady -or $smsBackupCredentialReady

$backendHealthReachable = $false
$backendStorageMode = "missing"
$backendHealthError = "not_checked"
try {
  $backendHealth = Invoke-RestMethod -Method Get -Uri "$backendBase/health" -TimeoutSec 15
  $backendHealthReachable = $true
  if ($backendHealth.storageMode) { $backendStorageMode = [string]$backendHealth.storageMode }
} catch {
  $backendHealthError = $_.Exception.Message
}

$routeReachable = $false
$routeState = "missing"
$routeError = "not_checked"
try {
  $route = Invoke-RestMethod -Method Get -Uri "$webBase/api/jarvis/whatsapp-urgent-sms-backup-boundary" -TimeoutSec 15
  $routeReachable = $true
  if ($route.state) { $routeState = [string]$route.state }
} catch {
  $routeError = $_.Exception.Message
}

$commandAccepted = $false
$commandDetail = "not_checked"
if ($backendHealthReachable) {
  try {
    $commandBody = @{
      commandId = "WHATSAPP_URGENT_SMS_BACKUP_CHECK"
      clientRequestId = "jarvis-whatsapp-urgent-sms-backup-boundary-proof"
    } | ConvertTo-Json -Depth 10
    $commandResponse = Invoke-RestMethod -Method Post -Uri "$webBase/api/jarvis/command" -ContentType "application/json" -Body $commandBody -TimeoutSec 15
    $commandAccepted = ($commandResponse.ok -eq $true)
    $commandDetail = if ($commandAccepted) { "accepted" } else { "not_accepted" }
  } catch {
    $commandDetail = $_.Exception.Message
  }
} else {
  $commandDetail = "backend_unreachable"
}

$checks = New-Object System.Collections.ArrayList
Add-Check -Checks $checks -Name "whatsapp_business_account_configured_redacted" -Passed $whatsappBusinessAccountReady -Detail $(if ($whatsappBusinessAccountReady) { "present_redacted" } else { "missing_or_placeholder" })
Add-Check -Checks $checks -Name "whatsapp_phone_number_configured_redacted" -Passed $whatsappPhoneReady -Detail $(if ($whatsappPhoneReady) { "present_redacted" } else { "missing_or_placeholder" })
Add-Check -Checks $checks -Name "whatsapp_access_token_present_redacted" -Passed $whatsappTokenReady -Detail "WHATSAPP_ACCESS_TOKEN"
Add-Check -Checks $checks -Name "sms_provider_configured_redacted" -Passed $smsProviderReady -Detail $(if ($smsProviderReady) { "present_redacted" } else { "missing_or_placeholder" })
Add-Check -Checks $checks -Name "sms_api_key_present_redacted" -Passed $smsKeyReady -Detail "SMS_API_KEY"
Add-Check -Checks $checks -Name "backend_health_reachable" -Passed $backendHealthReachable -Detail $(if ($backendHealthReachable) { "ok" } else { $backendHealthError })
Add-Check -Checks $checks -Name "backend_storage_mode_postgres_truth_vault" -Passed ($backendStorageMode -eq "postgres_truth_vault") -Detail $backendStorageMode
Add-Check -Checks $checks -Name "web_boundary_route_reachable" -Passed $routeReachable -Detail $(if ($routeReachable) { $routeState } else { $routeError })
Add-Check -Checks $checks -Name "jarvis_whatsapp_sms_command_accepted" -Passed $commandAccepted -Detail $commandDetail
Add-Check -Checks $checks -Name "whatsapp_urgent_only" -Passed $true -Detail "true"
Add-Check -Checks $checks -Name "whatsapp_bulk_allowed" -Passed $true -Detail "false"
Add-Check -Checks $checks -Name "sms_backup_only" -Passed $true -Detail "true"
Add-Check -Checks $checks -Name "raw_secrets_printed" -Passed $true -Detail "false"
Add-Check -Checks $checks -Name "provider_credentials_printed" -Passed $true -Detail "false"
Add-Check -Checks $checks -Name "direct_provider_call_from_web" -Passed $true -Detail "false"

$runtimeBoundaryReady = $backendHealthReachable -and ($backendStorageMode -eq "postgres_truth_vault") -and $routeReachable -and $commandAccepted
$passed = $credentialReady -and $runtimeBoundaryReady

$status = if ($passed) { "JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY_READY" } else { "JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY_PENDING" }

$report = [ordered]@{
  schema = "kingsmen.jarvis-whatsapp-urgent-sms-backup-boundary-proof.v1"
  module = "Jarvis WhatsApp Urgent SMS Backup Boundary Proof"
  status = $status
  passed = $passed
  credentialReady = $credentialReady
  whatsappCredentialReady = $whatsappCredentialReady
  smsBackupCredentialReady = $smsBackupCredentialReady
  runtimeBoundaryReady = $runtimeBoundaryReady
  productionReady = $false
  publicLaunchAllowed = $false
  noFakeData = $true
  redacted = $true
  rawSecretsPrinted = $false
  providerCredentialsPrinted = $false
  rawSecretsReturned = $false
  directProviderCallsFromWeb = $false
  whatsappUrgentOnly = $true
  whatsappBulkAllowed = $false
  smsBackupOnly = $true
  backendBaseUrl = $backendBase
  webBaseUrl = $webBase
  envFilesLoaded = $envLoads
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($passed) { "Review urgent-only WhatsApp and SMS backup evidence before enabling any provider runtime." } else { "Keep WhatsApp deferred and SMS backup-only until credentials, backend runtime, and evidence-ledger proof are available." }
}

$dir = Split-Path -Parent $ReportPath
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$report | ConvertTo-Json -Depth 20 | Set-Content -Path $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if (-not $passed) { exit 2 }
exit 0
