$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS SERVER PROBE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

try {
  $status = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 5
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
  Write-Host ($status | ConvertTo-Json -Depth 20)
  Write-Host ""
  Write-Host "Opening Jarvis cockpit..." -ForegroundColor Green
  Start-Process "msedge.exe" "http://127.0.0.1:3000/jarvis" -ErrorAction SilentlyContinue
} catch {
  Write-Host "Jarvis API: OFFLINE" -ForegroundColor Red
  Write-Host "Start it with:" -ForegroundColor Yellow
  Write-Host "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd" -ForegroundColor White
  exit 1
}