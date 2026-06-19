param(
  [switch]$MarkProviderConfigured,
  [switch]$MarkBucketAccessTested,
  [switch]$MarkUploadDownloadDeleteTested,
  [switch]$MarkAccessControlReviewed,
  [switch]$MarkFilePolicyReviewed,
  [switch]$MarkMalwareScanBoundaryReviewed,
  [switch]$MarkFounderReviewed,
  [string]$OutputPath = "reports/staging/document-vault-storage-staging-latest.json"
)

$ErrorActionPreference = "Stop"

function Test-PlaceholderValue {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $true }
  $trimmed = $Value.Trim()
  $lower = $trimmed.ToLowerInvariant()
  if ($trimmed -eq "...") { return $true }
  if ($lower -eq "changeme") { return $true }
  if ($lower -eq "your_value_here") { return $true }
  if ($lower -eq "replace_me") { return $true }
  if ($lower -like "replace_*") { return $true }
  if ($lower -like "*.example.com*") { return $true }
  if ($lower -like "example-*") { return $true }
  return $false
}

function New-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  return [ordered]@{
    name = $Name
    passed = $Passed
    detail = $Detail
  }
}

$storageAccessKey = [Environment]::GetEnvironmentVariable("STORAGE_ACCESS_KEY", "Process")
$storageSecretKey = [Environment]::GetEnvironmentVariable("STORAGE_SECRET_KEY", "Process")
$storageBucket = [Environment]::GetEnvironmentVariable("STORAGE_BUCKET", "Process")

$accessKeyReady = -not (Test-PlaceholderValue $storageAccessKey)
$secretKeyReady = -not (Test-PlaceholderValue $storageSecretKey)
$bucketReady = -not (Test-PlaceholderValue $storageBucket)

$checks = @(
  New-Check -Name "storage_access_key_present" -Passed $accessKeyReady -Detail $(if ($accessKeyReady) { "present_redacted" } else { "missing_or_placeholder" })
  New-Check -Name "storage_secret_key_present" -Passed $secretKeyReady -Detail $(if ($secretKeyReady) { "present_redacted" } else { "missing_or_placeholder" })
  New-Check -Name "storage_bucket_present" -Passed $bucketReady -Detail $(if ($bucketReady) { "present_redacted" } else { "missing_or_placeholder" })
  New-Check -Name "provider_configured" -Passed ([bool]$MarkProviderConfigured) -Detail $(if ($MarkProviderConfigured) { "operator_attested" } else { "not_marked" })
  New-Check -Name "bucket_access_tested" -Passed ([bool]$MarkBucketAccessTested) -Detail $(if ($MarkBucketAccessTested) { "operator_attested" } else { "not_marked" })
  New-Check -Name "upload_download_delete_tested" -Passed ([bool]$MarkUploadDownloadDeleteTested) -Detail $(if ($MarkUploadDownloadDeleteTested) { "operator_attested" } else { "not_marked" })
  New-Check -Name "access_control_reviewed" -Passed ([bool]$MarkAccessControlReviewed) -Detail $(if ($MarkAccessControlReviewed) { "operator_attested" } else { "not_marked" })
  New-Check -Name "file_policy_reviewed" -Passed ([bool]$MarkFilePolicyReviewed) -Detail $(if ($MarkFilePolicyReviewed) { "operator_attested" } else { "not_marked" })
  New-Check -Name "malware_scan_boundary_reviewed" -Passed ([bool]$MarkMalwareScanBoundaryReviewed) -Detail $(if ($MarkMalwareScanBoundaryReviewed) { "operator_attested" } else { "not_marked" })
  New-Check -Name "founder_reviewed" -Passed ([bool]$MarkFounderReviewed) -Detail $(if ($MarkFounderReviewed) { "operator_attested" } else { "not_marked" })
  New-Check -Name "raw_credentials_printed" -Passed $true -Detail "false"
  New-Check -Name "raw_candidate_documents_copied" -Passed $true -Detail "false"
)

$failed = @($checks | Where-Object { $_.passed -ne $true })
$passed = ($failed.Count -eq 0)

$report = [ordered]@{
  schema = "kingsmen.staging-runtime-evidence-report.v1"
  module = "Document Vault Storage Staging Evidence"
  status = if ($passed) { "DOCUMENT_VAULT_STORAGE_STAGING_PROOF_PASSED" } else { "PENDING_STAGING_CAPTURE" }
  passed = $passed
  reviewed = ([bool]$MarkFounderReviewed)
  stagingReviewed = ([bool]$MarkFounderReviewed)
  redacted = $true
  productionReady = $false
  publicLaunchAllowed = $false
  rawCredentialsPrinted = $false
  rawConnectionStringsPrinted = $false
  rawCandidateDocumentsCopied = $false
  rawCandidateDataIncluded = $false
  providerSecretsInReportsAllowed = $false
  realDocumentUploadsAllowed = $passed
  checks = $checks
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($passed) { "Document Vault storage staging proof passed. Keep uploads disabled until founder approval and document intake policy review." } else { "Configure real storage credentials outside Git, complete storage smoke proof, then rerun this proof." }
}

$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 12
