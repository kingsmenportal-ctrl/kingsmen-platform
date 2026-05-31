#requires -Version 5.1
<#
ORACLE.15 - Prepare-OracleRuntimeInstallPlan.ps1
Creates a founder-facing Oracle Lite runtime install plan after ORACLE.14 validates the first-login checklist.
This script writes planning artifacts only. It does not connect to a server, install packages, create cloud resources, store credentials, or deploy production.
Writes reports/oracle/oracle-runtime-install-plan-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-runtime-install-plan-report.json'

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
  $json = $Data | ConvertTo-Json -Depth 30
  Write-KmTextFile -RelativePath $RelativePath -Content $json
}

function Read-KmJson {
  param([string]$RelativePath)
  $full = Join-Path $script:RepoRoot $RelativePath
  if (-not (Test-Path $full -PathType Leaf)) { return $null }
  try {
    $raw = Get-Content -Path $full -Raw
    $raw = $raw.TrimStart([char]0xFEFF)
    return ($raw | ConvertFrom-Json)
  } catch { return $null }
}

function Test-KmRequiredFile {
  param([string]$RelativePath, [string]$Label)
  $full = Join-Path $script:RepoRoot $RelativePath
  $ok = Test-Path $full -PathType Leaf
  Add-KmCheck -Name ('required-file:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { 'found' } else { 'missing' }) -Path $RelativePath
}

function Test-KmPassedReport {
  param([string]$RelativePath, [string]$Label)
  $json = Read-KmJson -RelativePath $RelativePath
  $parsed = $null -ne $json
  Add-KmCheck -Name ('report:{0}:json' -f $Label) -Passed $parsed -Detail $(if ($parsed) { 'parsed' } else { 'missing or invalid json' }) -Path $RelativePath
  if (-not $parsed) { return $null }
  Add-KmCheck -Name ('report:{0}:passed' -f $Label) -Passed ($json.passed -eq $true) -Detail ('passed={0}' -f $json.passed) -Path $RelativePath
  Add-KmCheck -Name ('report:{0}:failedChecksZero' -f $Label) -Passed ([int]$json.failedChecks -eq 0) -Detail ('failedChecks={0}' -f $json.failedChecks) -Path $RelativePath
  Add-KmCheck -Name ('report:{0}:productionReadyFalse' -f $Label) -Passed ($json.productionReady -eq $false) -Detail ('productionReady={0}' -f $json.productionReady) -Path $RelativePath
  return $json
}

function Get-KmGitHash {
  try {
    $hash = (& git rev-parse --short HEAD 2>$null)
    if ([string]::IsNullOrWhiteSpace($hash)) { return '' }
    return $hash.Trim()
  } catch { return '' }
}

try {
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-first-login-checklist-validation-report.json' -Label 'oracle-first-login-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-first-login-checklist-report.json' -Label 'oracle-first-login-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json' -Label 'oracle-first-login-checklist'
  Test-KmRequiredFile -RelativePath 'docs/oracle/oracle-first-login-checklist.md' -Label 'oracle-first-login-checklist-md'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json' -Label 'oracle-vm-bootstrap-plan'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle14 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-first-login-checklist-validation-report.json' -Label 'oracle-first-login-validation'
  $oracle13 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-first-login-checklist-report.json' -Label 'oracle-first-login-checklist'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/install'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/health'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/logs'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/security'
  Ensure-KmDirectory -RelativePath 'docs/oracle'
  Ensure-KmDirectory -RelativePath 'reports/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $runtimePlan = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.15'
    name = 'Kingsmen Oracle Lite Runtime Install Plan'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Prepare a safe, low-concurrency runtime install plan for the future Oracle Lite VM without installing anything from this local script.'
    proofInput = [ordered]@{
      oracleFirstLoginValidationPassed = ($oracle14 -ne $null -and $oracle14.passed -eq $true)
      oracleFirstLoginChecklistPassed = ($oracle13 -ne $null -and $oracle13.passed -eq $true)
      gitHeadHash = $gitHash
    }
    installPhases = @(
      [ordered]@{ order = 1; phase = 'base-system'; action = 'Update OS package metadata and install essential utilities later on the VM only.'; evidence = 'masked package manager summary'; blocker = 'No package install from this local script.' },
      [ordered]@{ order = 2; phase = 'git-node'; action = 'Install Git and Node runtime for validator execution.'; evidence = 'git --version and node --version outputs'; blocker = 'No secrets or tokens in shell history.' },
      [ordered]@{ order = 3; phase = 'docker-compose'; action = 'Install Docker engine and Compose plugin for Oracle Lite Docker Compose first runtime.'; evidence = 'docker version and docker compose version outputs'; blocker = 'No privileged runtime beyond required Docker administration.' },
      [ordered]@{ order = 4; phase = 'nginx-firewall'; action = 'Prepare Nginx reverse proxy and firewall baseline.'; evidence = 'masked firewall summary and Nginx version'; blocker = 'No public PostgreSQL, no public Redis, no broad admin exposure.' },
      [ordered]@{ order = 5; phase = 'repo-clone'; action = 'Clone Kingsmen repo after runtime tools are ready.'; evidence = 'repo path and git commit hash'; blocker = 'No raw secrets in repo or reports.' },
      [ordered]@{ order = 6; phase = 'validator-chain'; action = 'Run validators before claiming readiness.'; evidence = 'report paths and pass/fail summaries'; blocker = 'No production claim while productionReady remains false.' }
    )
    runtimeDefaults = [ordered]@{
      deployTarget = 'oracle_lite'
      activeCandidateCap = 500
      lowConcurrencyMode = $true
      workerConcurrency = 2
      playwrightMaxConcurrency = 1
      airtableMirrorIntervalMinutes = 15
      openClawPausesIfCompeting = $true
      postgresPublic = $false
      redisPublic = $false
      dockerComposeFirst = $true
    }
    serviceOrder = @('nginx', 'web', 'backend-api', 'postgresql-private', 'redis-private', 'thin-workers', 'validators')
    healthChecksPlanned = @('disk space', 'memory pressure', 'docker status', 'compose config', 'postgres private binding', 'redis private binding', 'nginx config', 'node validator run', 'log pruning')
    blockedUntilLaterGates = @('production candidate traffic', 'real payment runtime', 'real email sending at scale', 'real candidate document storage', 'public database access', 'public redis access', 'paid resource expansion')
    safetyBoundaries = [ordered]@{
      noServerConnectionByThisScript = $true
      noRuntimeInstallByThisScript = $true
      noCloudResourcesCreatedByThisScript = $true
      noCredentialMaterialStoredByThisScript = $true
      noProductionDeployByThisScript = $true
      noPaidResourceChangeByThisScript = $true
      postgresRedisPrivate = $true
      candidateSafetyWins = $true
      productionReady = $false
    }
    nextTrackerRow = 'ORACLE.16 - scripts/validators/validate-oracle-runtime-install-plan.mjs'
  }

  $markdown = @"
# Kingsmen Oracle Lite Runtime Install Plan

Generated: $script:GeneratedAt
Production ready: false

This is a planning artifact only. It does not connect to Oracle, install packages, create resources, store credentials, or deploy production.

## Runtime install order

1. Base system update and essential utilities.
2. Git and Node for validator execution.
3. Docker engine and Docker Compose plugin.
4. Nginx reverse proxy and firewall baseline.
5. Kingsmen repo clone.
6. Validator chain before any readiness claim.

## Oracle Lite runtime defaults

- Active candidate cap: 500.
- Low-concurrency mode remains enabled.
- Worker concurrency starts at 2.
- Playwright max concurrency starts at 1.
- PostgreSQL and Redis remain private.
- Docker Compose first.
- OpenClaw pauses if it competes with Kingsmen core.

## Hard boundaries

- No production candidate traffic yet.
- No real candidate documents yet.
- No public PostgreSQL or Redis.
- No paid resource expansion without founder approval.
- productionReady remains false.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json' -Data $runtimePlan
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-runtime-install-plan.md' -Content $markdown

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.15'
    script = 'scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.16 - scripts/validators/validate-oracle-runtime-install-plan.mjs' } else { 'ORACLE.15 repair - fix failed checks in reports/oracle/oracle-runtime-install-plan-report.json' })
  }

  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report | ConvertTo-Json -Depth 30 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 30
  if ($passed) { exit 0 }
  exit 1
} catch {
  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.15'
    script = 'scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-runtime-install-plan:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1' })
    nextTrackerRow = 'ORACLE.15 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
