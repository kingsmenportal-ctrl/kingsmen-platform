# N_PROVIDER.1 — Kingsmen Windows Tool Installer
# Safe installer: reports commands and installs common tools with winget/npm only when requested.
param(
  [switch]$Install,
  [switch]$ReportOnly
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ReportDir = Join-Path $Root "reports/provider"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$Tools = @(
  @{ Name = "Git"; Command = "git"; Args = "--version"; Winget = "Git.Git"; Required = $true },
  @{ Name = "GitHub CLI"; Command = "gh"; Args = "--version"; Winget = "GitHub.cli"; Required = $true },
  @{ Name = "PowerShell 7"; Command = "pwsh"; Args = "--version"; Winget = "Microsoft.PowerShell"; Required = $true },
  @{ Name = "Node.js LTS"; Command = "node"; Args = "--version"; Winget = "OpenJS.NodeJS.LTS"; Required = $true },
  @{ Name = "pnpm"; Command = "pnpm"; Args = "--version"; Npm = "pnpm"; Required = $true },
  @{ Name = "Docker"; Command = "docker"; Args = "--version"; Winget = "Docker.DockerDesktop"; Required = $true },
  @{ Name = "VS Code"; Command = "code"; Args = "--version"; Winget = "Microsoft.VisualStudioCode"; Required = $false },
  @{ Name = "Python"; Command = "python"; Args = "--version"; Winget = "Python.Python.3.12"; Required = $false },
  @{ Name = "Netlify CLI"; Command = "netlify"; Args = "--version"; Npm = "netlify-cli"; Required = $false },
  @{ Name = "Supabase CLI"; Command = "supabase"; Args = "--version"; Npm = "supabase"; Required = $false },
  @{ Name = "Oracle OCI CLI"; Command = "oci"; Args = "--version"; Winget = "Oracle.OCI-CLI"; Required = $false }
)

function Test-Tool($tool) {
  try {
    $cmd = Get-Command $tool.Command -ErrorAction Stop
    $version = & $tool.Command $tool.Args 2>&1 | Select-Object -First 1
    return @{ name=$tool.Name; command=$tool.Command; installed=$true; required=$tool.Required; version="$version"; path=$cmd.Source }
  } catch {
    return @{ name=$tool.Name; command=$tool.Command; installed=$false; required=$tool.Required; version=$null; path=$null }
  }
}

$Results = @()
foreach ($tool in $Tools) {
  $status = Test-Tool $tool
  $Results += $status
  if ($Install -and -not $status.installed) {
    if ($tool.Winget) {
      Write-Host "Installing $($tool.Name) with winget..." -ForegroundColor Cyan
      winget install --id $tool.Winget -e --accept-package-agreements --accept-source-agreements
    } elseif ($tool.Npm) {
      Write-Host "Installing $($tool.Name) with npm..." -ForegroundColor Cyan
      npm install -g $tool.Npm
    }
  }
}

$MissingRequired = @($Results | Where-Object { $_.required -and -not $_.installed })
$Report = [ordered]@{
  module = "N_PROVIDER.1"
  generated_at = (Get-Date).ToString("o")
  install_mode = [bool]$Install
  report_only = [bool]$ReportOnly
  passed = ($MissingRequired.Count -eq 0)
  missing_required = $MissingRequired
  tools = $Results
  safety = [ordered]@{
    secrets_printed = $false
    optional_tools_may_remain_missing = $true
    unsafe_providers_enabled = $false
  }
}

$ReportPath = Join-Path $ReportDir "windows-tool-health-report.json"
$Report | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $ReportPath
Write-Host "N_PROVIDER.1 Windows tool report written: $ReportPath" -ForegroundColor Green
if ($MissingRequired.Count -gt 0) { exit 2 }
