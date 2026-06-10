$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base
docker compose -f "$Base\runtime\oracle-lite\docker-compose.oracle-lite.yml" up -d
Write-Host "Oracle Lite runtime started." -ForegroundColor Green
Write-Host "Health: http://localhost:8080/health" -ForegroundColor Yellow