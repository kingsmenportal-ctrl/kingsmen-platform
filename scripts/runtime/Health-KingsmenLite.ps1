$ErrorActionPreference = "Stop"
$Base = "C:\Kingsmen\kingsmen-platform"
Set-Location $Base

$Result = [ordered]@{
  checked_at = (Get-Date).ToString("s")
  compose_file_exists = Test-Path "$Base\runtime\oracle-lite\docker-compose.oracle-lite.yml"
  nginx_conf_exists = Test-Path "$Base\runtime\oracle-lite\nginx.conf"
  manifest_exists = Test-Path "$Base\manifests\n01\oracle-lite-runtime.json"
  status = "UNKNOWN"
}

if ($Result.compose_file_exists -and $Result.nginx_conf_exists -and $Result.manifest_exists) {
  $Result.status = "PASS"
} else {
  $Result.status = "FAIL"
}

New-Item -ItemType Directory -Force -Path "$Base\reports\n01" | Out-Null
$Result | ConvertTo-Json -Depth 10 | Set-Content "$Base\reports\n01\N01_HEALTH_RESULT.json" -Encoding UTF8

if ($Result.status -ne "PASS") { exit 1 }

Write-Host "N01 health passed." -ForegroundColor Green