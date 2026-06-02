#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-local-route-exercise.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

if ($EnableLocalWrite) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true"
} elseif ([string]::IsNullOrWhiteSpace($env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE)) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "false"
}

Write-Host "Kingsmen Free Destiny Map local route exercise"
Write-Host "Local write flag: $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE"
Write-Host "This is not production runtime."

node $scriptPath

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map local route exercise failed."
}
