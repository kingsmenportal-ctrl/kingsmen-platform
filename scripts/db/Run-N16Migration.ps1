$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) { throw "DATABASE_URL is not set. Set it before applying N16 migration." }

$SqlFiles = @(
  "db\migrations\0014_n16_orchestrator_execution.sql",
  "db\seeds\n16_orchestrator_execution_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
  Write-Host "Applying $File" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $File
}

Write-Host "N16 database migration applied." -ForegroundColor Green