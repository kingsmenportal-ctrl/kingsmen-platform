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
  "manifests\n09\notifications-communications-runtime.json",
  "db\migrations\0007_n09_notifications_communications.sql",
  "db\seeds\n09_communications_seed.sql",
  "apps\api\src\communications\communication-types.ts",
  "apps\api\src\communications\communication-policy.ts",
  "apps\api\src\communications\template-registry.ts",
  "apps\api\src\communications\outbound-outbox.ts",
  "apps\api\src\communications\inbound-intake.ts",
  "apps\api\src\communications\communication-throttle.ts",
  "apps\api\src\communications\urgent-escalation.ts",
  "apps\api\src\communications\portal-inbox.ts",
  "apps\api\src\communications\communications-read-model.ts",
  "apps\api\src\communications\index.ts",
  "apps\web\src\communications\CommunicationRuntimePanel.tsx",
  "apps\web\src\communications\CandidateInboxPanel.tsx",
  "apps\web\src\communications\UrgentEscalationPanel.tsx",
  "scripts\db\Run-N09Migration.ps1",
  "reports\n09\N09_NOTIFICATIONS_COMMUNICATIONS_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n09\notifications-communications-runtime.json" "Email is primary" "Manifest must lock email primary."
Require-Contains "manifests\n09\notifications-communications-runtime.json" "WhatsApp is urgent-only" "Manifest must lock WhatsApp urgent-only."
Require-Contains "manifests\n09\notifications-communications-runtime.json" "SMS is backup-only" "Manifest must lock SMS backup-only."
Require-Contains "manifests\n09\notifications-communications-runtime.json" "Every message must have evidence" "Manifest must require message evidence."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "notification_outbox" "Migration missing notification outbox."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "notification_delivery_attempts" "Migration missing delivery attempts."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "inbound_messages" "Migration missing inbound messages."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "candidate_portal_messages" "Migration missing portal messages."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "urgent_whatsapp_escalations" "Migration missing urgent WhatsApp escalations."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "communication_rate_limits" "Migration missing communication rate limits."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "message_evidence_ledger" "Migration missing message evidence ledger."
Require-Contains "db\migrations\0007_n09_notifications_communications.sql" "enable row level security" "Migration must enable RLS."
Require-Contains "db\seeds\n09_communications_seed.sql" "candidate.urgent.whatsapp" "Seed missing urgent WhatsApp template."
Require-Contains "db\seeds\n09_communications_seed.sql" "limit.whatsapp.daily" "Seed missing WhatsApp daily guard."
Require-Contains "apps\api\src\communications\communication-types.ts" "EMAIL_PRIMARY" "Types missing EMAIL_PRIMARY."
Require-Contains "apps\api\src\communications\communication-types.ts" "WHATSAPP_URGENT_ONLY" "Types missing WHATSAPP_URGENT_ONLY."
Require-Contains "apps\api\src\communications\communication-types.ts" "SMS_BACKUP_ONLY" "Types missing SMS_BACKUP_ONLY."
Require-Contains "apps\api\src\communications\communication-policy.ts" "No bulk WhatsApp reminders" "Policy must block bulk WhatsApp reminders."
Require-Contains "apps\api\src\communications\communication-policy.ts" "MESSAGE_EVIDENCE_LEDGER_REQUIRED" "Policy must require evidence."
Require-Contains "apps\api\src\communications\communication-policy.ts" "COMMUNICATION_NO_STATE_MUTATION" "Policy must block communication state mutation."
Require-Contains "apps\api\src\communications\outbound-outbox.ts" "HELD_FOR_APPROVAL" "Outbox must hold review-required messages."
Require-Contains "apps\api\src\communications\inbound-intake.ts" "PORTAL_ACCESS_BLOCKER" "Inbound must detect portal blockers."
Require-Contains "apps\api\src\communications\communication-throttle.ts" "COMMUNICATION_RATE_LIMIT_STOP" "Throttle must enforce stop boundary."
Require-Contains "apps\api\src\communications\urgent-escalation.ts" "WHATSAPP_URGENT_ONLY requires approvalRef" "Urgent escalation must require approval."
Require-Contains "apps\api\src\communications\portal-inbox.ts" "PORTAL_MESSAGE_EVIDENCE_REQUIRED" "Portal messages must require evidence."
Require-Contains "apps\api\src\communications\communications-read-model.ts" "Founder action required" "Read model must surface founder actions."
Require-Contains "apps\api\src\index.ts" "./communications" "API index missing Communications export."
Require-Contains "apps\web\src\communications\CommunicationRuntimePanel.tsx" "Email is primary" "Runtime panel must show email primary."
Require-Contains "apps\web\src\communications\UrgentEscalationPanel.tsx" "WhatsApp requires urgency" "Urgent panel must show WhatsApp approval boundary."
Require-Contains "reports\n09\N09_NOTIFICATIONS_COMMUNICATIONS_REPORT.md" "Email is primary" "Report must state email primary."

$Result = [ordered]@{
  phase = "N09"
  name = "Notifications / Communications Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n09" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n09\N09_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N09 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N09 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n09\N09_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0