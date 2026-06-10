$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$Migration = "$Base\db\migrations\0001_n03_truth_vault.sql"
$Seed = "$Base\db\seeds\n03_source_authorities_seed.sql"

if (!(Test-Path $Migration)) { throw "Missing migration: $Migration" }
if (!(Test-Path $Seed)) { throw "Missing seed: $Seed" }

Write-Host "=== N03 MIGRATION RUNNER ===" -ForegroundColor Cyan

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

docker cp $Migration "${Container}:/tmp/0001_n03_truth_vault.sql"
docker cp $Seed "${Container}:/tmp/n03_source_authorities_seed.sql"

docker exec $Container psql -U kingsmen -d kingsmen -v ON_ERROR_STOP=1 -f /tmp/0001_n03_truth_vault.sql
docker exec $Container psql -U kingsmen -d kingsmen -v ON_ERROR_STOP=1 -f /tmp/n03_source_authorities_seed.sql

Write-Host "N03 migration and seed applied to local Oracle Lite PostgreSQL." -ForegroundColor Green