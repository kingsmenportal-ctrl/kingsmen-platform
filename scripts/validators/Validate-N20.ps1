$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Base)) { throw "Missing repo folder: $Base" }
Set-Location $Base

$Failures = New-Object System.Collections.Generic.List[string]

function Require-File {
  param([string]$Path)
  if (!(Test-Path (Join-Path $Base $Path))) {
    $Failures.Add("Missing required file: $Path")
  }
}

function Require-Contains {
  param([string]$Path,[string]$Needle,[string]$Message)
  $Full = Join-Path $Base $Path
  if (!(Test-Path $Full)) {
    $Failures.Add("Missing file for marker check: $Path")
    return
  }
  $Text = [System.IO.File]::ReadAllText($Full)
  if ($Text -notlike "*$Needle*") { $Failures.Add($Message) }
}

$Required = @(
  "manifests\n20\final-assembly-system-lock-production-readiness.json",
  "db\migrations\0018_n20_final_assembly_system_lock.sql",
  "db\seeds\n20_final_assembly_seed.sql",
  "runtime\release\kingsmen-production-readiness.example.json",
  "apps\api\src\final-assembly\final-assembly-types.ts",
  "apps\api\src\final-assembly\module-registry.ts",
  "apps\api\src\final-assembly\release-doctrine.ts",
  "apps\api\src\final-assembly\readiness-engine.ts",
  "apps\api\src\final-assembly\release-lock.ts",
  "apps\api\src\final-assembly\deployment-checklist.ts",
  "apps\api\src\final-assembly\runbook-registry.ts",
  "apps\api\src\final-assembly\system-map.ts",
  "apps\api\src\final-assembly\final-read-model.ts",
  "apps\api\src\final-assembly\index.ts",
  "apps\web\src\final-assembly\ProductionReadinessDashboard.tsx",
  "apps\web\src\final-assembly\SystemLockPanel.tsx",
  "apps\web\src\final-assembly\ModuleMapPanel.tsx",
  "apps\web\src\final-assembly\LaunchGatePanel.tsx",
  "apps\web\src\final-assembly\FounderLaunchBriefPanel.tsx",
  "scripts\db\Run-N20Migration.ps1",
  "scripts\validators\Validate-N20.ps1",
  "reports\n20\N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md"
)
$Required | ForEach-Object { Require-File $_ }

Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "POSTGRES_TRUTH" "Manifest must lock PostgreSQL truth."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "AIRTABLE_MIRROR_ONLY" "Manifest must lock Airtable mirror-only."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "N8N_STATELESS_THIN_WORKERS" "Manifest must lock n8n thin workers."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "EMAIL_PRIMARY" "Manifest must lock email primary."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "WHATSAPP_URGENT_ONLY" "Manifest must lock WhatsApp urgent-only."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "PAYFAST_PROVIDER_BOUNDARY" "Manifest must lock PayFast provider boundary."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "CAPS_LIMIT_VOLUME_NOT_SCOPE" "Manifest must lock cap doctrine."
Require-Contains "manifests\n20\final-assembly-system-lock-production-readiness.json" "FOUNDER_FINAL_AUTHORITY" "Manifest must lock founder authority."

Require-Contains "db\migrations\0018_n20_final_assembly_system_lock.sql" "release_module_registry" "Migration must create release module registry."
Require-Contains "db\migrations\0018_n20_final_assembly_system_lock.sql" "system_release_locks" "Migration must create system release locks."
Require-Contains "db\migrations\0018_n20_final_assembly_system_lock.sql" "production_readiness_checks" "Migration must create readiness checks."
Require-Contains "db\migrations\0018_n20_final_assembly_system_lock.sql" "launch_gate_decisions" "Migration must create launch gate decisions."
Require-Contains "db\migrations\0018_n20_final_assembly_system_lock.sql" "backup_restore_drills" "Migration must create backup restore drills."
Require-Contains "db\seeds\n20_final_assembly_seed.sql" "500 active operational candidates" "Seed must lock 500 active operational candidates."
Require-Contains "apps\api\src\final-assembly\release-doctrine.ts" "activeCandidateCap: 500" "Release doctrine must lock 500 cap."
Require-Contains "apps\api\src\final-assembly\release-doctrine.ts" "FOUNDER_FINAL_AUTHORITY" "Release doctrine must enforce founder final authority."
Require-Contains "apps\api\src\final-assembly\deployment-checklist.ts" "PayFast sandbox" "Deployment checklist must require PayFast sandbox."
Require-Contains "apps\api\src\final-assembly\deployment-checklist.ts" "backup and restore" "Deployment checklist must require backup restore."
Require-Contains "apps\web\src\final-assembly\ProductionReadinessDashboard.tsx" "does not pretend the platform is live" "UI must not fake live readiness."
Require-Contains "reports\n20\N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md" "Future work after N20" "Report must define post-N20 next work."

# Cross-series presence check for N01-N19 reports or validators where expected.
foreach ($N in 1..19) {
  $Phase = "N{0:D2}" -f $N
  $Validator = Join-Path $Base ("scripts\validators\Validate-" + $Phase + ".ps1")
  $ReportDir = Join-Path $Base ("reports\" + $Phase.ToLower())
  if (!(Test-Path $Validator) -and !(Test-Path $ReportDir)) {
    $Failures.Add("Missing cross-series validation evidence for $Phase")
  }
}

$Result = [ordered]@{
  phase = "N20"
  name = "Final Assembly / System Lock / Production Readiness"
  validated_at = (Get-Date).ToString("o")
  passed = ($Failures.Count -eq 0)
  failures = @($Failures)
  release = "Kingsmen Meta Ultra National - Oracle Lite Founder Release"
  active_candidate_cap = 500
  module_range = "N00-N20"
  laws = @(
    "POSTGRES_TRUTH",
    "AIRTABLE_MIRROR_ONLY",
    "BACKEND_CONTROLS_STATE",
    "N8N_STATELESS_THIN_WORKERS",
    "EMAIL_PRIMARY",
    "WHATSAPP_URGENT_ONLY",
    "SMS_BACKUP_ONLY",
    "PAYFAST_PROVIDER_BOUNDARY",
    "NO_FAKE_STATUS",
    "NO_FAKE_DEADLINES",
    "NO_FAKE_ACCEPTANCE_CLAIMS",
    "NO_FAKE_PAYMENT_SUCCESS",
    "NO_FAKE_REFUND_DECISION",
    "NO_FAKE_AI_GOVERNANCE",
    "MAP_FALLBACK_REQUIRED",
    "PHOENIX_FALLBACK_CONTROLLED",
    "CAPS_LIMIT_VOLUME_NOT_SCOPE",
    "ORACLE_LITE_DISCIPLINE",
    "POPIA_MINIMIZATION",
    "FOUNDER_FINAL_AUTHORITY"
  )
}

$ReportDir = Join-Path $Base "reports\n20"
if (!(Test-Path $ReportDir)) { New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null }
$Result | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $ReportDir "N20_VALIDATION_RESULT.json") -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N20 validation failed:" -ForegroundColor Red
  $Failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
  exit 1
}

Write-Host "N20 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n20\N20_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0