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
  "manifests\n08\control-plane-foundation.json",
  "db\migrations\0006_n08_control_plane.sql",
  "db\seeds\n08_control_plane_seed.sql",
  "apps\api\src\control-plane\control-plane.ts",
  "apps\api\src\control-plane\index.ts",
  "apps\web\src\control-plane\ControlPlaneShell.tsx",
  "apps\web\src\control-plane\CommandCenterPanel.tsx",
  "apps\web\src\control-plane\ApprovalQueuePanel.tsx",
  "apps\web\src\control-plane\CapacityGuardPanel.tsx",
  "apps\web\src\control-plane\KillSwitchPanel.tsx",
  "scripts\db\Run-N08Migration.ps1",
  "reports\n08\N08_CONTROL_PLANE_FOUNDATION_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n08\control-plane-foundation.json" "Control Plane is not Data Plane" "Manifest must lock control/data plane split."
Require-Contains "manifests\n08\control-plane-foundation.json" "No direct candidate state mutation from UI" "Manifest must block direct UI state mutation."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "control_plane_command_catalog" "Migration missing command catalog."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "control_plane_approval_queue" "Migration missing approval queue."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "control_plane_kill_switches" "Migration missing kill switches."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "control_plane_capacity_limits" "Migration missing capacity limits."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "control_plane_operator_audit" "Migration missing operator audit."
Require-Contains "db\migrations\0006_n08_control_plane.sql" "enable row level security" "Migration must enable RLS."
Require-Contains "db\seeds\n08_control_plane_seed.sql" "founder-primary" "Seed missing founder operator."
Require-Contains "db\seeds\n08_control_plane_seed.sql" "active_candidates" "Seed missing active candidate cap."
Require-Contains "db\seeds\n08_control_plane_seed.sql" "whatsapp_urgent_daily" "Seed missing WhatsApp urgent-only guard."
Require-Contains "apps\api\src\control-plane\control-plane.ts" "Dangerous command requires dangerous-action permission" "Policy must block dangerous actions."
Require-Contains "apps\api\src\control-plane\control-plane.ts" "Only commands in APPROVAL_REQUIRED" "Approval engine must enforce approval state."
Require-Contains "apps\api\src\control-plane\control-plane.ts" "global.stop_all_execution" "Kill switch module must include global stop boundary."
Require-Contains "apps\api\src\control-plane\control-plane.ts" "Capacity limit" "Capacity guard must block STOP dispatch."
Require-Contains "apps\api\src\control-plane\control-plane.ts" "buildFounderActionsRequired" "Read model must surface founder actions."
Require-Contains "apps\api\src\index.ts" "./control-plane" "API index missing Control Plane export."
Require-Contains "apps\web\src\control-plane\ControlPlaneShell.tsx" "never mutates candidate state directly" "Shell must state no direct candidate mutation."
Require-Contains "apps\web\src\control-plane\CommandCenterPanel.tsx" "backend command bus" "Command UI must reference backend command bus."
Require-Contains "apps\web\src\control-plane\ApprovalQueuePanel.tsx" "Human Boundary" "Approval UI must show human boundary."
Require-Contains "apps\web\src\control-plane\CapacityGuardPanel.tsx" "Caps limit volume" "Capacity UI must lock cap doctrine."
Require-Contains "apps\web\src\control-plane\KillSwitchPanel.tsx" "audit trail" "Kill switch UI must require audit trail."
Require-Contains "reports\n08\N08_CONTROL_PLANE_FOUNDATION_REPORT.md" "Control Plane is not the Data Plane" "Report must state control/data plane split."

$Result = [ordered]@{
  phase = "N08"
  name = "Control Plane Foundation"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n08" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n08\N08_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N08 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N08 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n08\N08_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0