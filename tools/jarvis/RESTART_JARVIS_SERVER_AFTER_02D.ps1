$ErrorActionPreference = "Stop"

Write-Host "Restarting Jarvis server on 127.0.0.1:3000..." -ForegroundColor Cyan

$conns = @(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
foreach ($c in $conns) {
  try {
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($p) {
      Write-Host ("Stopping port 3000 owner: PID " + $p.Id + " " + $p.ProcessName) -ForegroundColor Yellow
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

Start-Sleep -Seconds 3
Start-Process "cmd.exe" "/k C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd"
Write-Host "Started new Jarvis server window. Keep it open." -ForegroundColor Green