$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) { throw "DATABASE_URL is not set. Set it before applying N09 migration." }

$SqlFiles = @(
  "db\migrations\0007_n09_notifications_communications.sql",
  "db\seeds\n09_communications_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
  Write-Host "Applying $File" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $File
}

Write-Host "N09 database migration applied." -ForegroundColor Green