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
  "manifests\n16\orchestrator-execution-runtime.json",
  "db\migrations\0014_n16_orchestrator_execution.sql",
  "db\seeds\n16_orchestrator_execution_seed.sql",
  "runtime\orchestrator\orchestrator-runtime.example.json",
  "apps\api\src\orchestrator\orchestrator-runtime.ts",
  "apps\api\src\orchestrator\index.ts",
  "apps\web\src\orchestrator\OrchestratorRuntimePanel.tsx",
  "apps\web\src\orchestrator\WorkflowRegistryPanel.tsx",
  "apps\web\src\orchestrator\DispatchQueuePanel.tsx",
  "apps\web\src\orchestrator\ExecutionTracePanel.tsx",
  "apps\web\src\orchestrator\ManualHandoffPanel.tsx",
  "scripts\db\Run-N16Migration.ps1",
  "reports\n16\N16_ORCHESTRATOR_EXECUTION_RUNTIME_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n16\orchestrator-execution-runtime.json" "Backend orchestrator controls all application state transitions" "Manifest must lock backend state control."
Require-Contains "manifests\n16\orchestrator-execution-runtime.json" "n8n workers remain stateless thin workers" "Manifest must keep n8n thin."
Require-Contains "manifests\n16\orchestrator-execution-runtime.json" "W24 command routes through W17" "Manifest must lock W24 through W17."
Require-Contains "manifests\n16\orchestrator-execution-runtime.json" "Priority lanes change order and intensity, not user dignity" "Manifest must protect dignity/access."
Require-Contains "manifests\n16\orchestrator-execution-runtime.json" "Failed execution must produce reason, fix path" "Manifest must require failure reason and fix path."

Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_worker_registry" "Migration missing worker registry."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_execution_plans" "Migration missing execution plans."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_runs" "Migration missing runs."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_steps" "Migration missing steps."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_dispatch_queue" "Migration missing dispatch queue."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_idempotency_claims" "Migration missing idempotency claims."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_worker_results" "Migration missing worker results."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_manual_handoffs" "Migration missing manual handoffs."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_execution_events" "Migration missing execution events."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "orchestrator_capacity_lanes" "Migration missing capacity lanes."
Require-Contains "db\migrations\0014_n16_orchestrator_execution.sql" "enable row level security" "Migration must enable RLS."

$Seed = Get-Content "db\seeds\n16_orchestrator_execution_seed.sql" -Raw
$RequiredWorkers = @("W00","W01","W02","W03","W04","W05","W06","W07","W08","W09","W10","W11","W12","W13","W14","W15","W16","W17","W24")
foreach ($Worker in $RequiredWorkers) {
  if ($Seed -notlike "*'$Worker'*") { $Failures.Add("Seed missing worker $Worker") }
}

Require-Contains "db\seeds\n16_orchestrator_execution_seed.sql" "W24_ROUTES_THROUGH_W17" "Seed missing W24 through W17 config."
Require-Contains "db\seeds\n16_orchestrator_execution_seed.sql" "PLAYWRIGHT_SCOUT_ONLY" "Seed missing Playwright scout rule."
Require-Contains "db\seeds\n16_orchestrator_execution_seed.sql" "FOUNDER_OVERRIDE" "Seed missing founder override lane."

Require-Contains "runtime\orchestrator\orchestrator-runtime.example.json" "backendControlsState" "Runtime missing backend control flag."
Require-Contains "runtime\orchestrator\orchestrator-runtime.example.json" "n8nWorkersAreThin" "Runtime missing n8n thin flag."

Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "WORKER_REGISTRY" "API missing worker registry."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "SAME_STATE_WORKER_CANNOT_ADVANCE_STATE" "API must block same-state advancement."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "W24_MUST_ROUTE_THROUGH_W17" "API must enforce W24 through W17."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "ORCHESTRATOR_EVIDENCE_REQUIRED" "API must require evidence."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "MANUAL_HANDOFF_REQUIRED" "API must produce manual handoff when blocked."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "orchestratorCannotLetN8nGovernState" "API must explicitly prevent n8n governance."
Require-Contains "apps\api\src\orchestrator\orchestrator-runtime.ts" "playwrightCanOnlyScout" "API must keep Playwright scout-only."
Require-Contains "apps\api\src\index.ts" "./orchestrator" "API index missing orchestrator export."

Require-Contains "apps\web\src\orchestrator\OrchestratorRuntimePanel.tsx" "Execution Runtime" "UI missing execution runtime panel."
Require-Contains "apps\web\src\orchestrator\WorkflowRegistryPanel.tsx" "19 controlled workflows" "UI missing 19 workflow registry."
Require-Contains "apps\web\src\orchestrator\DispatchQueuePanel.tsx" "Priority lanes" "UI missing priority lane panel."
Require-Contains "apps\web\src\orchestrator\ExecutionTracePanel.tsx" "Reason, evidence, fix path" "UI missing execution trace."
Require-Contains "apps\web\src\orchestrator\ManualHandoffPanel.tsx" "MAP and Phoenix fallback" "UI missing MAP/Phoenix fallback."
Require-Contains "reports\n16\N16_ORCHESTRATOR_EXECUTION_RUNTIME_REPORT.md" "Backend controls state" "Report must state backend controls state."

$Result = [ordered]@{
  phase = "N16"
  name = "Orchestrator / Execution Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n16" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n16\N16_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N16 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N16 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n16\N16_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0