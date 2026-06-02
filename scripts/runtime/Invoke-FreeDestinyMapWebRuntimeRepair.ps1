#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$RunInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$webDir = Join-Path $repoRoot "apps\web"
$componentPath = Join-Path $repoRoot "apps\web\src\components\kingsmen\FreeDestinyMapApiForm.tsx"
$proofScript = Join-Path $repoRoot "scripts\proof\prove-free-destiny-map-real-web-runtime-repair.mjs"

if (-not (Test-Path $webDir -PathType Container)) {
  throw "Missing web directory: $webDir"
}

if (-not (Test-Path $proofScript -PathType Leaf)) {
  throw "Missing proof script: $proofScript"
}

if (Test-Path $componentPath -PathType Leaf) {
  $content = Get-Content $componentPath -Raw
  $updated = $content `
    -replace '\.\./\.\.//lib/kingsmen/free-destiny-map-client', '../../lib/kingsmen/free-destiny-map-client' `
    -replace '\.\./\.\./\.\./\.\./packages/contracts/src/free-destiny-map-api-wiring', '../../../../../packages/contracts/src/free-destiny-map-api-wiring'

  if ($updated -ne $content) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($componentPath, $updated, $utf8)
    Write-Host "Repaired FreeDestinyMapApiForm import paths."
  }
}

if ($RunInstall) {
  Write-Host "Installing apps/web dependencies with npm."
  Push-Location $webDir
  try {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npmCommand) {
      $npmCommand = Get-Command npm -ErrorAction Stop
    }

    & $npmCommand.Source install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "Skipping npm install. Use -RunInstall to repair dependency-install-evidence-present."
}

Write-Host "Kingsmen Free Destiny Map real web runtime repair proof"
Write-Host "This repairs local web runtime readiness. It does not claim production, Oracle runtime, email, payment, documents, or official submissions."

node $proofScript

if ($LASTEXITCODE -ne 0) {
  throw "Free Destiny Map web runtime repair proof failed."
}
