#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 900
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-docker-oracle-lite-controlled-build.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Docker Oracle Lite controlled local build proof - ControlledDockerBuild"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "This checks Docker availability and builds local web/API images only when Docker is available."
Write-Host "This does not start containers, does not perform Compose startup, does not deploy to Oracle, does not send email, does not take payment, does not upload documents, and does not submit official applications."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Docker Oracle Lite controlled local build proof failed."
}
