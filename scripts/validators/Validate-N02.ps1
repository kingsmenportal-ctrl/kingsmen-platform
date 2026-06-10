$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n02\backend-api-kernel.json",
  "apps\api\src\state\state-machine.ts",
  "apps\api\src\kernel\command-envelope.ts",
  "apps\api\src\kernel\command-bus.ts",
  "apps\api\src\kernel\api-boundary.ts",
  "apps\api\src\policy\policy-middleware.ts",
  "apps\api\src\workflows\workflow-result.ts",
  "apps\api\src\read-models\candidate-read-model.ts",
  "apps\api\src\integrations\integration-adapters.ts",
  "apps\api\src\observability\audit-event.ts",
  "apps\api\src\index.ts",
  "reports\n02\N02_BACKEND_KERNEL_REPORT.md"
)

$Failures = @()

foreach ($File in $RequiredFiles) {
  $Full = Join-Path $Base $File
  if (!(Test-Path $Full)) {
    $Failures += "Missing file: $File"
  }
}

try {
  Get-Content "$Base\manifests\n02\backend-api-kernel.json" -Raw | ConvertFrom-Json | Out-Null
}
catch {
  $Failures += "Invalid JSON: manifests\n02\backend-api-kernel.json"
}

$StateMachine = Get-Content "$Base\apps\api\src\state\state-machine.ts" -Raw
$Envelope = Get-Content "$Base\apps\api\src\kernel\command-envelope.ts" -Raw
$Policy = Get-Content "$Base\apps\api\src\policy\policy-middleware.ts" -Raw
$Workflow = Get-Content "$Base\apps\api\src\workflows\workflow-result.ts" -Raw
$Adapters = Get-Content "$Base\apps\api\src\integrations\integration-adapters.ts" -Raw

foreach ($State in @("NEW","INTAKE_PENDING","EVALUATION_PENDING","DOCUMENT_PENDING","EXECUTION_PENDING","COMPLETED","FAILED")) {
  if ($StateMachine -notmatch $State) {
    $Failures += "State machine missing state: $State"
  }
}

foreach ($Worker in @("W04","W05","W08","W09","W13","W14","W15","W16","W17","W24")) {
  if ($StateMachine -notmatch $Worker) {
    $Failures += "State machine missing same-state worker: $Worker"
  }
}

if ($StateMachine -notmatch "assertTransition") { $Failures += "State machine missing assertTransition." }
if ($Envelope -notmatch "idempotencyKey") { $Failures += "Command envelope missing idempotencyKey." }
if ($Envelope -notmatch "correlationId") { $Failures += "Command envelope missing correlationId." }
if ($Policy -notmatch "requiresApproval") { $Failures += "Policy middleware missing requiresApproval." }
if ($Workflow -notmatch "assertWorkflowResult") { $Failures += "Workflow result missing assertWorkflowResult." }
if ($Workflow -notmatch "finalState") { $Failures += "Workflow result missing finalState." }
if ($Adapters -notmatch "blockedPortalToMapReason") { $Failures += "Integration adapter missing MAP fallback helper." }

$Result = [ordered]@{
  module = "N02"
  name = "Backend API Kernel / State Machine"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
  required_files = $RequiredFiles
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n02" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n02\N02_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N02 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N02 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n02\N02_VALIDATION_RESULT.json" -ForegroundColor Green