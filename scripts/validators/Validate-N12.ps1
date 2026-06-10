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
  "manifests\n12\governance-policy-runtime.json",
  "db\migrations\0010_n12_governance_policy.sql",
  "db\seeds\n12_governance_policy_seed.sql",
  "runtime\governance\governance-runtime.example.json",
  "apps\api\src\governance\governance-types.ts",
  "apps\api\src\governance\policy-registry.ts",
  "apps\api\src\governance\policy-gate-engine.ts",
  "apps\api\src\governance\state-machine-governance.ts",
  "apps\api\src\governance\ai-governance-guard.ts",
  "apps\api\src\governance\submission-policy.ts",
  "apps\api\src\governance\finance-refund-policy.ts",
  "apps\api\src\governance\privacy-popia-policy.ts",
  "apps\api\src\governance\source-confidence-governance.ts",
  "apps\api\src\governance\human-override-policy.ts",
  "apps\api\src\governance\growth-cap-governance.ts",
  "apps\api\src\governance\governance-audit.ts",
  "apps\api\src\governance\governance-read-model.ts",
  "apps\api\src\governance\index.ts",
  "apps\web\src\governance\GovernanceRuntimePanel.tsx",
  "apps\web\src\governance\PolicyGatePanel.tsx",
  "apps\web\src\governance\OverrideQueuePanel.tsx",
  "apps\web\src\governance\GrowthCapPanel.tsx",
  "scripts\db\Run-N12Migration.ps1",
  "reports\n12\N12_GOVERNANCE_POLICY_RUNTIME_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n12\governance-policy-runtime.json" "Backend state machine controls flow" "Manifest must lock backend state-machine authority."
Require-Contains "manifests\n12\governance-policy-runtime.json" "AI may suggest but must not govern money" "Manifest must lock AI hard boundary."
Require-Contains "manifests\n12\governance-policy-runtime.json" "No silent override" "Manifest must lock no silent override."
Require-Contains "manifests\n12\governance-policy-runtime.json" "No growth cap increase without outcome-quality evidence" "Manifest must lock growth-cap quality gate."
Require-Contains "manifests\n12\governance-policy-runtime.json" "Source confidence" "Manifest must include source confidence."

Require-Contains "db\migrations\0010_n12_governance_policy.sql" "governance_policies" "Migration missing governance policies."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "policy_gate_evaluations" "Migration missing policy gate evaluations."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "governance_decisions" "Migration missing governance decisions."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "human_override_requests" "Migration missing human override requests."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "privacy_consent_records" "Migration missing privacy consent records."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "source_confidence_reviews" "Migration missing source confidence reviews."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "growth_cap_reviews" "Migration missing growth cap reviews."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "governance_audit_events" "Migration missing governance audit events."
Require-Contains "db\migrations\0010_n12_governance_policy.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n12_governance_policy_seed.sql" "AI_HARD_BOUNDARY" "Seed missing AI hard boundary."
Require-Contains "db\seeds\n12_governance_policy_seed.sql" "POPIA_PRIVACY_BOUNDARY" "Seed missing POPIA boundary."
Require-Contains "db\seeds\n12_governance_policy_seed.sql" "GROWTH_CAP_DISCIPLINE" "Seed missing growth cap discipline."
Require-Contains "runtime\governance\governance-runtime.example.json" "No secrets are committed" "Runtime must block committed secrets."

Require-Contains "apps\api\src\governance\policy-gate-engine.ts" "POLICY_GATE_BLOCKED" "Policy gate engine must block hard failures."
Require-Contains "apps\api\src\governance\state-machine-governance.ts" "Backend state machine controls flow" "State machine governance must state backend authority."
Require-Contains "apps\api\src\governance\ai-governance-guard.ts" "AI_GOVERNANCE_BLOCKED" "AI governance guard must block AI hard decisions."
Require-Contains "apps\api\src\governance\submission-policy.ts" "Official submission" "Submission policy must govern official submission."
Require-Contains "apps\api\src\governance\finance-refund-policy.ts" "Refund" "Finance policy must govern refunds."
Require-Contains "apps\api\src\governance\privacy-popia-policy.ts" "POPIA" "Privacy policy must enforce POPIA."
Require-Contains "apps\api\src\governance\source-confidence-governance.ts" "OFFICIAL_VERIFIED" "Source confidence governance must require official verification."
Require-Contains "apps\api\src\governance\human-override-policy.ts" "NO_SILENT_OVERRIDE" "Human override policy must block silent override."
Require-Contains "apps\api\src\governance\growth-cap-governance.ts" "NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE" "Growth cap governance must require outcome-quality evidence."
Require-Contains "apps\api\src\governance\governance-audit.ts" "GOVERNANCE_AUDIT_EVIDENCE_REQUIRED" "Governance audit must require evidence."
Require-Contains "apps\api\src\index.ts" "./governance" "API index missing governance export."

Require-Contains "apps\web\src\governance\GovernanceRuntimePanel.tsx" "Policy gates before dangerous actions" "Governance UI must show policy gate purpose."
Require-Contains "apps\web\src\governance\OverrideQueuePanel.tsx" "No silent override" "Override UI must show no silent override."
Require-Contains "apps\web\src\governance\GrowthCapPanel.tsx" "500 active candidates" "Growth cap UI must show starting cap discipline."
Require-Contains "reports\n12\N12_GOVERNANCE_POLICY_RUNTIME_REPORT.md" "AI may suggest" "Report must state AI hard boundary."

$Result = [ordered]@{
  phase = "N12"
  name = "Governance / Policy Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n12" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n12\N12_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N12 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N12 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n12\N12_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0