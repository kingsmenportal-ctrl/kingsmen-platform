param(
  [Parameter(Mandatory=$true)][string]$Phase,
  [Parameter(Mandatory=$false)][ValidateSet("Validate")][string]$Mode = "Validate"
)

$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$NormalizedPhase = $Phase.ToUpperInvariant()
$Validator = Join-Path $Base "scripts\validators\Validate-$NormalizedPhase.ps1"

if (!(Test-Path $Validator)) {
  throw "No validator found for phase $NormalizedPhase at $Validator"
}

powershell -ExecutionPolicy Bypass -File $Validator
exit $LASTEXITCODE