# N_PROVIDER.2 — Creator-facing provider command wrapper
param(
  [Parameter(Position = 0)]
  [ValidateSet('provider:check','provider:doctor','provider:report','provider:install')]
  [string]$Command = 'provider:check',

  [switch]$Install
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$Provider1 = Join-Path $Root 'n-provider-1'
$ReportDir = Join-Path $Root 'reports/provider'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

function Invoke-NodeValidator {
  param([string]$ScriptName)
  $script = Join-Path $Provider1 $ScriptName
  if (-not (Test-Path $script)) { throw "Missing validator: $script" }
  & node $script
  if ($LASTEXITCODE -ne 0) { throw "Validator failed: $ScriptName exit=$LASTEXITCODE" }
}

function Invoke-WindowsInstaller {
  param([switch]$DoInstall)
  $script = Join-Path $Provider1 'install-windows-tools.ps1'
  if (-not (Test-Path $script)) { throw "Missing installer: $script" }
  if ($DoInstall) {
    powershell -ExecutionPolicy Bypass -File $script -Install
  } else {
    powershell -ExecutionPolicy Bypass -File $script -ReportOnly
  }
  if ($LASTEXITCODE -ne 0) { throw "Windows tool installer/check failed exit=$LASTEXITCODE" }
}

$started = Get-Date
$result = [ordered]@{
  module = 'N_PROVIDER.2'
  command = $Command
  generated_at = $started.ToString('o')
  passed = $false
  actions = @()
  safety = [ordered]@{
    no_raw_secrets_printed = $true
    optional_providers_enabled = $false
    airtable_authority = $false
    whatsapp_bulk_enabled = $false
    sms_primary_enabled = $false
    payment_live_mode_enabled = $false
  }
}

try {
  switch ($Command) {
    'provider:check' {
      Invoke-NodeValidator 'validate-provider-registry.mjs'
      $result.actions += 'provider_registry_validated'
    }
    'provider:doctor' {
      Invoke-NodeValidator 'validate-provider-registry.mjs'
      Invoke-NodeValidator 'validate-local-tools.mjs'
      $result.actions += 'provider_registry_validated'
      $result.actions += 'local_tools_validated'
    }
    'provider:report' {
      Invoke-WindowsInstaller
      Invoke-NodeValidator 'validate-provider-registry.mjs'
      Invoke-NodeValidator 'validate-local-tools.mjs'
      $result.actions += 'windows_tool_report_generated'
      $result.actions += 'provider_registry_validated'
      $result.actions += 'local_tools_validated'
    }
    'provider:install' {
      Invoke-WindowsInstaller -DoInstall:$Install
      Invoke-NodeValidator 'validate-provider-registry.mjs'
      Invoke-NodeValidator 'validate-local-tools.mjs'
      $result.actions += 'windows_installer_invoked'
      $result.actions += 'provider_registry_validated'
      $result.actions += 'local_tools_validated'
    }
  }
  $result.passed = $true
} catch {
  $result.passed = $false
  $result.error = $_.Exception.Message
}

$result.completed_at = (Get-Date).ToString('o')
$reportPath = Join-Path $ReportDir 'provider-command-report.json'
$result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $reportPath
Write-Host "N_PROVIDER.2 command report written: $reportPath" -ForegroundColor Green
if (-not $result.passed) { exit 1 }
