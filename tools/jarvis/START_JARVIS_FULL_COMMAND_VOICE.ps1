# KINGSMEN JARVIS FULL COMMAND VOICE STARTER
$ErrorActionPreference="Continue"
$Repo=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Bridge=Join-Path $Repo "tools\jarvis\KINGSMEN_NATIVE_VOICE_BRIDGE.ps1"
Write-Host "KINGSMEN JARVIS FULL COMMAND VOICE" -ForegroundColor Cyan
Write-Host "Repo: $Repo" -ForegroundColor DarkGray
function Test-Port3000{try{Invoke-WebRequest -Uri "http://127.0.0.1:3000/jarvis" -UseBasicParsing -TimeoutSec 2|Out-Null;return $true}catch{return $false}}
if(!(Test-Port3000)){Write-Host "Starting Kingsmen web server..." -ForegroundColor Yellow;$cmd="cd /d `"$Repo`"`r`nif exist pnpm-lock.yaml (pnpm dev) else (npm run dev)";Start-Process -FilePath "cmd.exe" -ArgumentList "/k",$cmd -WindowStyle Normal;Start-Sleep -Seconds 8}
Start-Process "http://127.0.0.1:3000/jarvis"
Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -NoExit -File `"$Bridge`"" -WindowStyle Normal
Write-Host "Jarvis started. Keep the voice bridge window open. Say: Jarvis" -ForegroundColor Green
