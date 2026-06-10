param(
  [string]$Phase = "",
  [string]$Mode = "Report"
)

$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

if ($Mode -eq "Validate" -and $Phase -eq "N00") {
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\validators\Validate-N00.ps1"
  exit $LASTEXITCODE
}

if ($Mode -eq "Validate" -and $Phase -eq "N01") {
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\validators\Validate-N01.ps1"
  exit $LASTEXITCODE
}

Write-Host "Available: -Phase N00 -Mode Validate | -Phase N01 -Mode Validate" -ForegroundColor Green