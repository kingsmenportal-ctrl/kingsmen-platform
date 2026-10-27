$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if (!$env:DATABASE_URL) { throw "DATABASE_URL is not set. Set it before applying N10 migration." }

$SqlFiles = @(
  "db\migrations\0008_n10_finance_payfast.sql",
  "db\migrations\20261027120000_reconcile_canonical_package_catalogues.sql",
  "db\seeds\n10_finance_payfast_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
  Write-Host "Applying $File" -ForegroundColor Cyan
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $File
}

Write-Host "N10 canonical package reconciliation and finance seed applied." -ForegroundColor Green