param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OutputPath = "reports/final-assembly/final-assembly-evidence-bundle-latest.json",
  [switch]$RequireAll
)

$ErrorActionPreference = "Stop"

$requiredReports = @(
  "reports/staging/truth-vault-persistence-staging-latest.json",
  "reports/staging/web-backend-boundary-staging-latest.json",
  "reports/staging/rls-sql-isolation-staging-latest.json",
  "reports/staging/payfast-provider-sandbox-staging-latest.json",
  "reports/staging/backup-restore-drill-staging-latest.json",
  "reports/security/secrets-wiring-runtime-health-latest.json",
  "reports/staging/communications-provider-staging-latest.json",
  "reports/staging/observability-incident-staging-latest.json",
  "reports/staging/legal-privacy-publication-staging-latest.json",
  "reports/repo/main-branch-protection-apply-latest.json"
)

function Read-JsonSummary {
  param([string]$Path)

  $fullPath = Join-Path $RepoRoot $Path
  if (-not (Test-Path $fullPath)) {
    return [ordered]@{
      path = $Path
      exists = $false
      passed = $false
      reviewed = $false
      redacted = $false
      status = "MISSING_STAGING_REPORT"
      sha256 = $null
      generatedAt = $null
      rawBodyCopied = $false
    }
  }

  $hash = (Get-FileHash -Algorithm SHA256 -Path $fullPath).Hash.ToLowerInvariant()
  $json = Get-Content -Raw -Path $fullPath | ConvertFrom-Json

  $passed = $false
  if ($null -ne $json.passed) { $passed = [bool]$json.passed }

  $reviewed = $false
  foreach ($field in @("reviewed", "founderReviewed", "operatorReviewed", "legalReviewed", "stagingReviewed")) {
    if ($null -ne $json.$field -and [bool]$json.$field) { $reviewed = $true }
  }

  $redacted = $true
  foreach ($field in @("rawSecretsPrinted", "rawCandidateDataPrinted", "providerCredentialsPrinted", "rawReportBodyCopied")) {
    if ($null -ne $json.$field -and [bool]$json.$field) { $redacted = $false }
  }

  return [ordered]@{
    path = $Path
    exists = $true
    passed = $passed
    reviewed = $reviewed
    redacted = $redacted
    status = if ($json.status) { [string]$json.status } else { "STATUS_NOT_REPORTED" }
    sha256 = $hash
    generatedAt = if ($json.generatedAt) { [string]$json.generatedAt } elseif ($json.generated_at) { [string]$json.generated_at } else { $null }
    rawBodyCopied = $false
  }
}

$reportStates = @($requiredReports | ForEach-Object { Read-JsonSummary -Path $_ })
$totalReports = $requiredReports.Count
$presentReports = @($reportStates | Where-Object { $_.exists }).Count
$passedReports = @($reportStates | Where-Object { $_.exists -and $_.passed }).Count
$reviewedReports = @($reportStates | Where-Object { $_.exists -and $_.passed -and $_.reviewed }).Count
$redactedReports = @($reportStates | Where-Object { $_.exists -and $_.redacted }).Count

$bundle = [ordered]@{
  schema = "kingsmen.final-assembly-evidence-bundle.v1"
  module = "Final Assembly Evidence Bundle"
  status = if ($presentReports -eq $totalReports -and $passedReports -eq $totalReports -and $reviewedReports -eq $totalReports -and $redactedReports -eq $totalReports) { "FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW" } else { "FINAL_ASSEMBLY_EVIDENCE_BUNDLE_INCOMPLETE" }
  productionReady = $false
  publicLaunchAllowed = $false
  finalAssemblyCanOpen = $false
  rawReportBodiesCopied = $false
  rawCandidateDataIncluded = $false
  providerCredentialsIncluded = $false
  totalReports = $totalReports
  presentReports = $presentReports
  passedReports = $passedReports
  reviewedReports = $reviewedReports
  redactedReports = $redactedReports
  reports = $reportStates
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = "Review missing, failed, unreviewed, or unredacted staging reports before final assembly."
}

$fullOutputPath = Join-Path $RepoRoot $OutputPath
$outputDir = Split-Path -Parent $fullOutputPath
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Force -Path $outputDir | Out-Null }
$bundle | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -Path $fullOutputPath

Write-Output ($bundle | ConvertTo-Json -Depth 12)

if ($RequireAll -and $bundle.status -ne "FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW") {
  exit 1
}
