$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) {
  Write-Host "DATABASE_URL is not set. Migration file is ready but was not applied." -ForegroundColor Yellow
  Write-Host "Set DATABASE_URL, then rerun this script." -ForegroundColor Yellow
  exit 0
}

psql $env:DATABASE_URL -f "$Base\db\migrations\0017_n19_candidate_mobile_public_portal.sql"
psql $env:DATABASE_URL -f "$Base\db\seeds\n19_candidate_mobile_seed.sql"

Write-Host "N19 database migration and seed applied." -ForegroundColor Green