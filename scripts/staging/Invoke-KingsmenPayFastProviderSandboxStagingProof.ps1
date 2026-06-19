#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$ReportPath = "reports/staging/payfast-provider-sandbox-staging-latest.json",
  [switch]$MarkSandboxMerchantConfigured,
  [switch]$MarkSandboxCheckoutCreated,
  [switch]$MarkSandboxItnReceived,
  [switch]$MarkSignatureVerified,
  [switch]$MarkAmountVerified,
  [switch]$MarkDuplicateItnRejected,
  [switch]$MarkFailedPaymentRejected,
  [switch]$MarkReturnCancelNotPaidReviewed,
  [switch]$MarkRefundHumanReviewConfirmed,
  [switch]$MarkFounderReviewed
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    $RepoRoot = (Get-Location).Path
  } else {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  }
}

function Test-ConfiguredSecret {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($value)) { return $false }
  $normalized = $value.Trim().ToLowerInvariant()
  $bad = @(
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
    "real_id",
    "real_key",
    "real_secret",
    "real_passphrase",
    "real_url",
    "dummy",
    "dummy_value",
    "fake",
    "fake_value",
    "sandbox-passphrase-reference-only",
    "sandbox-merchant-key-reference-only"
  )
  if ($bad -contains $normalized) { return $false }
  if ($normalized.StartsWith("your_")) { return $false }
  if ($normalized.StartsWith("replace_")) { return $false }
  if ($normalized.StartsWith("real_")) { return $false }
  if ($normalized.StartsWith("dummy_")) { return $false }
  if ($normalized.StartsWith("fake_")) { return $false }
  if ($normalized.Contains("example.com")) { return $false }
  return $true
}

function Test-ConfiguredNotifyUrl {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($value)) { return $false }
  if (-not (Test-ConfiguredSecret $Name)) { return $false }
  $trimmed = $value.Trim()
  $uri = $null
  if (-not [Uri]::TryCreate($trimmed, [UriKind]::Absolute, [ref]$uri)) { return $false }
  if ($uri.Scheme -ne "https" -and -not ($uri.Scheme -eq "http" -and ($uri.Host -eq "127.0.0.1" -or $uri.Host -eq "localhost"))) { return $false }
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
  if ($json.Contains("PAYFAST_MERCHANT_KEY") -and $json.Contains("value")) { throw "Unsafe PayFast report detail detected." }
  if ($json.Contains("PAYFAST_PASSPHRASE") -and $json.Contains("value")) { throw "Unsafe PayFast passphrase report detail detected." }
  if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
    throw "Secret-like value detected in PayFast staging report output."
  }
  $json | Set-Content -Encoding UTF8 -Path $fullPath
  Write-Output $json
}

Set-Location $RepoRoot

$checks = @()
$checks = Add-Check $checks "payfast_merchant_id_configured" (Test-ConfiguredSecret "PAYFAST_MERCHANT_ID") "masked_presence_only"
$checks = Add-Check $checks "payfast_merchant_key_configured" (Test-ConfiguredSecret "PAYFAST_MERCHANT_KEY") "masked_presence_only"
$checks = Add-Check $checks "payfast_passphrase_configured" (Test-ConfiguredSecret "PAYFAST_PASSPHRASE") "masked_presence_only"
$checks = Add-Check $checks "payfast_notify_url_configured" (Test-ConfiguredNotifyUrl "PAYFAST_NOTIFY_URL") "https_or_localhost_url_presence_only"
$checks = Add-Check $checks "payment_provider_secret_configured" (Test-ConfiguredSecret "PAYMENT_PROVIDER_SECRET") "masked_presence_only"
$checks = Add-Check $checks "sandbox_merchant_configured" ([bool]$MarkSandboxMerchantConfigured) "operator_attested"
$checks = Add-Check $checks "sandbox_checkout_created" ([bool]$MarkSandboxCheckoutCreated) "operator_attested"
$checks = Add-Check $checks "sandbox_itn_received" ([bool]$MarkSandboxItnReceived) "operator_attested"
$checks = Add-Check $checks "signature_verified" ([bool]$MarkSignatureVerified) "operator_attested"
$checks = Add-Check $checks "amount_verified" ([bool]$MarkAmountVerified) "operator_attested"
$checks = Add-Check $checks "duplicate_itn_rejected" ([bool]$MarkDuplicateItnRejected) "operator_attested"
$checks = Add-Check $checks "failed_payment_rejected" ([bool]$MarkFailedPaymentRejected) "operator_attested"
$checks = Add-Check $checks "return_cancel_not_paid_reviewed" ([bool]$MarkReturnCancelNotPaidReviewed) "operator_attested"
$checks = Add-Check $checks "refund_human_review_confirmed" ([bool]$MarkRefundHumanReviewConfirmed) "operator_attested"
$checks = Add-Check $checks "founder_reviewed" ([bool]$MarkFounderReviewed) "operator_attested"
$checks = Add-Check $checks "candidate_charged_in_sandbox_only" $true "no_live_candidate_charge"
$checks = Add-Check $checks "raw_provider_credentials_copied" $true "false"
$checks = Add-Check $checks "raw_candidate_data_included" $true "false"

$allPassed = -not ($checks | Where-Object { $_.passed -ne $true })

$report = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-report.v1"
  module = "PayFast Provider Sandbox Staging Evidence"
  status = $(if ($allPassed) { "PAYFAST_PROVIDER_SANDBOX_STAGING_PROOF_PASSED" } else { "PENDING_STAGING_CAPTURE" })
  passed = [bool]$allPassed
  reviewed = [bool]$MarkFounderReviewed
  stagingReviewed = [bool]$MarkFounderReviewed
  redacted = $true
  productionReady = $false
  publicLaunchAllowed = $false
  payfastEnvironment = "sandbox"
  livePaymentsEnabled = $false
  candidateCharged = $false
  paymentStatusChangesRequireAcceptedItn = $true
  refundsAutoApproved = $false
  rawProviderCredentialsCopied = $false
  rawCandidateDataIncluded = $false
  providerCredentialsIncluded = $false
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($allPassed) { "PayFast sandbox staging proof passed. Keep live payments disabled until final founder approval and production PayFast switch-over." } else { "Configure real PayFast sandbox env values outside Git, complete sandbox checkout and ITN evidence, then rerun this proof." })
}

Write-Report -Report $report
if (-not $allPassed) { exit 1 }
