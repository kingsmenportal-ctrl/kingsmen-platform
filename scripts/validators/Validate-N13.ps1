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
  "manifests\n13\observability-reports-incident-runtime.json",
  "db\migrations\0011_n13_observability_reports_incidents.sql",
  "db\seeds\n13_observability_seed.sql",
  "runtime\observability\observability-runtime.example.json",
  "apps\api\src\observability\observability-types.ts",
  "apps\api\src\observability\health-status.ts",
  "apps\api\src\observability\incident-runtime.ts",
  "apps\api\src\observability\founder-report-builder.ts",
  "apps\api\src\observability\capacity-monitor.ts",
  "apps\api\src\observability\workflow-observer.ts",
  "apps\api\src\observability\alert-router.ts",
  "apps\api\src\observability\report-delivery.ts",
  "apps\api\src\observability\observability-read-model.ts",
  "apps\api\src\observability\index.ts",
  "apps\web\src\observability\ObservabilityDashboard.tsx",
  "apps\web\src\observability\IncidentPanel.tsx",
  "apps\web\src\observability\FoundationReportPanel.tsx",
  "apps\web\src\observability\CapacityWatchPanel.tsx",
  "scripts\db\Run-N13Migration.ps1",
  "reports\n13\N13_OBSERVABILITY_REPORTS_INCIDENTS_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n13\observability-reports-incident-runtime.json" "cause, reason, fix path" "Manifest must lock incident explanation discipline."
Require-Contains "manifests\n13\observability-reports-incident-runtime.json" "Email remains primary" "Manifest must lock email-first reporting."
Require-Contains "manifests\n13\observability-reports-incident-runtime.json" "WhatsApp is urgent-only" "Manifest must lock urgent WhatsApp boundary."
Require-Contains "manifests\n13\observability-reports-incident-runtime.json" "No false green health status" "Manifest must block false green."

Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "system_health_snapshots" "Migration missing system health snapshots."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "service_health_checks" "Migration missing service health checks."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "metric_samples" "Migration missing metric samples."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "incident_events" "Migration missing incident events."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "incident_timeline_entries" "Migration missing incident timeline."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "incident_actions" "Migration missing incident actions."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "founder_reports" "Migration missing founder reports."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "candidate_pipeline_snapshots" "Migration missing candidate pipeline snapshots."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "workflow_run_observations" "Migration missing workflow observations."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "oracle_lite_capacity_snapshots" "Migration missing Oracle Lite capacity snapshots."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "system_alerts" "Migration missing system alerts."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "report_delivery_log" "Migration missing report delivery log."
Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "enable row level security" "Migration must enable RLS."

Require-Contains "db\seeds\n13_observability_seed.sql" "FOUNDER_REPORTS_ENABLED" "Seed missing founder reports config."
Require-Contains "db\seeds\n13_observability_seed.sql" "WHATSAPP_URGENT_ONLY_INCIDENTS" "Seed missing urgent WhatsApp boundary."
Require-Contains "db\seeds\n13_observability_seed.sql" "NO_FALSE_GREEN_HEALTH" "Seed missing no false green rule."
Require-Contains "runtime\observability\observability-runtime.example.json" "No secrets are committed" "Runtime must block committed secrets."

Require-Contains "apps\api\src\observability\health-status.ts" "NO_FALSE_GREEN_HEALTH_STATUS" "Health runtime must block false green."
Require-Contains "apps\api\src\observability\incident-runtime.ts" "INCIDENT_CAUSE_REQUIRED" "Incident runtime must require cause."
Require-Contains "apps\api\src\observability\incident-runtime.ts" "INCIDENT_FIX_PATH_REQUIRED" "Incident runtime must require fix path."
Require-Contains "apps\api\src\observability\incident-runtime.ts" "INCIDENT_EVIDENCE_REQUIRED" "Incident runtime must require evidence."
Require-Contains "apps\api\src\observability\founder-report-builder.ts" "redactCandidateSensitiveDetails" "Founder reports must redact sensitive details."
Require-Contains "apps\api\src\observability\capacity-monitor.ts" "ACTIVE_CANDIDATE_CAP_EXCEEDED" "Capacity monitor must enforce active candidate cap."
Require-Contains "apps\api\src\observability\workflow-observer.ts" "manual fallback" "Workflow observer must point failures to fallback/review."
Require-Contains "apps\api\src\observability\alert-router.ts" "WHATSAPP_URGENT_ONLY_BOUNDARY" "Alert router must enforce urgent WhatsApp boundary."
Require-Contains "apps\api\src\observability\report-delivery.ts" "REPORT_DELIVERY_EVIDENCE_REQUIRED" "Report delivery must require evidence."
Require-Contains "apps\api\src\index.ts" "./observability" "API index missing observability export."

Require-Contains "apps\web\src\observability\ObservabilityDashboard.tsx" "Founder-grade visibility" "Observability UI missing founder-grade purpose."
Require-Contains "apps\web\src\observability\IncidentPanel.tsx" "Cause, reason, fix path" "Incident UI missing cause/reason/fix path."
Require-Contains "apps\web\src\observability\FoundationReportPanel.tsx" "Morning, midday, evening" "Founder report UI missing daily cadence."
Require-Contains "apps\web\src\observability\CapacityWatchPanel.tsx" "Cap limits volume" "Capacity UI missing cap doctrine."
Require-Contains "reports\n13\N13_OBSERVABILITY_REPORTS_INCIDENTS_REPORT.md" "No false green" "Report must state no false green."

$Result = [ordered]@{
  phase = "N13"
  name = "Observability / Reports / Incident Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n13" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n13\N13_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N13 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N13 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n13\N13_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0