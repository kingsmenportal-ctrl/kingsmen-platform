$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) {
  Write-Host "DATABASE_URL is not set. Migration file is ready but was not applied." -ForegroundColor Yellow
  Write-Host "Set DATABASE_URL, then rerun this script." -ForegroundColor Yellow
  exit 0
}

psql $env:DATABASE_URL -f "$Base\db\migrations\0018_n20_final_assembly_system_lock.sql"
psql $env:DATABASE_URL -f "$Base\db\seeds\n20_final_assembly_seed.sql"

Write-Host "N20 database migration and seed applied." -ForegroundColor Green