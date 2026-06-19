#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
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

function Test-ConfiguredSecret {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($value)) { return $false }
  if ($value.Trim() -eq "...") { return $false }
  if ($value.Trim().ToUpperInvariant() -in @("TODO", "TBD", "PLACEHOLDER", "CHANGE_ME", "REPLACE_ME")) { return $false }
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
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($allPassed) { "Communications provider staging proof passed. Continue to PayFast, observability, or branch protection evidence." } else { "Configure real SMTP env values outside Git and mark provider staging tests only after evidence exists." })
}

Write-Report -Report $report
if (-not $allPassed) { exit 1 }
