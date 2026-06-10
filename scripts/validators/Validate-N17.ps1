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
  "manifests\n17\founder-command-ops-runtime.json",
  "db\migrations\0015_n17_founder_command_ops.sql",
  "db\seeds\n17_founder_command_ops_seed.sql",
  "runtime\founder-ops\founder-command-runtime.example.json",
  "apps\api\src\founder-ops\founder-ops-types.ts",
  "apps\api\src\founder-ops\command-catalog.ts",
  "apps\api\src\founder-ops\founder-command-policy.ts",
  "apps\api\src\founder-ops\founder-command-router.ts",
  "apps\api\src\founder-ops\founder-brief-builder.ts",
  "apps\api\src\founder-ops\founder-mobile-cockpit.ts",
  "apps\api\src\founder-ops\founder-decision-log.ts",
  "apps\api\src\founder-ops\founder-read-model.ts",
  "apps\api\src\founder-ops\index.ts",
  "apps\web\src\founder-ops\FoundationCommandCenter.tsx",
  "apps\web\src\founder-ops\FoundationMobileCockpit.tsx",
  "apps\web\src\founder-ops\FoundationBriefPanel.tsx",
  "apps\web\src\founder-ops\FoundationEscalationsPanel.tsx",
  "apps\web\src\founder-ops\FoundationDecisionLogPanel.tsx",
  "scripts\db\Run-N17Migration.ps1",
  "reports\n17\N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n17\founder-command-ops-runtime.json" "Founder Control Plane is a command cockpit" "Manifest must lock founder cockpit law."
Require-Contains "manifests\n17\founder-command-ops-runtime.json" "N12 governance and N16 orchestrator" "Manifest must route commands through N12/N16."
Require-Contains "manifests\n17\founder-command-ops-runtime.json" "may not bypass the state machine" "Manifest must block state bypass."
Require-Contains "manifests\n17\founder-command-ops-runtime.json" "Phone-friendly founder cockpit" "Manifest must require phone cockpit."
Require-Contains "manifests\n17\founder-command-ops-runtime.json" "Daily briefs must include system health, queue, finance, documents, matching, Playwright/MAP, incidents, cap, and urgent candidates" "Manifest must require complete daily briefs."
Require-Contains "manifests\n17\founder-command-ops-runtime.json" "No silent override" "Manifest must block silent override."

Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_operator_profiles" "Migration missing founder operator profiles."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_command_catalog" "Migration missing command catalog."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_command_requests" "Migration missing command requests."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_command_results" "Migration missing command results."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_daily_briefs" "Migration missing daily briefs."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_watchlist_items" "Migration missing watchlist."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_escalation_threads" "Migration missing escalation threads."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_decision_log" "Migration missing decision log."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_mobile_cards" "Migration missing mobile cards."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "founder_ops_audit_events" "Migration missing audit events."
Require-Contains "db\migrations\0015_n17_founder_command_ops.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "FOUNDER_COMMANDS_ROUTE_THROUGH_N12_AND_N16" "Seed must lock N12/N16 routing."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "NO_DIRECT_STATE_MACHINE_BYPASS" "Seed must block state bypass."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "NO_DIRECT_OFFICIAL_SUBMISSION_FROM_FOUNDER_PANEL" "Seed must block direct official submission."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "NO_DIRECT_REFUND_OR_FRAUD_FINALITY_FROM_FOUNDER_PANEL" "Seed must block direct refund/fraud finality."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "CANDIDATE_COMMS_EMAIL_FIRST_WHATSAPP_URGENT_ONLY" "Seed must preserve comms doctrine."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "CAPACITY_CHECK" "Seed missing capacity command."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "REQUEST_PHOENIX_FALLBACK" "Seed missing Phoenix command."
Require-Contains "db\seeds\n17_founder_command_ops_seed.sql" "REQUEST_MAP_HANDOFF" "Seed missing MAP command."

Require-Contains "runtime\founder-ops\founder-command-runtime.example.json" "notSecondBackend" "Runtime must mark founder control not second backend."
Require-Contains "runtime\founder-ops\founder-command-runtime.example.json" "commandsRouteThrough" "Runtime missing command route doctrine."

Require-Contains "apps\api\src\founder-ops\command-catalog.ts" "FOUNDER_COMMAND_CATALOG" "API missing founder command catalog."
Require-Contains "apps\api\src\founder-ops\founder-command-policy.ts" "FOUNDER_COMMAND_DIRECT_FINALITY_BLOCKED" "Policy must block direct finality."
Require-Contains "apps\api\src\founder-ops\founder-command-policy.ts" "FOUNDER_COMMAND_EVIDENCE_REQUIRED" "Policy must require evidence."
Require-Contains "apps\api\src\founder-ops\founder-command-policy.ts" "N12_GOVERNANCE_APPROVAL_REQUIRED" "Policy must require governance approval."
Require-Contains "apps\api\src\founder-ops\founder-command-router.ts" "W24" "Router must include W24 route envelope."
Require-Contains "apps\api\src\founder-ops\founder-command-router.ts" "W17" "Router must include W17 route envelope."
Require-Contains "apps\api\src\founder-ops\founder-brief-builder.ts" "system health" "Brief builder must include system health."
Require-Contains "apps\api\src\founder-ops\founder-brief-builder.ts" "Playwright/MAP" "Brief builder must include Playwright/MAP."
Require-Contains "apps\api\src\founder-ops\founder-mobile-cockpit.ts" "phoneCockpitShowsCauseReasonRiskNextActionFixPath" "Mobile cockpit must show cause/risk/action/fix path marker."
Require-Contains "apps\api\src\founder-ops\founder-decision-log.ts" "noSilentFounderOverride" "Decision log must block silent override."
Require-Contains "apps\api\src\index.ts" "./founder-ops" "API index missing founder-ops export."

Require-Contains "apps\web\src\founder-ops\FoundationCommandCenter.tsx" "not a second backend" "UI must state not second backend."
Require-Contains "apps\web\src\founder-ops\FoundationMobileCockpit.tsx" "cause, reason, risk, next action, and fix path" "UI must show mobile action details."
Require-Contains "apps\web\src\founder-ops\FoundationBriefPanel.tsx" "Morning, midday, evening, incident" "UI must include brief cadence."
Require-Contains "apps\web\src\founder-ops\FoundationEscalationsPanel.tsx" "Cause, risk, fix path" "UI must include escalation details."
Require-Contains "apps\web\src\founder-ops\FoundationDecisionLogPanel.tsx" "No silent override" "UI must include no silent override."

Require-Contains "reports\n17\N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md" "Founder Control Plane is not a second backend" "Report must state no second backend."
Require-Contains "reports\n17\N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md" "N12 governance" "Report must mention N12 governance."
Require-Contains "reports\n17\N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md" "N16 orchestrator" "Report must mention N16 orchestrator."

$Result = [ordered]@{
  phase = "N17"
  name = "Founder Control Plane / Command Ops Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n17" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n17\N17_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N17 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N17 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n17\N17_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0