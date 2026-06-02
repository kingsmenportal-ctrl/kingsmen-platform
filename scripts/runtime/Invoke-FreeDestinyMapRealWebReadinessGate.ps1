#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$scriptPath = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-real-web-readiness.mjs"

if (-not (Test-Path $scriptPath -PathType Leaf)) {
  throw "Missing proof script: $scriptPath"
}

Write-Host "Kingsmen Free Destiny Map real local web readiness gate"
Write-Host "This checks real repo readiness. It does not claim production, Oracle runtime, email, payment, documents, or official submissions."

node $scriptPath

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map real web readiness gate failed."
}
