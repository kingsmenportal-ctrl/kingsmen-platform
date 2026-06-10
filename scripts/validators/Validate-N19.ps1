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
  "manifests\n19\candidate-mobile-public-portal.json",
  "db\migrations\0017_n19_candidate_mobile_public_portal.sql",
  "db\seeds\n19_candidate_mobile_seed.sql",
  "runtime\candidate-mobile\candidate-mobile-runtime.example.json",
  "apps\api\src\candidate-mobile\candidate-mobile-types.ts",
  "apps\api\src\candidate-mobile\mobile-policy.ts",
  "apps\api\src\candidate-mobile\public-to-portal-handoff.ts",
  "apps\api\src\candidate-mobile\mobile-smart-intake.ts",
  "apps\api\src\candidate-mobile\device-trust.ts",
  "apps\api\src\candidate-mobile\mobile-status-cards.ts",
  "apps\api\src\candidate-mobile\mobile-notification-preferences.ts",
  "apps\api\src\candidate-mobile\mobile-read-model.ts",
  "apps\api\src\candidate-mobile\index.ts",
  "apps\web\src\candidate-mobile\CandidateMobileShell.tsx",
  "apps\web\src\candidate-mobile\MobileHomePanel.tsx",
  "apps\web\src\candidate-mobile\PublicToPortalClaimPanel.tsx",
  "apps\web\src\candidate-mobile\SmartMobileIntakePanel.tsx",
  "apps\web\src\candidate-mobile\MobileStatusCardsPanel.tsx",
  "scripts\db\Run-N19Migration.ps1",
  "scripts\validators\Validate-N19.ps1",
  "reports\n19\N19_CANDIDATE_MOBILE_PUBLIC_PORTAL_REPORT.md"
)
$Required | ForEach-Object { Require-File $_ }

Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "MOBILE_WEB_FIRST" "Manifest must lock mobile web first."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "PUBLIC_TO_PORTAL_HANDOFF" "Manifest must lock public-to-portal handoff."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "EMAIL_PRIMARY" "Manifest must lock email primary."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "WHATSAPP_URGENT_ONLY" "Manifest must lock WhatsApp urgent-only."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "NO_FAKE_STATUS" "Manifest must lock no fake status."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA" "Manifest must lock smart form no retyping."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "DEVICE_TRUST_REQUIRED" "Manifest must lock device trust."
Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "POPIA_MINIMIZATION" "Manifest must lock POPIA minimization."

Require-Contains "db\migrations\0017_n19_candidate_mobile_public_portal.sql" "candidate_mobile_devices" "Migration must create candidate_mobile_devices."
Require-Contains "db\migrations\0017_n19_candidate_mobile_public_portal.sql" "public_to_portal_claims" "Migration must create public_to_portal_claims."
Require-Contains "db\migrations\0017_n19_candidate_mobile_public_portal.sql" "candidate_mobile_status_cards" "Migration must create candidate_mobile_status_cards."
Require-Contains "db\migrations\0017_n19_candidate_mobile_public_portal.sql" "candidate_mobile_notification_preferences" "Migration must create candidate_mobile_notification_preferences."
Require-Contains "apps\api\src\candidate-mobile\mobile-policy.ts" "WHATSAPP_URGENT_ONLY" "Policy must enforce WhatsApp urgent-only."
Require-Contains "apps\api\src\candidate-mobile\mobile-policy.ts" "NO_FAKE_STATUS" "Policy must enforce no fake status."
Require-Contains "apps\api\src\candidate-mobile\mobile-smart-intake.ts" "smartFormDoesNotRetypeDocumentData" "Smart intake must prove no retyping doctrine."
Require-Contains "apps\api\src\candidate-mobile\device-trust.ts" "DEVICE_TRUST_REQUIRED" "Device trust boundary must be implemented."
Require-Contains "apps\web\src\candidate-mobile\CandidateMobileShell.tsx" "Mobile route command" "Mobile UI must position candidate portal correctly."

$Result = [ordered]@{
  phase = "N19"
  name = "Candidate Mobile / Public-to-Portal Experience"
  validated_at = (Get-Date).ToString("o")
  passed = ($Failures.Count -eq 0)
  failures = @($Failures)
  laws = @(
    "MOBILE_WEB_FIRST",
    "PUBLIC_TO_PORTAL_HANDOFF",
    "EMAIL_PRIMARY",
    "WHATSAPP_URGENT_ONLY",
    "SMS_BACKUP_ONLY",
    "NO_FAKE_STATUS",
    "SMART_FORM_DOES_NOT_RETYPE_DOCUMENT_DATA",
    "DEVICE_TRUST_REQUIRED",
    "POPIA_MINIMIZATION"
  )
}

$ReportDir = Join-Path $Base "reports\n19"
if (!(Test-Path $ReportDir)) { New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null }
$Result | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $ReportDir "N19_VALIDATION_RESULT.json") -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N19 validation failed:" -ForegroundColor Red
  $Failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
  exit 1
}

Write-Host "N19 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n19\N19_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0