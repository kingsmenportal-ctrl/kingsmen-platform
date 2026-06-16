# KINGSMEN JARVIS BUILDER API SMOKE TEST
# Creates a plan only. It does not approve or write files.

$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS BUILDER API SMOKE TEST" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This creates a plan only. No approval. No file write." -ForegroundColor Yellow
Write-Host ""

$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
$BuilderUrl = "http://127.0.0.1:3000/api/jarvis/builder"
$CommandUrl = "http://127.0.0.1:3000/api/jarvis/command"

try {
  Invoke-RestMethod -Method Get -Uri $StatusUrl -TimeoutSec 5 | Out-Null
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
} catch {
  Write-Host "Jarvis API is not online. Start it first:" -ForegroundColor Red
  Write-Host "C:\Kingsmen\START_JARVIS_NOW.cmd" -ForegroundColor White
  exit 1
}

$body = @{
  action = "plan"
  command = "Jarvis, create Kingsmen module N21 Builder API Smoke Test"
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod -Method Post -Uri $BuilderUrl -ContentType "application/json" -Body $body -TimeoutSec 20

Write-Host ""
Write-Host "PLAN CREATED:" -ForegroundColor Green
Write-Host ("Plan ID: " + $result.plan.plan_id) -ForegroundColor Cyan
Write-Host ("Module:  " + $result.plan.module_id) -ForegroundColor Cyan
Write-Host ("Title:   " + $result.plan.title) -ForegroundColor Cyan
Write-Host ""
Write-Host "Approval phrase if Commander chooses to execute:" -ForegroundColor Yellow
Write-Host $result.plan.approval_phrase -ForegroundColor White
Write-Host ""
Write-Host "No files were written by this smoke test." -ForegroundColor Green
