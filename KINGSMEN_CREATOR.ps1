param(
  [string]$Phase = "",
  [string]$Mode = "Report"
)

$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

powershell -ExecutionPolicy Bypass -File "$Base\scripts\creator\KINGSMEN_CREATOR.ps1" -Phase $Phase -Mode $Mode
exit $LASTEXITCODE