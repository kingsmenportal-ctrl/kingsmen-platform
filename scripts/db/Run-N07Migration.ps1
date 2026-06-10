$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) {
  throw "DATABASE_URL is not set. Set it before applying N07 migration."
}

$sqlFiles = @(
  "db\migrations\0005_n07_airtable_sync.sql",
  "db\seeds\n07_airtable_sync_seed.sql"
)

foreach ($file in $sqlFiles) {
  if (!(Test-Path $file)) { throw "Missing SQL file: $file" }
  Write-Host "Applying $file" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $file
}

Write-Host "N07 database migration applied." -ForegroundColor Green