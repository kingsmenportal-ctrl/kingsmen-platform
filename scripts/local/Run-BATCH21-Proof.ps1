$ErrorActionPreference = "Stop"

Set-Location "C:\Users\dell\kingsmen-platform"

Write-Host "PWD:"
Get-Location

Write-Host "Git status before proof:"
git status

Write-Host "Cleaning Docker Compose..."
docker compose -f .\docker\oracle-lite\docker-compose.local.yml down --remove-orphans

Write-Host "Running BATCH 21 proof..."
node .\scripts\proof\prove-docker-oracle-lite-controlled-runtime.mjs --timeoutSeconds=900

Write-Host "Reading proof report..."
Get-Content .\reports\runtime\docker-oracle-lite-controlled-runtime-proof.json -Raw

Write-Host "Running validator..."
node .\scripts\validators\validate-docker-oracle-lite-controlled-runtime.mjs

Write-Host "Git status after proof:"
git status
