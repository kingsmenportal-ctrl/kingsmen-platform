#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 120,
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-backend-runtime-boundary.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

if ($EnableLocalWrite) {
  $env:KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE = "true"
} elseif ([string]::IsNullOrWhiteSpace($env:KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE)) {
  $env:KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE = "true"
}

Write-Host "Kingsmen Free Destiny Map backend runtime boundary proof - BackendRuntimeBoundary"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "Local backend write flag: $env:KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE"
Write-Host "This starts a local backend HTTP service boundary, proves health and intake, then stops it."
Write-Host "This does not deploy to Oracle, does not send email, does not take payment, does not upload documents, and does not submit official applications."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map backend runtime boundary proof failed."
}
