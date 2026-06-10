$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n05\document-vault.json",
  "db\migrations\0003_n05_document_vault.sql",
  "db\seeds\n05_runtime_config_seed.sql",
  "apps\api\src\documents\document-types.ts",
  "apps\api\src\documents\document-policy.ts",
  "apps\api\src\documents\document-readiness.ts",
  "apps\api\src\documents\document-request-engine.ts",
  "apps\api\src\documents\document-verification.ts",
  "apps\api\src\documents\document-fraud.ts",
  "apps\api\src\documents\document-extraction-bridge.ts",
  "apps\api\src\documents\document-storage.ts",
  "apps\api\src\documents\document-vault-repository.ts",
  "apps\api\src\documents\index.ts",
  "apps\web\src\document-vault\DocumentVaultPanel.tsx",
  "apps\web\src\document-vault\DocumentUploadChecklist.tsx",
  "scripts\db\Run-N05Migration.ps1",
  "reports\n05\N05_DOCUMENT_VAULT_REPORT.md"
)

$RequiredSqlMarkers = @(
  "CREATE TABLE IF NOT EXISTS document_files",
  "CREATE TABLE IF NOT EXISTS document_requests",
  "CREATE TABLE IF NOT EXISTS document_analysis",
  "CREATE TABLE IF NOT EXISTS document_verifications",
  "CREATE TABLE IF NOT EXISTS document_fraud_flags",
  "CREATE TABLE IF NOT EXISTS document_storage_events",
  "CREATE TABLE IF NOT EXISTS document_readiness_snapshots",
  "ENABLE ROW LEVEL SECURITY",
  "DROP POLICY IF EXISTS"
)

$Failures = @()

foreach ($File in $RequiredFiles) {
  $Full = Join-Path $Base $File
  if (!(Test-Path $Full)) {
    $Failures += "Missing file: $File"
  }
}

try {
  Get-Content "$Base\manifests\n05\document-vault.json" -Raw | ConvertFrom-Json | Out-Null
}
catch {
  $Failures += "Invalid JSON: manifests\n05\document-vault.json"
}

$N03Sql = ""
if (Test-Path "$Base\db\migrations\0001_n03_truth_vault.sql") {
  $N03Sql = Get-Content "$Base\db\migrations\0001_n03_truth_vault.sql" -Raw
}

if ($N03Sql -match "CREATE POLICY IF NOT EXISTS") {
  $Failures += "N03 migration still contains invalid CREATE POLICY IF NOT EXISTS syntax."
}

$N05Sql = ""
if (Test-Path "$Base\db\migrations\0003_n05_document_vault.sql") {
  $N05Sql = Get-Content "$Base\db\migrations\0003_n05_document_vault.sql" -Raw
}

foreach ($Marker in $RequiredSqlMarkers) {
  if ($N05Sql -notmatch [regex]::Escape($Marker)) {
    $Failures += "N05 migration missing SQL marker: $Marker"
  }
}

$PolicyTs = Get-Content "$Base\apps\api\src\documents\document-policy.ts" -Raw
foreach ($Marker in @(
  "ALLOWED_DOCUMENT_MIME_TYPES",
  "MAX_DOCUMENT_FILE_SIZE_BYTES",
  "evaluateDocumentUploadPolicy",
  "protectedData",
  "WHATSAPP_URGENT"
)) {
  if ($PolicyTs -notmatch $Marker) {
    $Failures += "Document policy missing marker: $Marker"
  }
}

$ReadinessTs = Get-Content "$Base\apps\api\src\documents\document-readiness.ts" -Raw
foreach ($Marker in @(
  "buildDocumentReadinessSnapshot",
  "missingDocumentTypes",
  "readyDocumentTypes",
  "reviewRequiredDocumentTypes",
  "READY"
)) {
  if ($ReadinessTs -notmatch $Marker) {
    $Failures += "Document readiness missing marker: $Marker"
  }
}

$BridgeTs = Get-Content "$Base\apps\api\src\documents\document-extraction-bridge.ts" -Raw
foreach ($Marker in @(
  "mapDocumentExtractionToCandidateFieldSources",
  "candidateConfirmed: false",
  "operatorReviewRequired"
)) {
  if ($BridgeTs -notmatch $Marker) {
    $Failures += "Document extraction bridge missing marker: $Marker"
  }
}

$FraudTs = Get-Content "$Base\apps\api\src\documents\document-fraud.ts" -Raw
if ($FraudTs -notmatch "fraudFlagIsFinalDecision") {
  $Failures += "Fraud module missing non-final decision rule."
}

$ApiIndex = Get-Content "$Base\apps\api\src\index.ts" -Raw
if ($ApiIndex -notmatch [regex]::Escape('export * from "./documents";')) {
  $Failures += "API index missing documents export."
}

$Panel = Get-Content "$Base\apps\web\src\document-vault\DocumentVaultPanel.tsx" -Raw
if ($Panel -notmatch "Kingsmen document vault") {
  $Failures += "Document vault panel missing accessible label."
}

$Result = [ordered]@{
  module = "N05"
  name = "Document Vault"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
  required_files = $RequiredFiles
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n05" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n05\N05_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N05 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N05 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n05\N05_VALIDATION_RESULT.json" -ForegroundColor Green