$ErrorActionPreference = "Stop"
$Base = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Base

$Failures = New-Object System.Collections.Generic.List[string]

function Require-File([string]$Path) {
  if (!(Test-Path $Path)) { $Failures.Add("Missing file: $Path") }
}

function Require-Contains([string]$Path,[string]$Needle,[string]$Message) {
  Require-File $Path
  if (Test-Path $Path) {
    $Text = Get-Content $Path -Raw
    if ($Text -notlike "*$Needle*") { $Failures.Add($Message) }
  }
}

$Files = @(
  "manifests\n18\public-website-route-house-front-door.json",
  "db\migrations\0016_n18_public_website.sql",
  "db\seeds\n18_public_website_seed.sql",
  "runtime\public-website\public-website-runtime.example.json",
  "apps\api\src\public-website\public-website-types.ts",
  "apps\api\src\public-website\route-house-copy.ts",
  "apps\api\src\public-website\package-boundaries.ts",
  "apps\api\src\public-website\sector-universe.ts",
  "apps\api\src\public-website\destiny-map-preview.ts",
  "apps\api\src\public-website\lead-intake.ts",
  "apps\api\src\public-website\content-guardrails.ts",
  "apps\api\src\public-website\website-read-model.ts",
  "apps\api\src\public-website\source-disclosures.ts",
  "apps\api\src\public-website\index.ts",
  "apps\web\src\public-site\PublicHomePage.tsx",
  "apps\web\src\public-site\RouteHouseHero.tsx",
  "apps\web\src\public-site\DestinyMapPreviewPanel.tsx",
  "apps\web\src\public-site\PricingBoundaryPanel.tsx",
  "apps\web\src\public-site\SectorUniversePanel.tsx",
  "apps\web\src\public-site\TrustSafetyPanel.tsx",
  "apps\web\src\public-site\SmartLeadCapturePanel.tsx",
  "scripts\db\Run-N18Migration.ps1",
  "reports\n18\N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n18\public-website-route-house-front-door.json" "private route house / private route command house" "Manifest must lock route-house public identity."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "not be presented as a cheap application-help service" "Manifest must block cheap application-help positioning."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "Free Destiny Map is R0 with 0 managed applications" "Manifest must lock Free Destiny Map boundary."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "Exact institution/company/portal/programme/bursary/accommodation targets" "Manifest must seal exact route intelligence."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "CV Revamp is R49.99" "Manifest must lock CV Revamp pricing."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "Accommodation support is a privilege" "Manifest must define accommodation as a package privilege."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "managed-route slots" "Manifest must place accommodation within route allowance."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "not an official university" "Manifest must state not official portal."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "No guarantee of admission" "Manifest must block guarantees."
Require-Contains "manifests\n18\public-website-route-house-front-door.json" "document-aware" "Manifest must require smart document-aware public forms."

Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_pages" "Migration missing pages."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_sections" "Migration missing sections."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_package_cards" "Migration missing package cards."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_sector_cards" "Migration missing sector cards."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_leads" "Migration missing leads."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_destiny_map_requests" "Migration missing destiny map requests."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_content_guardrails" "Migration missing content guardrails."
Require-Contains "db\migrations\0016_n18_public_website.sql" "public_website_source_disclosures" "Migration missing source disclosures."
Require-Contains "db\migrations\0016_n18_public_website.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n18_public_website_seed.sql" "PUBLIC_IDENTITY_PRIVATE_ROUTE_COMMAND_HOUSE" "Seed must lock public identity."
Require-Contains "db\seeds\n18_public_website_seed.sql" "NOT_CHEAP_APPLICATION_HELP_SERVICE" "Seed must block cheap positioning."
Require-Contains "db\seeds\n18_public_website_seed.sql" "FREE_DESTINY_MAP_PRICE_ZAR" "Seed missing Destiny Map price."
Require-Contains "db\seeds\n18_public_website_seed.sql" "CV_REVAMP_PRICE_ZAR" "Seed missing CV price."
Require-Contains "db\seeds\n18_public_website_seed.sql" "ACCOMMODATION_SUPPORT_PRICE_ZAR" "Seed missing accommodation price."
Require-Contains "db\seeds\n18_public_website_seed.sql" "PAID_PACKAGES_INCLUDE_ACC01_ROUTES" "Seed missing paid ACC-01 route inclusion."
Require-Contains "db\seeds\n18_public_website_seed.sql" "NO_OFFICIAL_IMPERSONATION" "Seed missing official impersonation guardrail."
Require-Contains "db\seeds\n18_public_website_seed.sql" "SEALED_ROUTE_INTELLIGENCE" "Seed missing sealed route guardrail."
Require-Contains "db\seeds\n18_public_website_seed.sql" "EMAIL_FIRST" "Seed missing email-first disclosure."
Require-Contains "db\seeds\n18_public_website_seed.sql" "SMART_FORM" "Seed missing smart form disclosure."

Require-Contains "runtime\public-website\public-website-runtime.example.json" "private route command house" "Runtime must state route command house."
Require-Contains "runtime\public-website\public-website-runtime.example.json" "notCheapApplicationHelp" "Runtime must block cheap service positioning."
Require-Contains "runtime\public-website\public-website-runtime.example.json" "managedApplications" "Runtime must include managed application count."
Require-Contains "runtime\public-website\public-website-runtime.example.json" "requiresConsent" "Runtime must require consent."

Require-Contains "apps\api\src\public-website\route-house-copy.ts" "PRIVATE_ROUTE_COMMAND_HOUSE" "Route-house copy must validate command positioning."
Require-Contains "apps\api\src\public-website\package-boundaries.ts" "FREE_DESTINY_MAP" "Package boundary missing free Destiny Map."
Require-Contains "apps\api\src\public-website\package-boundaries.ts" "R49.99" "Package boundary missing CV price."
Require-Contains "apps\api\src\public-website\package-boundaries.ts" "ARTISAN_CHARTER" "Package boundary missing Artisan Charter."
Require-Contains "apps\api\src\public-website\package-boundaries.ts" "REGENCY_MANDATE" "Package boundary missing Regency Mandate."
Require-Contains "apps\api\src\public-website\sector-universe.ts" "PRIVATE_COLLEGE" "Sector universe missing private colleges."
Require-Contains "apps\api\src\public-website\sector-universe.ts" "exactTargetsRemainSealed" "Sector universe must seal targets."
Require-Contains "apps\api\src\public-website\destiny-map-preview.ts" "managedApplications: 0" "Destiny preview must have 0 managed applications."
Require-Contains "apps\api\src\public-website\destiny-map-preview.ts" "hiddenUntilActivation" "Destiny preview must hide sealed details."
Require-Contains "apps\api\src\public-website\lead-intake.ts" "POPIA_CONSENT_REQUIRED" "Lead intake must require POPIA consent."
Require-Contains "apps\api\src\public-website\lead-intake.ts" "smartFormDoesNotAskForAlreadyExtractedDetails" "Lead intake must include smart form marker."
Require-Contains "apps\api\src\public-website\content-guardrails.ts" "PUBLIC_COPY_BLOCKED_CLAIM" "Content guardrails must block claims."
Require-Contains "apps\api\src\public-website\content-guardrails.ts" "PUBLIC_COPY_SEALED_ROUTE_LEAK" "Content guardrails must block sealed leaks."
Require-Contains "apps\api\src\public-website\source-disclosures.ts" "NOT_OFFICIAL" "Disclosures must include not official."
Require-Contains "apps\api\src\index.ts" "./public-website" "API index missing public-website export."

Require-Contains "apps\web\src\public-site\PublicHomePage.tsx" "private route command house" "Public home must show route command house."
Require-Contains "apps\web\src\public-site\RouteHouseHero.tsx" "Not cheap application help" "Hero must block cheap positioning."
Require-Contains "apps\web\src\public-site\DestinyMapPreviewPanel.tsx" "0 managed applications" "Destiny UI must state zero managed applications."
Require-Contains "apps\web\src\public-site\PricingBoundaryPanel.tsx" "R49.99" "Pricing UI missing CV price."
Require-Contains "apps\web\src\public-site\PricingBoundaryPanel.tsx" "R469.99" "Pricing UI missing Regency Mandate."
Require-Contains "apps\web\src\public-site\SectorUniversePanel.tsx" "All sectors visible" "Sector UI must show all sectors visible."
Require-Contains "apps\web\src\public-site\TrustSafetyPanel.tsx" "not an official university" "Trust UI must state not official portal."
Require-Contains "apps\web\src\public-site\SmartLeadCapturePanel.tsx" "Do not type what your documents already say" "Smart intake UI must avoid repeated typing."

Require-Contains "reports\n18\N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md" "private route command house" "Report must state route command house."
Require-Contains "reports\n18\N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md" "Free Destiny Map is R0" "Report must state Free Destiny Map."
Require-Contains "reports\n18\N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md" "Next: N19" "Report must point to N19."

$Result = [ordered]@{
  phase = "N18"
  name = "Public Website / Route House Front Door"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n18" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n18\N18_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N18 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N18 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n18\N18_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0