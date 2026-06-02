#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-controlled-production-build.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Free Destiny Map controlled production build proof - ControlledProductionBuild"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "This runs a local Next production build for apps/web and records proof."
Write-Host "This does not deploy to Oracle, does not send email, does not take payment, does not upload documents, and does not submit official applications."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map controlled production build proof failed."
}
