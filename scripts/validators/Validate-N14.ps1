$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$Failures = New-Object System.Collections.Generic.List[string]
function Require-File([string]$Path) { if (!(Test-Path $Path)) { $Failures.Add("Missing file: $Path") } }
function Require-Contains([string]$Path,[string]$Needle,[string]$Message) { Require-File $Path; if (Test-Path $Path) { $Text = Get-Content $Path -Raw; if ($Text -notlike "*$Needle*") { $Failures.Add($Message) } } }

$Files = @(
  "manifests\n14\integrations-workflow-connectors.json",
  "db\migrations\0012_n14_integrations_workflow_connectors.sql",
  "db\seeds\n14_integrations_seed.sql",
  "runtime\integrations\integrations-runtime.example.json",
  "apps\api\src\integrations\integrations.ts",
  "apps\api\src\integrations\index.ts",
  "apps\web\src\integrations\IntegrationRuntimePanel.tsx",
  "apps\web\src\integrations\WorkflowConnectorPanel.tsx",
  "apps\web\src\integrations\DeadLetterQueuePanel.tsx",
  "apps\web\src\integrations\ConnectorHealthPanel.tsx",
  "scripts\db\Run-N14Migration.ps1",
  "reports\n14\N14_INTEGRATIONS_WORKFLOW_CONNECTORS_REPORT.md"
)
foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n14\integrations-workflow-connectors.json" "Backend remains the controller" "Manifest must lock backend control."
Require-Contains "manifests\n14\integrations-workflow-connectors.json" "n8n workflows are stateless thin workers" "Manifest must lock n8n thin worker doctrine."
Require-Contains "manifests\n14\integrations-workflow-connectors.json" "one Airtable mirror write and one backend result POST" "Manifest must lock write limits."
Require-Contains "manifests\n14\integrations-workflow-connectors.json" "Playwright is scout/probe only" "Manifest must lock Playwright boundary."
Require-Contains "manifests\n14\integrations-workflow-connectors.json" "No secret values may be committed" "Manifest must block secrets."

Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "integration_connectors" "Migration missing integration connectors."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "workflow_connector_registry" "Migration missing workflow connector registry."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "integration_outbox" "Migration missing integration outbox."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "integration_inbox" "Migration missing integration inbox."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "workflow_result_events" "Migration missing workflow result events."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "webhook_security_events" "Migration missing webhook security events."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "n8n_workflow_dispatches" "Migration missing n8n dispatches."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "airtable_mirror_events" "Migration missing Airtable mirror events."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "playwright_probe_events" "Migration missing Playwright probe events."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "integration_dead_letter_queue" "Migration missing integration DLQ."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "enable row level security" "Migration must enable RLS."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "max_airtable_writes <= 1" "Migration must enforce Airtable write limit."
Require-Contains "db\migrations\0012_n14_integrations_workflow_connectors.sql" "backend_result_post_count = 1" "Migration must enforce backend result post count."

Require-Contains "db\seeds\n14_integrations_seed.sql" "n8n_worker_gateway" "Seed missing n8n connector."
Require-Contains "db\seeds\n14_integrations_seed.sql" "playwright_probe_service" "Seed missing Playwright connector."
Require-Contains "db\seeds\n14_integrations_seed.sql" "W24 -> W17 -> worker -> /workflow/result" "Seed missing W24 route."
Require-Contains "runtime\integrations\integrations-runtime.example.json" "Never commit secret values" "Runtime example must block secrets."

Require-Contains "apps\api\src\integrations\integrations.ts" "SECRET_VALUE_COMMITTED_IN_CONNECTOR_CONFIG" "Integrations module must detect secret values."
Require-Contains "apps\api\src\integrations\integrations.ts" "WORKER_STANDARD_8_NODE_CONTRACT_REQUIRED" "Integrations module must enforce 8-node contract."
Require-Contains "apps\api\src\integrations\integrations.ts" "WORKER_MUST_POST_EXACTLY_ONE_BACKEND_RESULT" "Integrations module must enforce one backend result."
Require-Contains "apps\api\src\integrations\integrations.ts" "W24 -> W17" "Workflow registry must include W24 route."
Require-Contains "apps\api\src\integrations\integrations.ts" "POST /workflow/result" "n8n dispatcher must include result endpoint contract."
Require-Contains "apps\api\src\integrations\integrations.ts" "AIRTABLE_TO_POSTGRES_REQUIRES_OPERATOR_REVIEW" "Airtable bridge must block override."
Require-Contains "apps\api\src\integrations\integrations.ts" "MAP_REQUIRED" "Playwright bridge must route blocked portals to MAP."
Require-Contains "apps\api\src\integrations\integrations.ts" "PAYFAST_REFUND_DECISION_BLOCKED" "PayFast bridge must block refund decisions."
Require-Contains "apps\api\src\integrations\integrations.ts" "WHATSAPP_CONNECTOR_URGENT_ONLY" "Communication bridge must enforce urgent WhatsApp."
Require-Contains "apps\api\src\integrations\integrations.ts" "WEBHOOK_SIGNATURE_VERIFICATION_REQUIRED" "Webhook security must require verification."
Require-Contains "apps\api\src\integrations\integrations.ts" "INTEGRATION_DLQ_FIX_PATH_REQUIRED" "DLQ must require fix path."
Require-Contains "apps\api\src\index.ts" "./integrations" "API index missing integrations export."

Require-Contains "apps\web\src\integrations\IntegrationRuntimePanel.tsx" "Connector runtime without integration chaos" "Integration UI missing purpose."
Require-Contains "apps\web\src\integrations\WorkflowConnectorPanel.tsx" "eight-node contract" "Workflow UI missing eight-node contract."
Require-Contains "apps\web\src\integrations\DeadLetterQueuePanel.tsx" "cause, reason, fix path, evidence" "DLQ UI missing evidence discipline."
Require-Contains "apps\web\src\integrations\ConnectorHealthPanel.tsx" "Provider visibility" "Connector health UI missing visibility."
Require-Contains "reports\n14\N14_INTEGRATIONS_WORKFLOW_CONNECTORS_REPORT.md" "Backend remains the controller" "Report must state backend control."

$Result = [ordered]@{ phase = "N14"; name = "Integrations / Workflow Connector Runtime"; passed = ($Failures.Count -eq 0); checkedAt = (Get-Date).ToString("s"); failures = @($Failures) }
New-Item -ItemType Directory -Force -Path "reports\n14" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n14\N14_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N14 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N14 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n14\N14_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0