#requires -Version 5.1
<#
ORACLE.3 - Prepare-OracleFreeWorkspace.ps1
Prepares a safe local Oracle Free / Oracle Lite workspace for Kingsmen.
This script does not create cloud resources, does not store credentials, and does not deploy production.
Writes reports/oracle/oracle-free-workspace-report.json.
#>
[CmdletBinding()]
param(
  [string]$Root = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-KingsmenRoot {
  param([string]$ProvidedRoot)
  if (-not [string]::IsNullOrWhiteSpace($ProvidedRoot)) {
    $resolved = Resolve-Path -Path $ProvidedRoot -ErrorAction SilentlyContinue
    if ($resolved) { return $resolved.Path }
  }
  $current = Get-Location
  while ($null -ne $current) {
    if (Test-Path (Join-Path $current.Path '.git') -PathType Container) { return $current.Path }
    if (Test-Path (Join-Path $current.Path 'package.json')) { return $current.Path }
    $parent = Split-Path -Parent $current.Path
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current.Path) { break }
    $current = Get-Item $parent
  }
  return (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
}

$script:RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
Set-Location $script:RepoRoot
$script:Checks = @()
$script:Created = @()
$script:GeneratedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$script:ReportDir = Join-Path $script:RepoRoot 'reports/oracle'
$script:ReportPath = Join-Path $script:ReportDir 'oracle-free-workspace-report.json'

function Add-KmCheck {
  param([string]$Name, [object]$Passed, [string]$Detail = '', [string]$Path = '')
  $safePassed = $false
  try { $safePassed = [System.Convert]::ToBoolean($Passed) } catch { $safePassed = $false }
  $script:Checks += [pscustomobject]@{ name = $Name; passed = $safePassed; detail = $Detail; path = $Path }
}

function Ensure-KmDirectory {
  param([string]$RelativePath)
  $full = Join-Path $script:RepoRoot $RelativePath
  if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $full | Out-Null }
  $ok = if ($DryRun) { $true } else { Test-Path $full -PathType Container }
  Add-KmCheck -Name ('directory:{0}' -f $RelativePath) -Passed $ok -Detail $(if ($DryRun) { 'dry-run' } elseif ($ok) { 'ready' } else { 'missing' }) -Path $RelativePath
  if ($ok) { $script:Created += [pscustomobject]@{ type = 'directory'; path = $RelativePath } }
}

function Write-KmTextFile {
  param([string]$RelativePath, [string]$Content)
  $full = Join-Path $script:RepoRoot $RelativePath
  $parent = Split-Path -Parent $full
  if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    [System.IO.File]::WriteAllText($full, $Content, [System.Text.Encoding]::UTF8)
  }
  $ok = if ($DryRun) { $true } else { Test-Path $full -PathType Leaf }
  Add-KmCheck -Name ('file:{0}' -f $RelativePath) -Passed $ok -Detail $(if ($DryRun) { 'dry-run' } elseif ($ok) { 'written' } else { 'missing' }) -Path $RelativePath
  if ($ok) { $script:Created += [pscustomobject]@{ type = 'file'; path = $RelativePath } }
}

function Write-KmJsonFile {
  param([string]$RelativePath, [object]$Data)
  $json = $Data | ConvertTo-Json -Depth 24
  Write-KmTextFile -RelativePath $RelativePath -Content $json
}

function Test-KmRequiredFile {
  param([string]$RelativePath, [string]$Label)
  $full = Join-Path $script:RepoRoot $RelativePath
  $ok = Test-Path $full -PathType Leaf
  Add-KmCheck -Name ('required-file:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { 'found' } else { 'missing' }) -Path $RelativePath
}

function Get-KmGitHash {
  try {
    $hash = (& git rev-parse --short HEAD 2>$null)
    if ([string]::IsNullOrWhiteSpace($hash)) { return '' }
    return $hash.Trim()
  } catch { return '' }
}

try {
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/oracle-free-bootstrap-plan.json' -Label 'oracle-plan'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-bootstrap-report.json' -Label 'oracle-bootstrap-report'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'
  Test-KmRequiredFile -RelativePath 'reports/openclaw/openclaw-safety-report.json' -Label 'openclaw-safety-report'

  $directories = @(
    'kingsmen/oracle',
    'kingsmen/oracle/workspace',
    'kingsmen/oracle/masked-reports',
    'kingsmen/oracle/checklists',
    'kingsmen/oracle/action-packets',
    'kingsmen/oracle/runtime-notes',
    'kingsmen/oracle/cost-guard',
    'kingsmen/oracle/security',
    'docs/oracle',
    'reports/oracle',
    'scripts/oracle'
  )

  foreach ($directory in $directories) { Ensure-KmDirectory -RelativePath $directory }

  $workspaceConfig = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    name = 'Kingsmen Oracle Free Workspace'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    repoRoot = $script:RepoRoot
    oracleLiteFirst = $true
    dockerComposeFirst = $true
    noCloudResourcesCreated = $true
    noCredentialsStored = $true
    noPaidResourcesAllowedByDefault = $true
    founderApprovalRequiredForPaidResources = $true
    candidateSafetyWins = $true
    openClawPausesIfCompeting = $true
    workspace = [ordered]@{
      root = 'kingsmen/oracle'
      maskedReports = 'kingsmen/oracle/masked-reports'
      checklists = 'kingsmen/oracle/checklists'
      actionPackets = 'kingsmen/oracle/action-packets'
      runtimeNotes = 'kingsmen/oracle/runtime-notes'
      costGuard = 'kingsmen/oracle/cost-guard'
      security = 'kingsmen/oracle/security'
      reports = 'reports/oracle'
    }
    nextTrackerRow = 'ORACLE.4 - scripts/validators/validate-oracle-workspace.mjs'
  }

  $founderChecklist = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    productionReady = $false
    title = 'Founder Oracle Free Signup and VM Checklist'
    officialUrl = 'https://www.oracle.com/cloud/free/'
    rules = @(
      'Use only Oracle official signup and console pages.',
      'Do not place credentials or sensitive values in Git.',
      'Do not create paid resources without explicit founder approval.',
      'Choose a free eligible compute option only when the account region confirms availability.',
      'Keep PostgreSQL and Redis private.',
      'Use HTTP and HTTPS public ingress only when the runtime is ready.',
      'Run validators before claiming any Oracle readiness.',
      'Keep productionReady false until local run, provider health, security audit, and interaction proof pass.'
    )
    evidenceToCaptureMasked = @(
      'tenancy region name',
      'compartment name',
      'VCN name',
      'subnet name',
      'VM display name',
      'public IP if assigned',
      'OS image family',
      'shape family',
      'boot volume size',
      'firewall policy summary'
    )
  }

  $costGuard = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    productionReady = $false
    paidResourcesDefault = $false
    stopIfEstimatedMonthlyCostAboveZar = 0
    founderApprovalRequiredForAnyPaidChange = $true
    allowedNow = @(
      'planning files',
      'local validators',
      'masked reports',
      'Oracle Free account confirmation by founder',
      'free eligible VM planning'
    )
    blockedNow = @(
      'paid compute',
      'paid database service',
      'paid storage expansion',
      'paid load balancer beyond allowed free limits',
      'production traffic',
      'real candidate document storage'
    )
  }

  $securityChecklist = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    productionReady = $false
    required = @(
      'Founder MFA enabled',
      'No sensitive values in Git',
      'PostgreSQL private only',
      'Redis private only',
      'Admin access restricted',
      'Firewall reviewed',
      'Provider health report passed',
      'OpenClaw safety report passed',
      'Oracle bootstrap report passed'
    )
    futureReports = @(
      'reports/oracle/oracle-lite-capacity-report.json',
      'reports/oracle/oracle-security-report.json',
      'reports/oracle/oracle-cost-guard-report.json'
    )
  }

  $readme = @'
# Kingsmen Oracle Free Workspace

This workspace prepares Kingsmen for Oracle Cloud Free Tier / Oracle Lite deployment planning.

It does not create cloud resources, does not store credentials, does not deploy production, and does not mark Kingsmen production-ready.

Founder sequence:

1. Confirm or create the Oracle Cloud Free account through Oracle's official page.
2. Pick an available region.
3. Confirm what Always Free resources are available in that account and region.
4. Create a free-eligible VM only after confirming the shape and cost boundary.
5. Keep Kingsmen core first. OpenClaw must pause if it competes with candidate runtime.
6. Run validators before claiming readiness.

Hard rules:

- No sensitive values in Git.
- No paid resource without founder approval.
- No production candidate traffic yet.
- No real candidate documents before storage, RLS, signed upload, and audit gates pass.
'@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/workspace/oracle-workspace-config.json' -Data $workspaceConfig
  Write-KmJsonFile -RelativePath 'kingsmen/oracle/checklists/founder-oracle-free-checklist.json' -Data $founderChecklist
  Write-KmJsonFile -RelativePath 'kingsmen/oracle/cost-guard/oracle-cost-guard.json' -Data $costGuard
  Write-KmJsonFile -RelativePath 'kingsmen/oracle/security/oracle-security-checklist.json' -Data $securityChecklist
  Write-KmTextFile -RelativePath 'docs/oracle/README.md' -Content $readme

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    script = 'scripts/oracle/Prepare-OracleFreeWorkspace.ps1'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    repoRoot = $script:RepoRoot
    dryRun = [bool]$DryRun
    passed = $passed
    totalChecks = @($script:Checks).Count
    failedChecks = @($failed).Count
    created = @($script:Created)
    failed = @($failed)
    checks = @($script:Checks)
    nextTrackerRow = $(if ($passed) { 'ORACLE.4 - scripts/validators/validate-oracle-workspace.mjs' } else { 'ORACLE.3 repair - fix failed checks in reports/oracle/oracle-free-workspace-report.json' })
  }

  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report | ConvertTo-Json -Depth 24 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 24
  if ($passed) { exit 0 }
  exit 1
} catch {
  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.3'
    script = 'scripts/oracle/Prepare-OracleFreeWorkspace.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-workspace:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Prepare-OracleFreeWorkspace.ps1' })
    nextTrackerRow = 'ORACLE.3 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
