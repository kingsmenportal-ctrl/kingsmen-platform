# KINGSMEN SAFE JARVIS LAUNCHER
$ErrorActionPreference = "SilentlyContinue"
$App = "C:\Kingsmen\kingsmen-platform\apps\web"
$Url = "http://127.0.0.1:3000/jarvis"
$Port = 3000

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Write-Host "Jarvis server already running on port 3000. Opening existing server." -ForegroundColor Green
  Start-Process "msedge.exe" "--app=$Url"
  exit 0
}

Write-Host "Starting Jarvis Next server on port 3000..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k cd /d `"$App`" && npm run dev -- -H 127.0.0.1 -p 3000"
Start-Sleep -Seconds 8
Start-Process "msedge.exe" "--app=$Url"
