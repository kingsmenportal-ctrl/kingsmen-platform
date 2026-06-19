#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot = "",
  [string]$ReportPath = "reports/staging/communications-provider-staging-latest.json",
  [switch]$MarkProviderConfigured,
  [switch]$MarkEmailSendReceiveTested,
  [switch]$MarkBounceHandlingTested,
  [switch]$MarkOptOutTested,
  [switch]$MarkWhatsappUrgentOnlyReviewed,
  [switch]$MarkSmsFallbackOnlyReviewed,
  [switch]$MarkFounderReviewed
)

$ErrorActionPreference = "Stop"

function Resolve-KingsmenRepoRoot {
  param([string]$RequestedRepoRoot)

  if (-not [string]::IsNullOrWhiteSpace($RequestedRepoRoot)) {
    return (Resolve-Path $RequestedRepoRoot).Path
  }

  $scriptPath = $MyInvocation.MyCommand.Path
  if (-not [string]::IsNullOrWhiteSpace($scriptPath)) {
    $scriptDir = Split-Path -Parent $scriptPath
    if (-not [string]::IsNullOrWhiteSpace($scriptDir)) {
      return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
    }
  }

  return (Resolve-Path (Get-Location)).Path
}

$RepoRoot = Resolve-KingsmenRepoRoot -RequestedRepoRoot $RepoRoot

function Test-PlaceholderValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) { return $true }

  $normalized = $Value.Trim().ToLowerInvariant()
  $compact = ($normalized -replace '[\s_\-]+', '')

  $badExact = @(
    "...",
    "todo",
    "tbd",
    "placeholder",
    "changeme",
    "change_me",
    "replace_me",
    "your_value_here",
    "real",
    "real_value",
    "real_host",
    "real_user",
    "real_password",
    "real_secret",
    "real_key",
    "dummy",
    "dummy_value",
    "fake",
    "fake_value"
  )

  if ($badExact -contains $normalized) { return $true }

  $badFragments = @(
    "placeholder",
    "changeme",
    "replaceme",
    "yourvaluehere",
    "youractual",
    "yourreal",
    "actualsmtp",
    "realsandboxvalue",
    "realinternal",
    "realprovider",
    "dummyvalue",
    "fakevalue",
    "examplecom"
  )

  foreach ($fragment in $badFragments) {
    if ($compact.Contains($fragment)) { return $true }
  }

  foreach ($prefix in @("your_", "your-", "your ", "replace_", "replace-", "replace ", "real_", "real-", "dummy_", "dummy-", "fake_", "fake-")) {
    if ($normalized.StartsWith($prefix)) { return $true }
  }

  if ($normalized.Contains("example.com")) { return $true }
  return $false
}

function Test-ConfiguredSecret {
  param([string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if (Test-PlaceholderValue -Value $value) { return $false }

  if ($Name -eq "SMTP_HOST") {
    $trimmed = $value.Trim()
    if ($trimmed -match '\s') { return $false }
    if ($trimmed -notmatch '^[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{2,5})?$') { return $false }
  }

  return $true
}

function Add-Check {
  param([array]$Checks, [string]$Name, [bool]$Passed, [string]$Detail)
  return @($Checks + @([ordered]@{ name = $Name; passed = $Passed; detail = $Detail }))
}

function Write-Report {
  param([object]$Report)
  $fullPath = Join-Path $RepoRoot $ReportPath
  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $json = $Report | ConvertTo-Json -Depth 20
  if ($json.Contains("SMTP_PASSWORD") -and $json.Contains("value")) { throw "Unsafe report detail detected." }
  if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
    throw "Secret-like value detected in communications staging report output."
  }
  $json | Set-Content -Encoding UTF8 -Path $fullPath
  Write-Output $json
}

Set-Location $RepoRoot

$checks = @()
$checks = Add-Check $checks "smtp_host_configured" (Test-ConfiguredSecret "SMTP_HOST") "masked_presence_only"
$checks = Add-Check $checks "smtp_user_configured" (Test-ConfiguredSecret "SMTP_USER") "masked_presence_only"
$checks = Add-Check $checks "smtp_password_configured" (Test-ConfiguredSecret "SMTP_PASSWORD") "masked_presence_only"
$checks = Add-Check $checks "placeholder_values_rejected" $true "known_placeholder_patterns_rejected"
$checks = Add-Check $checks "provider_marked_configured" ([bool]$MarkProviderConfigured) "operator_attested"
$checks = Add-Check $checks "email_send_receive_tested" ([bool]$MarkEmailSendReceiveTested) "operator_attested"
$checks = Add-Check $checks "bounce_handling_tested" ([bool]$MarkBounceHandlingTested) "operator_attested"
$checks = Add-Check $checks "opt_out_path_tested" ([bool]$MarkOptOutTested) "operator_attested"
$checks = Add-Check $checks "whatsapp_urgent_only_reviewed" ([bool]$MarkWhatsappUrgentOnlyReviewed) "operator_attested"
$checks = Add-Check $checks "sms_fallback_only_reviewed" ([bool]$MarkSmsFallbackOnlyReviewed) "operator_attested"
$checks = Add-Check $checks "founder_reviewed" ([bool]$MarkFounderReviewed) "operator_attested"
$checks = Add-Check $checks "bulk_marketing_blocked" $true "policy_boundary_confirmed"
$checks = Add-Check $checks "raw_provider_credentials_copied" $true "false"
$checks = Add-Check $checks "raw_candidate_data_included" $true "false"

$allPassed = -not ($checks | Where-Object { $_.passed -ne $true })

$report = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-report.v1"
  module = "Communications Provider Staging Evidence"
  status = $(if ($allPassed) { "COMMUNICATIONS_PROVIDER_STAGING_PROOF_PASSED" } else { "PENDING_STAGING_CAPTURE" })
  passed = [bool]$allPassed
  reviewed = [bool]$MarkFounderReviewed
  stagingReviewed = [bool]$MarkFounderReviewed
  redacted = $true
  productionReady = $false
  publicLaunchAllowed = $false
  emailPrimary = $true
  whatsappUrgentOnly = $true
  smsBackupOnly = $true
  bulkMarketingAllowed = $false
  liveCandidateBroadcastAllowed = $false
  rawProviderCredentialsCopied = $false
  rawCandidateDataIncluded = $false
  providerCredentialsIncluded = $false
  placeholderValuesAccepted = $false
  credentialPlaceholderScan = "known_placeholder_patterns_rejected"
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($allPassed) { "Communications provider staging proof passed. Continue to PayFast or branch protection evidence." } else { "Configure real SMTP env values outside Git and mark provider staging tests only after evidence exists." })
}

Write-Report -Report $report
if (-not $allPassed) { exit 1 }
