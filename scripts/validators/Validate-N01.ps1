$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$RequiredFiles = @(
  "manifests\n01\oracle-lite-runtime.json",
  "runtime\oracle-lite\docker-compose.oracle-lite.yml",
  "runtime\oracle-lite\nginx.conf",
  "runtime\oracle-lite\README.md",
  ".env.n01.example",
  "scripts\runtime\Start-KingsmenLite.ps1",
  "scripts\runtime\Stop-KingsmenLite.ps1",
  "scripts\runtime\Health-KingsmenLite.ps1",
  "scripts\validators\Validate-N01.ps1",
  "scripts\creator\KINGSMEN_CREATOR.ps1",
  "KINGSMEN_CREATOR.ps1"
)

$Failures = @()

foreach ($File in $RequiredFiles) {
  if (!(Test-Path (Join-Path $Base $File))) {
    $Failures += "Missing file: $File"
  }
}

try {
  Get-Content "$Base\manifests\n01\oracle-lite-runtime.json" -Raw | ConvertFrom-Json | Out-Null
} catch {
  $Failures += "Invalid JSON: manifests\n01\oracle-lite-runtime.json"
}

$Result = [ordered]@{
  module = "N01"
  checked_at = (Get-Date).ToString("s")
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n01" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n01\N01_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N01 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) { Write-Host "- $Failure" -ForegroundColor Red }
  exit 1
}

Write-Host "N01 validation passed." -ForegroundColor Green