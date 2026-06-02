#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 120,
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-controlled-web-api-integration.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

if ($EnableLocalWrite) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true"
} elseif ([string]::IsNullOrWhiteSpace($env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE)) {
  $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true"
}

Write-Host "Kingsmen Free Destiny Map controlled local web plus API integration proof - ControlledWebApiIntegration"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "Local write flag: $env:KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE"
Write-Host "This starts the local Next dev server, proves the page and same-origin API route, then stops it."
Write-Host "This does not claim production, Oracle runtime, email, payment, documents, or official submissions."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map controlled web plus API integration proof failed."
}
