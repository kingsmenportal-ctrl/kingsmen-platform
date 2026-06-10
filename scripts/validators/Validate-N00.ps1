$ErrorActionPreference = "Stop"

$Base = "C:\Kingsmen\kingsmen-platform"

$RequiredFiles = @(
  "doctrine\n00\kingsmen-laws.json",
  "doctrine\n00\boot-blockers.json",
  "doctrine\n00\source-confidence-bands.json",
  "doctrine\n00\privacy-popia-law.json",
  "doctrine\n00\pricing-lock.json",
  "doctrine\n00\oracle-lite-rules.json",
  "doctrine\n00\communication-doctrine.json",
  "doctrine\n00\cap-doctrine.json"
)

$Failures = @()

foreach ($File in $RequiredFiles) {
  $FullPath = Join-Path $Base $File

  if (!(Test-Path $FullPath)) {
    $Failures += "Missing file: $File"
    continue
  }

  try {
    Get-Content $FullPath -Raw | ConvertFrom-Json | Out-Null
  }
  catch {
    $Failures += "Invalid JSON: $File -- $($_.Exception.Message)"
  }
}

$Result = [ordered]@{
  module = "N00"
  name = "Kingsmen Constitution / Doctrine Lock"
  checked_at = (Get-Date).ToString("s")
  required_files = $RequiredFiles
  status = $(if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" })
  failures = $Failures
}

$ReportDir = "$Base\reports\n00"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$Result | ConvertTo-Json -Depth 10 | Set-Content "$ReportDir\N00_VALIDATION_RESULT.json" -Encoding UTF8

if ($Failures.Count -gt 0) {
  Write-Host "N00 validation failed:" -ForegroundColor Red
  foreach ($Failure in $Failures) {
    Write-Host "- $Failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "N00 validation passed." -ForegroundColor Green
Write-Host "Report: reports\n00\N00_VALIDATION_RESULT.json" -ForegroundColor Green