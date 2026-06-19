#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ReportPath = "reports/staging/legal-privacy-publication-staging-latest.json",
  [string]$TermsUrl = "",
  [string]$PrivacyUrl = "",
  [string]$ConsentUrl = "",
  [string]$RefundUrl = "",
  [string]$DataSubjectRequestUrl = "",
  [string]$SupportComplaintUrl = "",
  [string]$TermsFile = "",
  [string]$PrivacyFile = "",
  [string]$ConsentFile = "",
  [string]$RefundFile = "",
  [string]$DataSubjectRequestFile = "",
  [string]$SupportComplaintFile = "",
  [string]$PolicyVersion = "",
  [switch]$MarkPoliciesPublished,
  [switch]$MarkFounderReviewed,
  [switch]$MarkConsentSmokeTested,
  [switch]$MarkRefundDisplaySmokeTested,
  [switch]$MarkDataSubjectRequestSmokeTested
)

$ErrorActionPreference = "Stop"

function Add-Check {
  param([array]$Checks, [string]$Name, [bool]$Passed, [string]$Detail)
  return @($Checks + @([ordered]@{ name = $Name; passed = $Passed; detail = $Detail }))
}

function Resolve-FilePath {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return "" }
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return (Join-Path $RepoRoot $Path)
}

function Test-UrlPublished {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $false }
  try {
    $response = Invoke-WebRequest -Method GET -Uri $Url -UseBasicParsing -TimeoutSec 20
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
  } catch {
    return $false
  }
}

function Test-FilePublished {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $full = Resolve-FilePath $Path
  return ((Test-Path $full) -and ((Get-Item $full).Length -gt 0))
}

function Test-Surface {
  param([string]$Url, [string]$File)
  if (-not [string]::IsNullOrWhiteSpace($Url)) { return Test-UrlPublished $Url }
  if (-not [string]::IsNullOrWhiteSpace($File)) { return Test-FilePublished $File }
  return $false
}

function RedactedSurfaceDetail {
  param([string]$Url, [string]$File)
  if (-not [string]::IsNullOrWhiteSpace($Url)) {
    try {
      $uri = [Uri]$Url
      return "url_host_path_present:$($uri.Host)$($uri.AbsolutePath)"
    } catch { return "url_present_redacted" }
  }
  if (-not [string]::IsNullOrWhiteSpace($File)) { return "file_present_redacted" }
  return "missing"
}

function Write-Report {
  param([object]$Report)
  $fullPath = Join-Path $RepoRoot $ReportPath
  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $json = $Report | ConvertTo-Json -Depth 20
  if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
    throw "Secret-like value detected in legal publication report output."
  }
  $json | Set-Content -Encoding UTF8 -Path $fullPath
  Write-Output $json
}

Set-Location $RepoRoot
$checks = @()

$surfaceSpecs = @(
  @{ name = "terms_of_service_published"; url = $TermsUrl; file = $TermsFile },
  @{ name = "privacy_notice_published"; url = $PrivacyUrl; file = $PrivacyFile },
  @{ name = "consent_notice_published"; url = $ConsentUrl; file = $ConsentFile },
  @{ name = "refund_payment_policy_published"; url = $RefundUrl; file = $RefundFile },
  @{ name = "data_subject_request_path_published"; url = $DataSubjectRequestUrl; file = $DataSubjectRequestFile },
  @{ name = "support_complaint_path_published"; url = $SupportComplaintUrl; file = $SupportComplaintFile }
)

foreach ($surface in $surfaceSpecs) {
  $ok = Test-Surface -Url $surface.url -File $surface.file
  $detail = RedactedSurfaceDetail -Url $surface.url -File $surface.file
  $checks = Add-Check $checks $surface.name $ok $detail
}

$checks = Add-Check $checks "policy_version_recorded" (-not [string]::IsNullOrWhiteSpace($PolicyVersion)) ($(if ([string]::IsNullOrWhiteSpace($PolicyVersion)) { "missing" } else { "version_recorded" }))
$checks = Add-Check $checks "policies_marked_published" ([bool]$MarkPoliciesPublished) "operator_attested"
$checks = Add-Check $checks "founder_or_legal_review_marked" ([bool]$MarkFounderReviewed) "operator_attested"
$checks = Add-Check $checks "consent_capture_smoke_tested" ([bool]$MarkConsentSmokeTested) "operator_attested"
$checks = Add-Check $checks "refund_display_smoke_tested" ([bool]$MarkRefundDisplaySmokeTested) "operator_attested"
$checks = Add-Check $checks "data_subject_request_smoke_tested" ([bool]$MarkDataSubjectRequestSmokeTested) "operator_attested"
$checks = Add-Check $checks "raw_policy_bodies_copied" $true "false"
$checks = Add-Check $checks "raw_candidate_data_included" $true "false"

$failed = @($checks | Where-Object { $_.passed -ne $true })
$passed = ($failed.Count -eq 0)

$report = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-report.v1"
  module = "Legal Privacy Publication Staging Evidence"
  status = $(if ($passed) { "LEGAL_PRIVACY_PUBLICATION_STAGING_PROOF_PASSED" } else { "PENDING_STAGING_CAPTURE" })
  passed = $passed
  reviewed = [bool]$MarkFounderReviewed
  stagingReviewed = [bool]$MarkFounderReviewed
  redacted = $true
  productionReady = $false
  publicLaunchAllowed = $false
  finalLegalAdviceProvidedByCode = $false
  publishedPoliciesRequired = $true
  policyVersionRecorded = (-not [string]::IsNullOrWhiteSpace($PolicyVersion))
  rawPolicyBodiesCopied = $false
  rawCandidateDataIncluded = $false
  providerCredentialsIncluded = $false
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($passed) { "Legal/privacy publication staging proof passed. Continue to PayFast, communications, observability, or branch protection evidence." } else { "Publish/version required policy surfaces, capture founder/legal review, consent smoke proof, refund display proof, and data-subject request proof, then rerun." })
}

Write-Report -Report $report
if (-not $passed) { exit 1 }
