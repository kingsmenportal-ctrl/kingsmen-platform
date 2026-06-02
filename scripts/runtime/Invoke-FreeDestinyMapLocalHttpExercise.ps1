#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-local-http-exercise.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

if ($EnableLocalWrite) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true"
} elseif ([string]::IsNullOrWhiteSpace($env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE)) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true"
}

Write-Host "Kingsmen Free Destiny Map local HTTP exercise"
Write-Host "Local write flag: $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE"
Write-Host "This is not Oracle runtime and not production runtime."

node $scriptPath

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map local HTTP exercise failed."
}
