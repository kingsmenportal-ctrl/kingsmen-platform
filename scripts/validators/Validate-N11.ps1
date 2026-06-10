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
  "manifests\n11\ai-decision-matching-engine.json",
  "db\migrations\0009_n11_ai_decision_matching.sql",
  "db\seeds\n11_ai_decision_seed.sql",
  "runtime\ai\ai-decision-runtime.example.json",
  "apps\api\src\ai-decision\ai-decision-types.ts",
  "apps\api\src\ai-decision\ai-boundary-policy.ts",
  "apps\api\src\ai-decision\candidate-signal-builder.ts",
  "apps\api\src\ai-decision\eligibility-screen.ts",
  "apps\api\src\ai-decision\route-matching.ts",
  "apps\api\src\ai-decision\placement-scoring.ts",
  "apps\api\src\ai-decision\recommendation-explainer.ts",
  "apps\api\src\ai-decision\destiny-map.ts",
  "apps\api\src\ai-decision\phoenix-fallback-planner.ts",
  "apps\api\src\ai-decision\learning-signals.ts",
  "apps\api\src\ai-decision\ai-budget-guard.ts",
  "apps\api\src\ai-decision\ai-decision-repository.ts",
  "apps\api\src\ai-decision\index.ts",
  "apps\web\src\ai-decision\AiDecisionPanel.tsx",
  "apps\web\src\ai-decision\DestinyMapPanel.tsx",
  "apps\web\src\ai-decision\MatchingWorkbenchPanel.tsx",
  "apps\web\src\ai-decision\PhoenixFallbackPanel.tsx",
  "scripts\db\Run-N11Migration.ps1",
  "reports\n11\N11_AI_DECISION_MATCHING_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n11\ai-decision-matching-engine.json" "AI may suggest but must not govern money" "Manifest must include AI hard-boundary doctrine."
Require-Contains "manifests\n11\ai-decision-matching-engine.json" "No fake guarantees" "Manifest must block fake guarantees."
Require-Contains "manifests\n11\ai-decision-matching-engine.json" "No silent learning" "Manifest must block silent learning."
Require-Contains "manifests\n11\ai-decision-matching-engine.json" "No uncontrolled reinforcement learning" "Manifest must block uncontrolled RL."
Require-Contains "manifests\n11\ai-decision-matching-engine.json" "No Phoenix false rescue" "Manifest must block Phoenix false rescue."

Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "candidate_decision_signals" "Migration missing candidate decision signals."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "eligibility_screen_results" "Migration missing eligibility screen results."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "route_match_candidates" "Migration missing route match candidates."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "placement_scores" "Migration missing placement scores."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "route_recommendations" "Migration missing route recommendations."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "destiny_maps" "Migration missing destiny maps."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "phoenix_fallback_plans" "Migration missing Phoenix fallback plans."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "ai_learning_signals" "Migration missing AI learning signals."
Require-Contains "db\migrations\0009_n11_ai_decision_matching.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n11_ai_decision_seed.sql" "AI_BLOCKED_DECISIONS" "Seed missing blocked decisions config."
Require-Contains "db\seeds\n11_ai_decision_seed.sql" "official_status" "Seed must block official status governance."
Require-Contains "runtime\ai\ai-decision-runtime.example.json" "recommendation_only" "Runtime must be recommendation-only."
Require-Contains "runtime\ai\ai-decision-runtime.example.json" "No model provider secrets are committed" "Runtime must block secrets."

Require-Contains "apps\api\src\ai-decision\ai-boundary-policy.ts" "AI_ACTION_BLOCKED" "AI boundary policy must block hard actions."
Require-Contains "apps\api\src\ai-decision\ai-boundary-policy.ts" "aiCanSubmitOfficialApplication" "AI boundary must block official submission."
Require-Contains "apps\api\src\ai-decision\ai-boundary-policy.ts" "aiCanApproveRefund" "AI boundary must block refund approval."
Require-Contains "apps\api\src\ai-decision\candidate-signal-builder.ts" "Candidate decision signals require evidenceRefs" "Signal builder must require evidence."
Require-Contains "apps\api\src\ai-decision\eligibility-screen.ts" "Portal requires CAPTCHA" "Eligibility screen must handle CAPTCHA/MAP boundary."
Require-Contains "apps\api\src\ai-decision\route-matching.ts" "sourceConfidence" "Route matching must include source confidence."
Require-Contains "apps\api\src\ai-decision\placement-scoring.ts" "sourceConfidenceScore" "Placement scoring must include source confidence."
Require-Contains "apps\api\src\ai-decision\recommendation-explainer.ts" "Exact targets and direct application links are sealed" "Recommendation explainer must enforce sealed route details."
Require-Contains "apps\api\src\ai-decision\destiny-map.ts" "FREE_DESTINY_MAP_MUST_SEAL_EXACT_TARGETS" "Destiny Map must seal free exact targets."
Require-Contains "apps\api\src\ai-decision\phoenix-fallback-planner.ts" "NO_PHOENIX_FALSE_RESCUE" "Phoenix planner must block false rescue."
Require-Contains "apps\api\src\ai-decision\learning-signals.ts" "noSilentLearning" "Learning signals must include no silent learning."
Require-Contains "apps\api\src\ai-decision\learning-signals.ts" "noUncontrolledRl" "Learning signals must include no uncontrolled RL."
Require-Contains "apps\api\src\ai-decision\ai-budget-guard.ts" "Oracle Lite AI budget guard" "AI budget guard must mention Oracle Lite."
Require-Contains "apps\api\src\index.ts" "./ai-decision" "API index missing AI Decision export."

Require-Contains "apps\web\src\ai-decision\AiDecisionPanel.tsx" "AI recommends only" "AI decision UI must show recommendation-only boundary."
Require-Contains "apps\web\src\ai-decision\DestinyMapPanel.tsx" "sealed until package activation" "Destiny UI must show sealed exact targets."
Require-Contains "apps\web\src\ai-decision\PhoenixFallbackPanel.tsx" "No false rescue" "Phoenix UI must show no false rescue."
Require-Contains "reports\n11\N11_AI_DECISION_MATCHING_REPORT.md" "AI recommends and explains" "Report must state AI recommendation boundary."

$Result = [ordered]@{
  phase = "N11"
  name = "AI Decision / Matching Engine"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n11" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n11\N11_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N11 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N11 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n11\N11_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0