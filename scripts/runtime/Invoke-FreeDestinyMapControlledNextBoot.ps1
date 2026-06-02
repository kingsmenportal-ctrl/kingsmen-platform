#requires -Version 5.1
[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-controlled-next-boot.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Free Destiny Map controlled Next web boot proof"
Write-Host "Timeout seconds: $TimeoutSeconds"
Write-Host "This starts a local Next dev server, proves /free-destiny-map, then stops it."
Write-Host "This does not claim production, Oracle runtime, email, payment, documents, or official submissions."

node $scriptPath "--timeoutSeconds=$TimeoutSeconds"

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map controlled Next boot proof failed."
}
