$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base
docker compose -f "$Base\runtime\oracle-lite\docker-compose.oracle-lite.yml" down
Write-Host "Oracle Lite runtime stopped." -ForegroundColor Green