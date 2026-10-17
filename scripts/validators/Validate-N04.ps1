$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n04\candidate-core-portal.json",
  "db\migrations\0002_n04_candidate_core.sql",
  "db\seeds\n04_runtime_config_seed.sql",
  "apps\api\src\candidate\candidate-types.ts",
  "apps\api\src\candidate\candidate-profile-readiness.ts",
  "apps\api\src\candidate\candidate-profile-readiness.test.ts",
  "apps\api\src\candidate\smart-intake.ts",
  "apps\api\src\candidate\candidate-auth.ts",
  "apps\api\src\candidate\profile-review.ts",
  "apps\api\src\candidate\candidate-portal-read-model.ts",
  "apps\api\src\candidate\candidate-portal-read-model.test.ts",
  "apps\api\src\candidate\candidate-messages.ts",
  "apps\api\src\candidate\candidate-success-loop.ts",
  "apps\api\src\candidate\index.ts",
  "apps\web\src\candidate-portal\CandidatePortalShell.tsx",
  "apps\web\src\candidate-portal\SmartIntakeReview.tsx",
  "scripts\db\Run-N04Migration.ps1",
  "reports\n04\N04_CANDIDATE_CORE_PORTAL_REPORT.md"
)

$RequiredSqlMarkers = @(
  "CREATE TABLE IF NOT EXISTS candidate_accounts",
  "CREATE TABLE IF NOT EXISTS candidate_sessions",
  "CREATE TABLE IF NOT EXISTS candidate_profile_field_sources",
  "CREATE TABLE IF NOT EXISTS candidate_profile_change_requests",
  "CREATE TABLE IF NOT EXISTS candidate_messages",
  "CREATE TABLE IF NOT EXISTS candidate_support_tickets",
  "CREATE TABLE IF NOT EXISTS candidate_financial_items",
  "CREATE TABLE IF NOT EXISTS candidate_success_events",
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
  Get-Content "$Base\manifests\n04\candidate-core-portal.json" -Raw | ConvertFrom-Json | Out-Null
}
catch {
  $Failures += "Invalid JSON: manifests\n04\candidate-core-portal.json"
}

$N03Sql = ""
if (Test-Path "$Base\db\migrations\0001_n03_truth_vault.sql") {
  $N03Sql = Get-Content "$Base\db\migrations\0001_n03_truth_vault.sql" -Raw
}

if ($N03Sql -match "CREATE POLICY IF NOT EXISTS") {
  $Failures += "N03 migration still contains invalid CREATE POLICY IF NOT EXISTS syntax."
}

$N04Sql = ""
if (Test-Path "$Base\db\migrations\0002_n04_candidate_core.sql") {
  $N04Sql = Get-Content "$Base\db\migrations\0002_n04_candidate_core.sql" -Raw
}

foreach ($Marker in $RequiredSqlMarkers) {
  if ($N04Sql -notmatch [regex]::Escape($Marker)) {
    $Failures += "N04 migration missing SQL marker: $Marker"
  }
}

$SmartIntake = Get-Content "$Base\apps\api\src\candidate\smart-intake.ts" -Raw
foreach ($Marker in @(
  "buildSmartIntakeReview",
  "prefilledFields",
  "missingFields",
  "reviewRequiredFields",
  "CANDIDATE_REVIEW",
  "ASK_MISSING_FIELDS",
  "OPERATOR_REVIEW"
)) {
  if ($SmartIntake -notmatch $Marker) {
    $Failures += "Smart intake missing marker: $Marker"
  }
}

$ProfileReadiness = Get-Content "$Base\apps\api\src\candidate\candidate-profile-readiness.ts" -Raw
foreach ($Marker in @(
  "evaluateCandidateProfileReadiness",
  "DOCUMENT_READINESS_OWNERSHIP_MISMATCH",
  "IDENTITY_LINK_",
  "CANDIDATE_ACCOUNT_NOT_ACTIVE",
  "missingFields",
  "nextActions"
)) {
  if ($ProfileReadiness -notmatch [regex]::Escape($Marker)) {
    $Failures += "Candidate profile readiness missing marker: $Marker"
  }
}

$ProfileReadinessTest = Get-Content "$Base\apps\api\src\candidate\candidate-profile-readiness.test.ts" -Raw
foreach ($Marker in @(
  "ready requires active account",
  "pending identity prevents ready state",
  "disabled and suspended accounts are blocked",
  "fails closed if document readiness belongs to another candidate"
)) {
  if ($ProfileReadinessTest -notmatch [regex]::Escape($Marker)) {
    $Failures += "Candidate profile readiness regression test missing marker: $Marker"
  }
}

$MessagePolicy = Get-Content "$Base\apps\api\src\candidate\candidate-messages.ts" -Raw
if ($MessagePolicy -notmatch "WhatsApp is urgent-only") {
  $Failures += "Candidate message policy missing WhatsApp urgent-only rule."
}

$ProfileReview = Get-Content "$Base\apps\api\src\candidate\profile-review.ts" -Raw
if ($ProfileReview -notmatch "requiresOperatorApproval") {
  $Failures += "Profile review missing operator approval boundary."
}

$PortalShell = Get-Content "$Base\apps\web\src\candidate-portal\CandidatePortalShell.tsx" -Raw
if ($PortalShell -notmatch "Kingsmen Candidate Portal") {
  $Failures += "Candidate portal shell missing portal title."
}

$ApiIndex = Get-Content "$Base\apps\api\src\index.ts" -Raw
if ($ApiIndex -notmatch [regex]::Escape('export * from "./candidate";')) {
  $Failures += "API index missing candidate export."
}

$PortalReadModel = Get-Content "$Base\apps\api\src\candidate\candidate-portal-read-model.ts" -Raw
foreach ($Marker in @(
  "CANDIDATE_PORTAL_READINESS_OWNERSHIP_MISMATCH",
  "readiness.ready",
  "IDENTITY_LINK_REJECTED",
  "Applications are blocked until the account and identity requirements are resolved"
)) {
  if ($PortalReadModel -notmatch [regex]::Escape($Marker)) {
    $Failures += "Candidate portal readiness gate missing marker: $Marker"
  }
}

$PortalReadModelTest = Get-Content "$Base\apps\api\src\candidate\candidate-portal-read-model.test.ts" -Raw
foreach ($Marker in @(
  "application card is ready only when server readiness is ready",
  "legacy READY application summary is gated",
  "rejected identity blocks application card",
  "candidate ownership mismatch fails closed"
)) {
  if ($PortalReadModelTest -notmatch [regex]::Escape($Marker)) {
    $Failures += "Candidate portal readiness regression test missing marker: $Marker"
  }
}

$Result = [ordered]@{
  module = "N04"
  name = "Candidate Core & Portal"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
  required_files = $RequiredFiles
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n04" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n04\N04_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N04 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N04 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n04\N04_VALIDATION_RESULT.json" -ForegroundColor Green