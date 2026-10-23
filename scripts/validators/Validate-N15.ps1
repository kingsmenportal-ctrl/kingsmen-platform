$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
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
  "manifests\n15\opportunity-engine-source-intelligence.json",
  "db\migrations\0013_n15_opportunity_engine.sql",
  "db\seeds\n15_opportunity_engine_seed.sql",
  "runtime\opportunity\opportunity-runtime.example.json",
  "apps\api\src\opportunity\opportunity-engine.ts",
  "apps\api\src\opportunity\index.ts",
  "apps\web\src\opportunity\OpportunityEnginePanel.tsx",
  "apps\web\src\opportunity\SourceReviewPanel.tsx",
  "apps\web\src\opportunity\OpportunityAlertsPanel.tsx",
  "scripts\db\Run-N15Migration.ps1",
  "reports\n15\N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake deadlines" "Manifest must block fake deadlines."
Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake links" "Manifest must block fake links."
Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake programme availability" "Manifest must block fake availability."
Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "Private colleges require CHE" "Manifest must require private college verification."

Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_source_authorities" "Migration missing source authorities."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "external_source_observations" "Migration missing source observations."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_providers" "Migration missing providers."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_programmes" "Migration missing programmes."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_deadlines" "Migration missing deadlines."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_eligibility_rules" "Migration missing eligibility rules."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_fee_records" "Migration missing fee records."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_signal_queue" "Migration missing signal queue."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_verification_reviews" "Migration missing verification reviews."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "candidate_opportunity_matches" "Migration missing candidate opportunity matches."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "opportunity_alerts" "Migration missing alerts."
Require-Contains "db\migrations\0013_n15_opportunity_engine.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n15_opportunity_engine_seed.sql" "AUTH_DHET" "Seed missing DHET authority."
Require-Contains "db\seeds\n15_opportunity_engine_seed.sql" "AUTH_NSFAS" "Seed missing NSFAS authority."
Require-Contains "db\seeds\n15_opportunity_engine_seed.sql" "AUTH_CAO" "Seed missing CAO authority."
Require-Contains "db\seeds\n15_opportunity_engine_seed.sql" "AUTH_SAQA" "Seed missing SAQA authority."
Require-Contains "db\seeds\n15_opportunity_engine_seed.sql" "AUTH_QCTO" "Seed missing QCTO authority."
Require-Contains "runtime\opportunity\opportunity-runtime.example.json" "noFakeDeadlines" "Runtime missing no fake deadline rule."

Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "NO_FAKE_DEADLINES" "Opportunity engine must block fake deadlines."
Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "NO_FAKE_LINKS_SOURCE_URL_REQUIRED" "Opportunity engine must require source URL."
Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "OPPORTUNITY_EVIDENCE_REQUIRED" "Opportunity engine must require evidence."
Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "OFFICIAL_CLAIM_REQUIRES_OFFICIAL_VERIFIED_SOURCE" "Opportunity engine must require official confidence."
Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "PRIVATE_COLLEGE" "Opportunity engine must include private college boundary."
Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "opportunityEngineCannotSubmitOfficialApplication" "Opportunity engine must not submit official applications."
Require-Contains "apps\api\src\index.ts" "./opportunity" "API index missing opportunity export."

Require-Contains "apps\web\src\opportunity\OpportunityEnginePanel.tsx" "Verified external source intelligence" "Opportunity UI missing source intelligence purpose."
Require-Contains "apps\web\src\opportunity\SourceReviewPanel.tsx" "Review before candidate-facing use" "Source review UI missing review boundary."
Require-Contains "apps\web\src\opportunity\OpportunityAlertsPanel.tsx" "Openings, deadlines, stale sources, risk" "Alerts UI missing core alert types."
Require-Contains "reports\n15\N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md" "No fake deadlines" "Report must state no fake deadlines."

Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "current_verified_route_opportunities" "Current verified opportunity feed migration is missing."
Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "availability_status = 'OPEN'" "Feed must exclude non-open programmes."
Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "interval '90 days'" "Feed must enforce source freshness."
Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "v.public_safe = true" "Feed must require public-safe provider."
Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "Africa/Johannesburg" "Feed must evaluate deadlines in South African time."
Require-Contains "db\migrations\0092_n15_current_verified_opportunity_feed.sql" "revoke all on public.current_verified_route_opportunities from public, anon, authenticated" "Feed must not be directly readable by public client roles."
Require-Contains "reports\n15\N15_CURRENT_VERIFIED_OPPORTUNITY_FEED_2026-10-23.md" "anon SELECT=false" "Report must capture verified client-role denial."

$Result = [ordered]@{
  phase = "N15"
  name = "Opportunity Engine / External Source Intelligence"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n15" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n15\N15_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N15 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N15 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n15\N15_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0