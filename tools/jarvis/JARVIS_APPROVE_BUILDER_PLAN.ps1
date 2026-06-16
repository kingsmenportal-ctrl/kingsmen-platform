$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS APPROVE BUILDER PLAN" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$PlanId = Read-Host "Enter Plan ID, example KJB-20260615-140132"
$PlanId = $PlanId.Trim().ToUpperInvariant()

if ($PlanId -notmatch '^KJB-\d{8}-\d{6}$') {
  Write-Host "Invalid Plan ID." -ForegroundColor Red
  exit 1
}

try {
  Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 5 | Out-Null
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
} catch {
  Write-Host "Jarvis API is not online. Start it first:" -ForegroundColor Red
  Write-Host "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd" -ForegroundColor White
  exit 1
}

$body = @{
  command = "approve $PlanId"
} | ConvertTo-Json -Depth 20

$result = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3000/api/jarvis/command" -ContentType "application/json" -Body $body -TimeoutSec 300

Write-Host ""
Write-Host "JARVIS RESPONSE:" -ForegroundColor Cyan
Write-Host ($result.reply) -ForegroundColor White
Write-Host ""
Write-Host "RAW RESULT:" -ForegroundColor DarkCyan
Write-Host ($result | ConvertTo-Json -Depth 80)

if ($result.ok -eq $true) {
  Write-Host ""
  Write-Host "APPROVAL COMMAND COMPLETED." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "APPROVAL COMMAND BLOCKED. The exact error is shown above." -ForegroundColor Yellow
}