#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-next-backend-bridge.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Free Destiny Map controlled Next-to-backend bridge proof - NextBackendBridge"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "This starts a local backend boundary and a local Next server, proves the bridge, then stops both."
Write-Host "This does not deploy to Oracle, does not send email, does not take payment, does not upload documents, and does not submit official applications."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map controlled Next-to-backend bridge proof failed."
}
