$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) { throw "DATABASE_URL is not set. Set it before applying N17 migration." }

$SqlFiles = @(
  "db\migrations\0015_n17_founder_command_ops.sql",
  "db\seeds\n17_founder_command_ops_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
  Write-Host "Applying $File" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $File
}

Write-Host "N17 database migration applied." -ForegroundColor Green