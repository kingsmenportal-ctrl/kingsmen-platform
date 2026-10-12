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

function Require-NotContains([string]$Path,[string]$Needle,[string]$Message) {
  Require-File $Path
  if (Test-Path $Path) {
    $Text = Get-Content $Path -Raw
    if ($Text -like "*$Needle*") { $Failures.Add($Message) }
  }
}

$Files = @(
  "manifests\n10\finance-payfast-runtime.json",
  "db\migrations\0008_n10_finance_payfast.sql",
  "db\seeds\n10_finance_payfast_seed.sql",
  "runtime\payfast\payfast-runtime.example.json",
  "apps\api\src\finance\finance-types.ts",
  "apps\api\src\finance\pricing-catalog.ts",
  "apps\api\src\finance\money.ts",
  "apps\api\src\finance\finance-policy.ts",
  "apps\api\src\finance\payfast-signature.ts",
  "apps\api\src\finance\payfast-intent.ts",
  "apps\api\src\finance\payfast-itn.ts",
  "apps\api\src\finance\finance-ledger.ts",
  "apps\api\src\finance\refund-boundary.ts",
  "apps\api\src\finance\payment-evidence.ts",
  "apps\api\src\finance\finance-read-model.ts",
  "apps\api\src\finance\index.ts",
  "apps\web\src\finance\FinanceRuntimePanel.tsx",
  "apps\web\src\finance\PaymentStatusPanel.tsx",
  "apps\web\src\finance\RefundReviewPanel.tsx",
  "scripts\db\Run-N10Migration.ps1",
  "reports\n10\N10_FINANCE_PAYFAST_REPORT.md"
)

foreach ($File in $Files) { Require-File $File }

Require-Contains "manifests\n10\finance-payfast-runtime.json" "PostgreSQL finance ledger is truth" "Manifest must lock PostgreSQL finance truth."
Require-Contains "manifests\n10\finance-payfast-runtime.json" "No AI refund approval" "Manifest must block AI refund approval."
Require-Contains "manifests\n10\finance-payfast-runtime.json" "PayFast ITN receipts must be idempotent" "Manifest must lock ITN idempotency."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "finance_plan_catalog" "Migration missing plan catalog."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "payfast_payment_intents" "Migration missing PayFast intents."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "payfast_itn_receipts" "Migration missing PayFast ITN receipts."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "finance_refund_requests" "Migration missing refund requests."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "finance_ledger_entries" "Migration missing finance ledger."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "payment_evidence_ledger" "Migration missing payment evidence ledger."
Require-Contains "db\migrations\0008_n10_finance_payfast.sql" "enable row level security" "Migration must enable RLS."
Require-Contains "db\seeds\n10_finance_payfast_seed.sql" "FREE_DESTINY_MAP_R0" "Seed missing Free Destiny Map."
Require-Contains "db\seeds\n10_finance_payfast_seed.sql" "CV_REVAMP_R49_99" "Seed missing CV Revamp."
Require-Contains "db\seeds\n10_finance_payfast_seed.sql" "Never invent fake" "Seed must lock CV truth rule."
Require-NotContains "apps\api\src\finance\pricing-catalog.ts" "ACCOMMODATION_SUPPORT_R179" "Standalone accommodation product must not be orderable."
Require-NotContains "db\seeds\n10_finance_payfast_seed.sql" "ACCOMMODATION_SUPPORT_R179" "Seed must not re-enable standalone accommodation product."
Require-Contains "db\seeds\n10_finance_payfast_seed.sql" "set active = false" "Seed must deactivate any legacy standalone accommodation product."
Require-Contains "runtime\payfast\payfast-runtime.example.json" "PAYFAST_MERCHANT_ID" "Runtime example missing merchant ID."
Require-Contains "runtime\payfast\payfast-runtime.example.json" "Never commit real PayFast credentials" "Runtime example must block secrets."
Require-Contains "apps\api\src\finance\finance-policy.ts" "NO_AI_REFUND_APPROVAL" "Policy must block AI refund approval."
Require-Contains "apps\api\src\finance\finance-policy.ts" "Paid status requires payment evidence" "Policy must require payment evidence."
Require-Contains "apps\api\src\finance\payfast-signature.ts" "createHash(""md5"")" "Signature module must create MD5 signature."
Require-Contains "apps\api\src\finance\payfast-intent.ts" "https://sandbox.payfast.co.za/eng/process" "PayFast intent missing sandbox URL."
Require-Contains "apps\api\src\finance\payfast-intent.ts" "https://www.payfast.co.za/eng/process" "PayFast intent missing live URL."
Require-Contains "apps\api\src\finance\payfast-itn.ts" "Invalid PayFast signature" "ITN validator must reject invalid signature."
Require-Contains "apps\api\src\finance\payfast-itn.ts" "Payment status is not COMPLETE" "ITN validator must require COMPLETE payment."
Require-Contains "apps\api\src\finance\finance-ledger.ts" "Finance ledger entries are not balanced" "Ledger must enforce balance."
Require-Contains "apps\api\src\finance\refund-boundary.ts" "aiCanApproveRefund" "Refund boundary must expose AI false function."
Require-Contains "apps\api\src\finance\payment-evidence.ts" "Payment evidence summary is required" "Payment evidence module must require summary."
Require-Contains "apps\api\src\index.ts" "./finance" "API index missing Finance export."
Require-Contains "apps\web\src\finance\FinanceRuntimePanel.tsx" "PostgreSQL finance truth" "Finance UI must show truth boundary."
Require-Contains "apps\web\src\finance\PaymentStatusPanel.tsx" "Verified before activation" "Payment UI must show verified activation boundary."
Require-Contains "apps\web\src\finance\RefundReviewPanel.tsx" "No AI refund approval" "Refund UI must show no-AI boundary."
Require-Contains "reports\n10\N10_FINANCE_PAYFAST_REPORT.md" "PayFast is the payment processor" "Report must state PayFast processor boundary."

$Result = [ordered]@{
  phase = "N10"
  name = "Finance / PayFast Runtime"
  passed = ($Failures.Count -eq 0)
  checkedAt = (Get-Date).ToString("s")
  failures = @($Failures)
}

New-Item -ItemType Directory -Force -Path "reports\n10" | Out-Null
$Result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 "reports\n10\N10_VALIDATION_RESULT.json"

if ($Failures.Count -gt 0) {
  Write-Host "N10 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N10 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n10\N10_VALIDATION_RESULT.json" -ForegroundColor Green
exit 0