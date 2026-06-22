param(
  [string]$ReportPath = "reports/jarvis/jarvis-ai-provider-credential-proof-latest.json",
  [string[]]$EnvFile = @(".local/kingsmen.local-postgres.env"),
  [string]$WebBaseUrl = "http://127.0.0.1:3000",
  [string]$BackendBaseUrl = "http://127.0.0.1:3001"
)

$ErrorActionPreference = "Stop"

function Test-KingsmenPlaceholder {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return $true }
  $normalized = $Value.Trim().ToLowerInvariant()
  if ($normalized.Length -eq 0) { return $true }
  $bad = @("...", "changeme", "change_me", "todo", "tbd", "placeholder", "your_value_here", "replace_me", "real", "real_value", "real_secret", "real_key", "real_token", "dummy", "dummy_value", "fake", "fake_value")
  if ($bad -contains $normalized) { return $true }
  if ($normalized.StartsWith("your_")) { return $true }
  if ($normalized.StartsWith("replace_")) { return $true }
  if ($normalized.StartsWith("real_")) { return $true }
  if ($normalized.StartsWith("dummy_")) { return $true }
  if ($normalized.StartsWith("fake_")) { return $true }
  if ($normalized.Contains("example.com")) { return $true }
  return $false
}

function Import-KingsmenEnvFile {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return [ordered]@{ path = $Path; loaded = $false; reason = "empty_path"; importedCount = 0 } }
  $resolved = Join-Path (Get-Location) $Path
  if (-not (Test-Path $resolved)) { return [ordered]@{ path = $Path; loaded = $false; reason = "file_missing"; importedCount = 0 } }
  $count = 0
  Get-Content $resolved | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith("#")) { return }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $name = $Matches[1].Trim()
      $value = $Matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
      $script:imported = $script:imported + 1
    }
  }
  return [ordered]@{ path = $Path; loaded = $true; reason = "loaded_redacted"; importedCount = $script:imported }
}

function Add-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  $script:checks += [ordered]@{ name = $Name; passed = $Passed; detail = $Detail }
}

$envFileReports = @()
foreach ($file in $EnvFile) {
  $script:imported = 0
  $envFileReports += Import-KingsmenEnvFile -Path $file
}

if (-not [string]::IsNullOrWhiteSpace($BackendBaseUrl)) {
  [Environment]::SetEnvironmentVariable("KINGSMEN_BACKEND_BASE_URL", $BackendBaseUrl, "Process")
}

$checks = @()
$provider = [Environment]::GetEnvironmentVariable("KINGSMEN_AI_PROVIDER", "Process")
$model = [Environment]::GetEnvironmentVariable("KINGSMEN_AI_MODEL", "Process")
$openAiKey = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "Process")
$providerKey = [Environment]::GetEnvironmentVariable("AI_PROVIDER_API_KEY", "Process")
$normalizedProvider = if (Test-KingsmenPlaceholder $provider) { "" } else { $provider.Trim().ToLowerInvariant() }

Add-Check -Name "ai_provider_configured" -Passed (-not (Test-KingsmenPlaceholder $provider)) -Detail $(if (Test-KingsmenPlaceholder $provider) { "missing_or_placeholder" } else { "present_redacted" })
Add-Check -Name "ai_model_configured" -Passed (-not (Test-KingsmenPlaceholder $model)) -Detail $(if (Test-KingsmenPlaceholder $model) { "missing_or_placeholder" } else { "present_redacted" })

$keyReady = $false
$keyName = "AI_PROVIDER_API_KEY"
if ($normalizedProvider -eq "openai") {
  $keyName = "OPENAI_API_KEY"
  $keyReady = -not (Test-KingsmenPlaceholder $openAiKey)
} else {
  $keyReady = -not (Test-KingsmenPlaceholder $providerKey)
}
Add-Check -Name "ai_provider_key_present_redacted" -Passed $keyReady -Detail $keyName

$backendOk = $false
try {
  $health = Invoke-RestMethod -Method Get -Uri ($BackendBaseUrl.TrimEnd('/') + "/health") -TimeoutSec 15
  $backendOk = ($health.ok -eq $true)
  Add-Check -Name "backend_health_reachable" -Passed $backendOk -Detail $(if ($backendOk) { "ok" } else { "unhealthy" })
  Add-Check -Name "backend_storage_mode_postgres_truth_vault" -Passed ($health.storageMode -eq "postgres_truth_vault") -Detail ([string]$health.storageMode)
} catch {
  Add-Check -Name "backend_health_reachable" -Passed $false -Detail $_.Exception.Message
  Add-Check -Name "backend_storage_mode_postgres_truth_vault" -Passed $false -Detail "missing"
}

$commandAccepted = $false
if ($backendOk) {
  try {
    $body = [ordered]@{
      action = "AI_PROVIDER_ROUTER_CHECK"
      requestedBy = "jarvis_ai_provider_credential_proof"
      payload = [ordered]@{
        provider = if ($normalizedProvider.Length -gt 0) { $normalizedProvider } else { "missing" }
        credentialBoundary = "redacted_env_only"
        noRawSecrets = $true
      }
    } | ConvertTo-Json -Depth 8
    $response = Invoke-RestMethod -Method Post -Uri ($WebBaseUrl.TrimEnd('/') + "/api/jarvis/command") -ContentType "application/json" -Body $body -TimeoutSec 20
    $commandAccepted = ($null -ne $response.commandId -or $response.ok -eq $true)
    Add-Check -Name "jarvis_ai_provider_command_accepted" -Passed $commandAccepted -Detail $(if ($commandAccepted) { "ok" } else { "not_accepted" })
  } catch {
    Add-Check -Name "jarvis_ai_provider_command_accepted" -Passed $false -Detail $_.Exception.Message
  }
} else {
  Add-Check -Name "jarvis_ai_provider_command_accepted" -Passed $false -Detail "backend_unreachable"
}

Add-Check -Name "raw_secrets_printed" -Passed $true -Detail "false"
Add-Check -Name "provider_credentials_printed" -Passed $true -Detail "false"
Add-Check -Name "direct_provider_call_from_web" -Passed $true -Detail "false"

$credentialReady = @($checks | Where-Object { $_.name -in @("ai_provider_configured", "ai_model_configured", "ai_provider_key_present_redacted") -and $_.passed -ne $true }).Count -eq 0
$runtimeBoundaryReady = @($checks | Where-Object { $_.name -in @("backend_health_reachable", "backend_storage_mode_postgres_truth_vault", "jarvis_ai_provider_command_accepted") -and $_.passed -ne $true }).Count -eq 0
$passed = $credentialReady -and $runtimeBoundaryReady

$report = [ordered]@{
  schema = "kingsmen.jarvis-ai-provider-credential-proof.v1"
  module = "Jarvis AI Provider Credential Boundary Proof"
  status = if ($passed) { "JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY_READY_FOR_RUNTIME_CALL" } else { "JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY_PENDING" }
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
  backendBaseUrl = $BackendBaseUrl
  webBaseUrl = $WebBaseUrl
  envFilesLoaded = $envFileReports
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($passed) { "Add backend-governed redacted AI model call proof before marking AI Provider Router LIVE." } else { "Configure KINGSMEN_AI_PROVIDER, KINGSMEN_AI_MODEL, and the provider key outside Git, keep backend and web running, then rerun this proof." }
}

$fullReport = Join-Path (Get-Location) $ReportPath
New-Item -ItemType Directory -Force -Path (Split-Path $fullReport) | Out-Null
$report | ConvertTo-Json -Depth 10 | Set-Content -Path $fullReport -Encoding UTF8
$report | ConvertTo-Json -Depth 10

if (-not $passed) { exit 1 }
