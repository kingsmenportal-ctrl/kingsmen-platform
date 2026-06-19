#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RegistryPath = "manifests/credentials/credentials.registry.json",
  [string]$ReportPath = "reports/security/secrets-wiring-runtime-health-latest.json",
  [switch]$MarkOperatorReviewed
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RegistryPath)) {
  throw "Missing credential registry: $RegistryPath"
}

$registry = Get-Content $RegistryPath -Raw | ConvertFrom-Json
$checks = @()

foreach ($credential in $registry.credentials) {
  $name = [string]$credential.credential_name
  $value = [Environment]::GetEnvironmentVariable($name)
  $status = "not_configured"

  if ($credential.status -eq "NOT_NEEDED_YET" -and [string]::IsNullOrWhiteSpace($value)) {
    $status = "not_needed_yet"
  } elseif (-not [string]::IsNullOrWhiteSpace($value)) {
    $status = "configured_masked"
  }

  $checks += [pscustomobject]@{
    credentialName = $name
    provider = $credential.provider
    requiredForBeta = [bool]$credential.required_for_beta
    requiredForProduction = [bool]$credential.required_for_production
    riskLevel = $credential.risk_level
    visibleToOpenClaw = [bool]$credential.visible_to_openclaw
    status = $status
    valuePrinted = $false
    lengthPrinted = $false
    prefixPrinted = $false
  }
}

$betaMissing = @($checks | Where-Object { $_.requiredForBeta -eq $true -and $_.status -eq "not_configured" } | Select-Object -ExpandProperty credentialName)
$productionMissing = @($checks | Where-Object { $_.requiredForProduction -eq $true -and $_.status -eq "not_configured" } | Select-Object -ExpandProperty credentialName)
$openClawVisible = @($checks | Where-Object { $_.visibleToOpenClaw -eq $true } | Select-Object -ExpandProperty credentialName)

$report = [ordered]@{
  schema = "kingsmen.secrets-wiring-runtime-health.v1"
  module = "Secrets Wiring Runtime Health"
  status = "MASKED_RUNTIME_SECRET_HEALTH_REPORTED"
  passed = ($betaMissing.Count -eq 0 -and $openClawVisible.Count -eq 0)
  reviewed = [bool]$MarkOperatorReviewed
  stagingReviewed = [bool]$MarkOperatorReviewed
  redacted = $true
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  connectionStringsPrinted = $false
  tokenPrefixesPrinted = $false
  keyLengthsPrinted = $false
  openClawRawSecretAccessAllowed = $false
  browserServiceRoleAccessAllowed = $false
  betaMissing = $betaMissing
  productionMissing = $productionMissing
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($betaMissing.Count -eq 0) { "Store this masked report as staging secret-health evidence; production credentials still need launch approval." } else { "Configure required beta secrets outside Git, then rerun this check." })
}

New-Item -ItemType Directory -Force -Path (Split-Path $ReportPath -Parent) | Out-Null
$json = $report | ConvertTo-Json -Depth 20

if ($json.Contains("postgres://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
  throw "Secret-like value detected in masked report output."
}

$json | Set-Content -Encoding utf8 $ReportPath
Write-Output $json

if ($betaMissing.Count -gt 0 -or $openClawVisible.Count -gt 0) {
  exit 1
}
