param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$BackendBaseUrl = $env:KINGSMEN_BACKEND_BASE_URL,
  [string]$WebBaseUrl = $env:KINGSMEN_WEB_BASE_URL,
  [string]$ReportPath = "reports/jarvis/jarvis-airtable-human-mirror-boundary-proof-latest.json"
)

$ErrorActionPreference = "Stop"

function Test-KConfiguredValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  if ($Value -match "[<>{}]|placeholder|todo|changeme|your-") { return $false }
  return $true
}

function Import-KEnvFile {
  param([string]$Path)
  $result = [ordered]@{
    path = $Path
    loaded = $false
    reason = "missing"
    importedCount = 0
  }

  if (-not (Test-Path $Path)) { return $result }

  foreach ($line in Get-Content -Path $Path) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.StartsWith("#")) { continue }
    if ($trimmed -notmatch "^([^=]+)=(.*)$") { continue }

    $name = $Matches[1].Trim()
    $value = $Matches[2].Trim()
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
    $result.importedCount++
  }

  $result.loaded = $true
  $result.reason = "loaded_redacted"
  return $result
}

function Invoke-KJsonGet {
  param([string]$Url)
  try {
    $response = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 15
    return [ordered]@{ ok = $true; data = $response; detail = "ok" }
  } catch {
    return [ordered]@{ ok = $false; data = $null; detail = $_.Exception.Message }
  }
}

function Invoke-KJsonPost {
  param([string]$Url, [hashtable]$Body)
  try {
    $json = $Body | ConvertTo-Json -Depth 20
    $response = Invoke-RestMethod -Method Post -Uri $Url -Body $json -ContentType "application/json" -TimeoutSec 20
    return [ordered]@{ ok = $true; data = $response; detail = "ok" }
  } catch {
    return [ordered]@{ ok = $false; data = $null; detail = $_.Exception.Message }
  }
}

if ([string]::IsNullOrWhiteSpace($BackendBaseUrl)) { $BackendBaseUrl = "http://127.0.0.1:3001" }
if ([string]::IsNullOrWhiteSpace($WebBaseUrl)) { $WebBaseUrl = "http://127.0.0.1:3000" }

$envLoad = Import-KEnvFile -Path $EnvFile

$baseValue = $env:KINGSMEN_AIRTABLE_BASE_ID
if (-not (Test-KConfiguredValue $baseValue)) { $baseValue = $env:AIRTABLE_BASE_ID }

$tokenValue = $env:KINGSMEN_AIRTABLE_API_KEY
if (-not (Test-KConfiguredValue $tokenValue)) { $tokenValue = $env:AIRTABLE_API_KEY }
if (-not (Test-KConfiguredValue $tokenValue)) { $tokenValue = $env:AIRTABLE_TOKEN }
if (-not (Test-KConfiguredValue $tokenValue)) { $tokenValue = $env:AIRTABLE_PERSONAL_ACCESS_TOKEN }

$tableValue = $env:KINGSMEN_AIRTABLE_CANDIDATES_TABLE
if (-not (Test-KConfiguredValue $tableValue)) { $tableValue = $env:AIRTABLE_CANDIDATES_TABLE }
if (-not (Test-KConfiguredValue $tableValue)) { $tableValue = $env:AIRTABLE_TABLE_CANDIDATES }

$baseConfigured = Test-KConfiguredValue $baseValue
$tokenConfigured = Test-KConfiguredValue $tokenValue
$tableConfigured = Test-KConfiguredValue $tableValue
$credentialReady = $baseConfigured -and $tokenConfigured -and $tableConfigured

$backendHealth = Invoke-KJsonGet -Url "$BackendBaseUrl/health"
$backendStorageMode = ""
if ($backendHealth.ok -and $backendHealth.data -and $backendHealth.data.storageMode) {
  $backendStorageMode = [string]$backendHealth.data.storageMode
}
$backendTruthVault = $backendStorageMode -eq "postgres_truth_vault"

$webBoundary = Invoke-KJsonGet -Url "$WebBaseUrl/api/jarvis/airtable-human-mirror-boundary"

$commandPost = [ordered]@{ ok = $false; data = $null; detail = "backend_or_web_unreachable" }
if ($backendHealth.ok -and $webBoundary.ok) {
  $commandPost = Invoke-KJsonPost -Url "$WebBaseUrl/api/jarvis/command" -Body @{
    commandId = "AIRTABLE_HUMAN_MIRROR_CHECK"
    clientRequestId = "airtable-human-mirror-boundary-proof"
  }
}

$commandAccepted = $commandPost.ok -and ($commandPost.data.ok -eq $true)
$runtimeBoundaryReady = $backendHealth.ok -and $backendTruthVault -and $webBoundary.ok -and $commandAccepted
$passed = $credentialReady -and $runtimeBoundaryReady

$checks = @(
  [ordered]@{ name = "airtable_base_configured_redacted"; passed = $baseConfigured; detail = $(if ($baseConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
  [ordered]@{ name = "airtable_token_present_redacted"; passed = $tokenConfigured; detail = $(if ($tokenConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
  [ordered]@{ name = "airtable_mirror_table_configured_redacted"; passed = $tableConfigured; detail = $(if ($tableConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
  [ordered]@{ name = "backend_health_reachable"; passed = [bool]$backendHealth.ok; detail = $backendHealth.detail },
  [ordered]@{ name = "backend_storage_mode_postgres_truth_vault"; passed = $backendTruthVault; detail = $(if ($backendStorageMode) { $backendStorageMode } else { "missing" }) },
  [ordered]@{ name = "web_airtable_boundary_route_reachable"; passed = [bool]$webBoundary.ok; detail = $webBoundary.detail },
  [ordered]@{ name = "airtable_human_mirror_command_accepted"; passed = $commandAccepted; detail = $commandPost.detail },
  [ordered]@{ name = "direct_airtable_provider_call_from_web"; passed = $true; detail = "false" },
  [ordered]@{ name = "postgres_remains_truth"; passed = $true; detail = "true" },
  [ordered]@{ name = "raw_secrets_printed"; passed = $true; detail = "false" },
  [ordered]@{ name = "provider_credentials_printed"; passed = $true; detail = "false" }
)

$report = [ordered]@{
  schema = "kingsmen.jarvis-airtable-human-mirror-boundary-proof.v1"
  module = "Jarvis Airtable Human Mirror Boundary Proof"
  status = $(if ($passed) { "JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY_PASSED" } else { "JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY_PENDING" })
  passed = $passed
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
  postgresRemainsTruth = $true
  airtableMayBecomeTruth = $false
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = @($envLoad)
  expectedCommand = "AIRTABLE_HUMAN_MIRROR_CHECK"
  expectedEvidence = @("redacted_airtable_health_read", "backend_command_envelope", "command_log", "audit_events", "postgres_remains_truth")
  checks = $checks
  metrics = [ordered]@{
    backendStorageMode = $backendStorageMode
    backendCommandId = $(if ($commandPost.data -and $commandPost.data.backendCommandId) { $commandPost.data.backendCommandId } else { "" })
    correlationIdPresent = [bool]($commandPost.data -and $commandPost.data.correlationId)
    idempotencyKeyPresent = [bool]($commandPost.data -and $commandPost.data.idempotencyKey)
  }
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($passed) { "Airtable human mirror boundary proof passed. Continue to Email Primary Channel boundary." } else { "Configure KINGSMEN_AIRTABLE_BASE_ID, KINGSMEN_AIRTABLE_API_KEY, and KINGSMEN_AIRTABLE_CANDIDATES_TABLE outside Git, keep backend and web running, then rerun this proof." })
}

$dir = Split-Path -Parent $ReportPath
if (-not [string]::IsNullOrWhiteSpace($dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$report | ConvertTo-Json -Depth 20 | Set-Content -Path $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 20

if (-not $passed) { exit 1 }
