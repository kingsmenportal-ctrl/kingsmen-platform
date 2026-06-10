$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) { throw "DATABASE_URL is not set. Set it before applying N18 migration." }

$SqlFiles = @(
  "db\migrations\0016_n18_public_website.sql",
  "db\seeds\n18_public_website_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
  Write-Host "Applying $File" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $File
}

Write-Host "N18 database migration applied." -ForegroundColor Green