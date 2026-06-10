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

if ($Mode -eq "Validate" -and $Phase -eq "N02") {
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\validators\Validate-N02.ps1"
  exit $LASTEXITCODE
}

if ($Mode -eq "Validate" -and $Phase -eq "N03") {
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\validators\Validate-N03.ps1"
  exit $LASTEXITCODE
}

if ($Mode -eq "Migrate" -and $Phase -eq "N03") {
  powershell -ExecutionPolicy Bypass -File "$Base\scripts\db\Run-N03Migration.ps1"
  exit $LASTEXITCODE
}

Write-Host "Available validate phases: N00, N01, N02, N03" -ForegroundColor Green
Write-Host "N03 local DB migration: powershell -ExecutionPolicy Bypass -File .\KINGSMEN_CREATOR.ps1 -Phase N03 -Mode Migrate" -ForegroundColor Yellow