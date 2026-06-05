#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$target = Join-Path $root "tools\agents\openclaw\repo"

Write-Host "Kingsmen OpenClaw sandbox installer"
Write-Host "Target: $target"
Write-Host "No Kingsmen secrets will be copied."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or not available in PATH."
}

if (Test-Path $target) {
  Write-Host "OpenClaw repo already exists. Pulling latest..."
  git -C $target pull
} else {
  git clone https://github.com/openclaw/openclaw.git $target
}

$report = [ordered]@{
  schema = "kingsmen.openclaw-sandbox-install-report.v1"
  module = "TOOLS-AGENT-01 - OpenClaw Sandbox Install"
  status = "OPENCLAW_SANDBOX_REPO_PRESENT"
  productionReady = $false
  connectedToKingsmenSecrets = $false
  candidateDataAccess = $false
  oracleAccess = $false
  paymentAccess = $false
  installedPath = $target
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  next_action = "Review OpenClaw docs locally. Do not configure secrets. Build Kingsmen Founder Command Agent boundary first."
}

New-Item -ItemType Directory -Force -Path ".\reports\agents" | Out-Null
$report | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 ".\reports\agents\openclaw-sandbox-install-latest.json"

$report | ConvertTo-Json -Depth 10
