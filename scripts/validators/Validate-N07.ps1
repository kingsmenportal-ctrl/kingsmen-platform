$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$Failures = New-Object System.Collections.Generic.List[string]

function Require-File {
  param([string]$Path)
  if (!(Test-Path $Path)) {
    $Failures.Add("Missing file: $Path")
  }
}

function Require-Contains {
  param([string]$Path, [string]$Needle, [string]$Message)
  Require-File $Path
  if (Test-Path $Path) {
    $Text = Get-Content $Path -Raw
    if ($Text -notlike "*$Needle*") {
      $Failures.Add($Message)
    }
  }
}

$RequiredFiles = @(
  "manifests\n07\airtable-sync.json",
  "db\migrations\0005_n07_airtable_sync.sql",
  "db\seeds\n07_airtable_sync_seed.sql",
  "runtime\airtable\airtable-runtime.example.json",
  "apps\api\src\airtable\airtable-types.ts",
  "apps\api\src\airtable\airtable-base-registry.ts",
  "apps\api\src\airtable\airtable-sync-targets.ts",
  "apps\api\src\airtable\airtable-sync-policy.ts",
  "apps\api\src\airtable\airtable-field-map.ts",
  "apps\api\src\airtable\airtable-client.ts",
  "apps\api\src\airtable\airtable-outbox.ts",
  "apps\api\src\airtable\airtable-webhook.ts",
  "apps\api\src\airtable\airtable-repository.ts",
  "apps\api\src\airtable\airtable-health.ts",
  "apps\api\src\airtable\index.ts",
  "apps\web\src\airtable-sync\AirtableSyncPanel.tsx",
  "apps\web\src\airtable-sync\SyncOutboxPanel.tsx",
  "scripts\db\Run-N07Migration.ps1",
  "reports\n07\N07_AIRTABLE_SYNC_REPORT.md"
)

foreach ($file in $RequiredFiles) {
  Require-File $file
}

Require-Contains "manifests\n07\airtable-sync.json" "airtableMirrorOnly" "N07 manifest must lock Airtable as mirror-only."
Require-Contains "manifests\n07\airtable-sync.json" "noSecretsInRepo" "N07 manifest must block secrets in repo."
Require-Contains "db\migrations\0005_n07_airtable_sync.sql" "airtable_base_registry" "N07 migration missing Airtable base registry."
Require-Contains "db\migrations\0005_n07_airtable_sync.sql" "airtable_sync_outbox" "N07 migration missing sync outbox."
Require-Contains "db\migrations\0005_n07_airtable_sync.sql" "airtable_webhook_receipts" "N07 migration missing webhook receipts."
Require-Contains "db\migrations\0005_n07_airtable_sync.sql" "backend_state_authoritative = true" "N07 migration must enforce backend state authority."
Require-Contains "db\seeds\n07_airtable_sync_seed.sql" "Kingsman Nexus-7" "N07 seed missing Nexus-7."
Require-Contains "db\seeds\n07_airtable_sync_seed.sql" "Partner Ecosystem Directory" "N07 seed missing Partner Ecosystem Directory."
Require-Contains "db\seeds\n07_airtable_sync_seed.sql" "Document Vault" "N07 seed missing Document Vault."
Require-Contains "runtime\airtable\airtable-runtime.example.json" "AIRTABLE_API_KEY" "N07 runtime example missing AIRTABLE_API_KEY reference."
Require-Contains "apps\api\src\airtable\airtable-client.ts" "Missing AIRTABLE_API_KEY" "N07 Airtable client must refuse missing runtime secret."
Require-Contains "apps\api\src\airtable\airtable-sync-policy.ts" "PostgreSQL remains the truth source" "N07 sync policy must preserve PostgreSQL truth."
Require-Contains "apps\api\src\airtable\airtable-webhook.ts" "requiresOperatorReview: true" "N07 webhooks must require operator review."
Require-Contains "apps\api\src\airtable\airtable-outbox.ts" "idempotency key" "N07 outbox must enforce idempotency."
Require-Contains "apps\api\src\airtable\index.ts" "airtable-health" "N07 Airtable barrel export missing health module."
Require-Contains "apps\api\src\index.ts" "./airtable" "API index missing Airtable sync export."
Require-Contains "apps\web\src\airtable-sync\AirtableSyncPanel.tsx" "PostgreSQL remains the truth vault" "N07 UI must show PostgreSQL truth boundary."
Require-Contains "apps\web\src\airtable-sync\SyncOutboxPanel.tsx" "idempotency" "N07 outbox UI must mention idempotency."
Require-Contains "reports\n07\N07_AIRTABLE_SYNC_REPORT.md" "Airtable is not the truth source" "N07 report must state Airtable is not truth source."

$Result = [ordered]@{
  phase = "N07"
  name = "Airtable Sync"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

$ReportDir = Join-Path $Base "reports\n07"
if (!(Test-Path $ReportDir)) { New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null }
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n07\N07_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N07 validation failed:" -ForegroundColor Red
  foreach ($failure in $Failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N07 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n07\N07_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0