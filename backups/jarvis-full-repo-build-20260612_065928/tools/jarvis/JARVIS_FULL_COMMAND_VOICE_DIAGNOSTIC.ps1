# KINGSMEN JARVIS FULL COMMAND VOICE DIAGNOSTIC
$Repo=(Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Write-Host "=== KINGSMEN JARVIS FULL COMMAND VOICE DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host "Repo: $Repo" -ForegroundColor DarkGray
Write-Host "`nNode:" -ForegroundColor Yellow;try{node --version}catch{Write-Host "Node not found." -ForegroundColor Red}
Write-Host "`nSystem.Speech:" -ForegroundColor Yellow;try{Add-Type -AssemblyName System.Speech;Write-Host "System.Speech OK" -ForegroundColor Green}catch{Write-Host $_.Exception.Message -ForegroundColor Red}
Write-Host "`nVoice bridge parser:" -ForegroundColor Yellow;try{[scriptblock]::Create((Get-Content (Join-Path $Repo "tools\jarvis\KINGSMEN_NATIVE_VOICE_BRIDGE.ps1") -Raw))|Out-Null;Write-Host "Parser OK" -ForegroundColor Green}catch{Write-Host $_.Exception.Message -ForegroundColor Red}
Write-Host "`nJarvis API status:" -ForegroundColor Yellow;try{Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 4|ConvertTo-Json -Depth 8}catch{Write-Host $_.Exception.Message -ForegroundColor Red}
Write-Host "`nLatest native voice log:" -ForegroundColor Yellow;$log=Join-Path $Repo "reports\jarvis\runtime\native-voice-bridge.log";if(Test-Path $log){Get-Content $log -Tail 60}else{Write-Host "No native voice log yet." -ForegroundColor DarkYellow}
