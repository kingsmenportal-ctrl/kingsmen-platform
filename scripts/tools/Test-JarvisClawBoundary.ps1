$ErrorActionPreference = "Continue"

Write-Host "KINGSMEN JARVIS + CLAW BOUNDARY CHECK" -ForegroundColor Cyan

$checks = @(
  "docs\tools\KINGSMEN_JARVIS_CLAW_OPERATOR_MODEL.md",
  "docs\tools\KINGSMEN_JARVIS_CLAW_COMMANDS.md",
  "docs\security\KINGSMEN_AI_OPERATOR_BOUNDARY.md",
  "manifests\tools\jarvis-claw-operator-bridge.json",
  "reports\tools\jarvis-claw-operator-bridge-report.json"
)

foreach ($check in $checks) {
  if (Test-Path $check) {
    Write-Host "PASS $check" -ForegroundColor Green
  } else {
    Write-Host "FAIL $check" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Manual tests still required inside OpenClaw TUI and Jarvis CLI." -ForegroundColor Yellow
