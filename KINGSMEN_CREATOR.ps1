param(
  [string]$Phase = "N20",
  [string]$Mode = "Validate"
)

$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Base)) { throw "Missing repo folder: $Base" }
Set-Location $Base

if ($Mode -ne "Validate") {
  throw "KINGSMEN_CREATOR currently supports Validate mode for repo-materialized N-series phases."
}

$Validator = Join-Path $Base ("scripts\validators\Validate-" + $Phase + ".ps1")
if (!(Test-Path $Validator)) {
  throw "Missing validator for phase $Phase at $Validator"
}

powershell -ExecutionPolicy Bypass -File $Validator
exit $LASTEXITCODE