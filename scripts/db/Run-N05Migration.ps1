$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$SqlFiles = @(
  "$Base\db\migrations\0001_n03_truth_vault.sql",
  "$Base\db\seeds\n03_source_authorities_seed.sql",
  "$Base\db\migrations\0002_n04_candidate_core.sql",
  "$Base\db\seeds\n04_runtime_config_seed.sql",
  "$Base\db\migrations\0003_n05_document_vault.sql",
  "$Base\db\seeds\n05_runtime_config_seed.sql"
)

foreach ($File in $SqlFiles) {
  if (!(Test-Path $File)) { throw "Missing SQL file: $File" }
}

Write-Host "=== N05 MIGRATION RUNNER ===" -ForegroundColor Cyan

$DockerAvailable = $false
try {
  docker --version | Out-Null
  $DockerAvailable = $true
}
catch {
  $DockerAvailable = $false
}

if (!$DockerAvailable) {
  throw "Docker is not available. Start Docker Desktop or run the SQL manually against PostgreSQL."
}

$Container = "kingsmen-postgres"
$Running = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $Container

if (!$Running) {
  Write-Host "Postgres container not running. Starting Oracle Lite runtime..." -ForegroundColor Yellow
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\runtime\Start-KingsmenLite.ps1"
  Start-Sleep -Seconds 8
}

foreach ($File in $SqlFiles) {
  $Name = Split-Path -Leaf $File
  docker cp $File "${Container}:/tmp/$Name"
  docker exec $Container psql -U kingsmen -d kingsmen -v ON_ERROR_STOP=1 -f "/tmp/$Name"
}

Write-Host "N03 + N04 + N05 migrations and seeds applied to local Oracle Lite PostgreSQL." -ForegroundColor Green