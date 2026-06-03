#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-docker-oracle-lite-controlled-runtime.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Docker Oracle Lite controlled local runtime proof - ControlledDockerRuntime"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "This starts local Docker Compose web/API containers, proves HTTP health and bridge, then shuts them down."
Write-Host "This does not deploy to Oracle, does not expose a public production URL, does not send email, does not take payment, does not upload documents, and does not submit official applications."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Docker Oracle Lite controlled local runtime proof failed."
}
