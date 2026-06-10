$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n06\route-universe-workbench.json",
  "db\migrations\0004_n06_route_universe.sql",
  "db\seeds\n06_route_universe_seed.sql",
  "apps\api\src\routes\route-types.ts",
  "apps\api\src\routes\source-confidence.ts",
  "apps\api\src\routes\portal-health.ts",
  "apps\api\src\routes\route-readiness.ts",
  "apps\api\src\routes\application-workbench.ts",
  "apps\api\src\routes\cao-boundary.ts",
  "apps\api\src\routes\nsfas-support.ts",
  "apps\api\src\routes\map-fallback.ts",
  "apps\api\src\routes\route-universe-repository.ts",
  "apps\api\src\routes\index.ts",
  "apps\web\src\application-workbench\ApplicationWorkbenchPanel.tsx",
  "apps\web\src\application-workbench\RouteReadinessPanel.tsx",
  "scripts\db\Run-N06Migration.ps1",
  "reports\n06\N06_ROUTE_UNIVERSE_WORKBENCH_REPORT.md"
)

$RequiredSqlMarkers = @(
  "CREATE TABLE IF NOT EXISTS route_categories",
  "CREATE TABLE IF NOT EXISTS route_providers",
  "CREATE TABLE IF NOT EXISTS route_programmes",
  "CREATE TABLE IF NOT EXISTS route_requirements",
  "CREATE TABLE IF NOT EXISTS route_deadlines",
  "CREATE TABLE IF NOT EXISTS route_fees",
  "CREATE TABLE IF NOT EXISTS portal_dna",
  "CREATE TABLE IF NOT EXISTS portal_health_checks",
  "CREATE TABLE IF NOT EXISTS application_workbench_items",
  "CREATE TABLE IF NOT EXISTS route_readiness_snapshots",
  "CREATE TABLE IF NOT EXISTS cao_choice_items",
  "CREATE TABLE IF NOT EXISTS nsfas_support_cases",
  "CREATE TABLE IF NOT EXISTS map_manual_packages",
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
  Get-Content "$Base\manifests\n06\route-universe-workbench.json" -Raw | ConvertFrom-Json | Out-Null
}
catch {
  $Failures += "Invalid JSON: manifests\n06\route-universe-workbench.json"
}

$N03Sql = ""
if (Test-Path "$Base\db\migrations\0001_n03_truth_vault.sql") {
  $N03Sql = Get-Content "$Base\db\migrations\0001_n03_truth_vault.sql" -Raw
}

if ($N03Sql -match "CREATE POLICY IF NOT EXISTS") {
  $Failures += "N03 migration still contains invalid CREATE POLICY IF NOT EXISTS syntax."
}

$N06Sql = ""
if (Test-Path "$Base\db\migrations\0004_n06_route_universe.sql") {
  $N06Sql = Get-Content "$Base\db\migrations\0004_n06_route_universe.sql" -Raw
}

foreach ($Marker in $RequiredSqlMarkers) {
  if ($N06Sql -notmatch [regex]::Escape($Marker)) {
    $Failures += "N06 migration missing SQL marker: $Marker"
  }
}

$Seed = ""
if (Test-Path "$Base\db\seeds\n06_route_universe_seed.sql") {
  $Seed = Get-Content "$Base\db\seeds\n06_route_universe_seed.sql" -Raw
}

foreach ($Marker in @(
  "https://www.gov.za/about-sa/education",
  "https://www.dhet.gov.za/SitePages/Universities.aspx",
  "https://www.cao.ac.za/",
  "https://www.nsfas.org.za/content/how-to-apply.html",
  "CAO_CHILD_CHOICES_MAX",
  "NSFAS_SUPPORT_IS_NOT_APPROVAL_GUARANTEE"
)) {
  if ($Seed -notmatch [regex]::Escape($Marker)) {
    $Failures += "N06 seed missing official source/rule marker: $Marker"
  }
}

$ReadinessTs = Get-Content "$Base\apps\api\src\routes\route-readiness.ts" -Raw
foreach ($Marker in @(
  "evaluateRouteReadiness",
  "SOURCE_REVIEW_REQUIRED",
  "MANUAL_REQUIRED",
  "MAP",
  "PRIVATE_PROVIDER_ACCREDITATION_CHECK_REQUIRED"
)) {
  if ($ReadinessTs -notmatch $Marker) {
    $Failures += "Route readiness missing marker: $Marker"
  }
}

$CaoTs = Get-Content "$Base\apps\api\src\routes\cao-boundary.ts" -Raw
if ($CaoTs -notmatch "up to six") {
  $Failures += "CAO boundary missing six-choice rule marker."
}

$NsfasTs = Get-Content "$Base\apps\api\src\routes\nsfas-support.ts" -Raw
if ($NsfasTs -notmatch "nsfasSupportIsApprovalGuarantee") {
  $Failures += "NSFAS module missing no-guarantee function."
}

$MapTs = Get-Content "$Base\apps\api\src\routes\map-fallback.ts" -Raw
if ($MapTs -notmatch "Manual Application Package") {
  $Failures += "MAP fallback module missing manual package marker."
}

$ApiIndex = Get-Content "$Base\apps\api\src\index.ts" -Raw
if ($ApiIndex -notmatch [regex]::Escape('export * from "./routes";')) {
  $Failures += "API index missing routes export."
}

$WorkbenchPanel = Get-Content "$Base\apps\web\src\application-workbench\ApplicationWorkbenchPanel.tsx" -Raw
if ($WorkbenchPanel -notmatch "Kingsmen application workbench") {
  $Failures += "Application workbench panel missing accessible label."
}

$Result = [ordered]@{
  module = "N06"
  name = "Route Universe / Application Workbench"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
  required_files = $RequiredFiles
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n06" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n06\N06_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N06 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N06 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n06\N06_VALIDATION_RESULT.json" -ForegroundColor Green