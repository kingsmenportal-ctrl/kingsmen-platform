#requires -Version 5.1
<#
ORACLE.9 - Prepare-OracleVmBootstrapPlan.ps1
Builds a safe Oracle Free / Oracle Lite VM bootstrap plan after ORACLE.8 validates the founder action packet.
This script creates planning artifacts only. It does not create OCI resources, store sensitive values, or deploy production.
Writes reports/oracle/oracle-vm-bootstrap-plan-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-vm-bootstrap-plan-report.json'

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

function Test-KmRequiredFile {
  param([string]$RelativePath, [string]$Label)
  $full = Join-Path $script:RepoRoot $RelativePath
  $ok = Test-Path $full -PathType Leaf
  Add-KmCheck -Name ('required-file:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { 'found' } else { 'missing' }) -Path $RelativePath
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
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-action-packet-validation-report.json' -Label 'oracle-action-packet-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-founder-action-packet-report.json' -Label 'oracle-founder-action-packet-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/action-packets/oracle-founder-action-packet.json' -Label 'oracle-founder-action-packet'
  Test-KmRequiredFile -RelativePath 'docs/oracle/oracle-founder-action-packet.md' -Label 'oracle-founder-action-packet-md'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/oracle-free-bootstrap-plan.json' -Label 'oracle-free-bootstrap-plan'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/cost-guard/oracle-cost-guard.json' -Label 'oracle-cost-guard'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/security/oracle-security-checklist.json' -Label 'oracle-security-checklist'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle8 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-action-packet-validation-report.json' -Label 'oracle-action-packet-validation'
  $oracle7 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-founder-action-packet-report.json' -Label 'oracle-founder-action-packet'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/checklists'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/network'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/security'
  Ensure-KmDirectory -RelativePath 'docs/oracle'
  Ensure-KmDirectory -RelativePath 'reports/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $vmPlan = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.9'
    name = 'Kingsmen Oracle Lite VM Bootstrap Plan'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Prepare a founder-approved VM bootstrap plan for Oracle Free / Oracle Lite without creating cloud resources or storing sensitive values.'
    proofInput = [ordered]@{
      oracleActionPacketValidationPassed = ($oracle8 -ne $null -and $oracle8.passed -eq $true)
      oracleFounderActionPacketPassed = ($oracle7 -ne $null -and $oracle7.passed -eq $true)
      gitHeadHash = $gitHash
    }
    vmIntent = [ordered]@{
      deploymentTarget = 'oracle_lite'
      operatingModel = 'single-founder low-concurrency Docker Compose host'
      preferredShapeFamily = 'Ampere A1 where available on founder tenancy and region'
      operatingSystem = 'Ubuntu LTS or Oracle Linux compatible with Docker Compose'
      capacityDoctrine = '500 active candidate cap, 1000-ready baseline, 5000-preparation path, features not removed by cap'
      noAssumedCapacity = $true
      founderMustConfirmRegionCapacity = $true
    }
    networkPlan = [ordered]@{
      publicIngress = @('80 after web readiness', '443 after TLS readiness')
      adminAccess = 'restricted founder administration only'
      privateServices = @('PostgreSQL', 'Redis', 'internal worker queues')
      databasePublicExposureAllowed = $false
      redisPublicExposureAllowed = $false
    }
    runtimePlan = [ordered]@{
      installOrder = @(
        'system update and base packages',
        'Git',
        'Node.js runtime for validators',
        'Docker engine',
        'Docker Compose plugin',
        'Nginx reverse proxy',
        'firewall baseline',
        'log pruning baseline',
        'repo clone',
        'validator run chain'
      )
      servicesPlanned = @('web app', 'backend API', 'PostgreSQL', 'Redis', 'Nginx', 'thin workers', 'validator reports')
      lowConcurrencyDefaults = [ordered]@{
        workerConcurrency = 2
        playwrightMaxConcurrency = 1
        airtableMirrorIntervalMinutes = 15
        openClawPausesIfCompeting = $true
      }
    }
    costAndSafety = [ordered]@{
      paidResourcesDefault = $false
      founderApprovalRequiredForAnyPaidChange = $true
      noCloudResourcesCreatedByThisScript = $true
      noCredentialMaterialStoredByThisScript = $true
      noProductionDeployByThisScript = $true
      noCandidateDocumentsBeforeStorageGates = $true
      candidateSafetyWins = $true
      productionReady = $false
    }
    maskedEvidenceToCollectLater = @(
      'region display name',
      'compartment display name',
      'VM display name',
      'shape family selected',
      'OS image family',
      'boot volume size',
      'public IP presence yes or no',
      'firewall summary',
      'Docker version',
      'Git version',
      'Node version',
      'validator pass summary'
    )
    blockedUntilFutureApproval = @(
      'production candidate traffic',
      'real payment runtime',
      'real bulk outreach',
      'real candidate document storage',
      'paid resource expansion',
      'public database access',
      'public Redis access'
    )
    nextTrackerRow = 'ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs'
  }

  $readme = @"
# Kingsmen Oracle Lite VM Bootstrap Plan

Generated: $script:GeneratedAt
Production ready: false

This is a planning artifact only. It does not create OCI resources, store sensitive values, or deploy production.

## Founder sequence

1. Confirm the Oracle Free account, region, and free capacity inside the Oracle console.
2. Prepare one low-concurrency Oracle Lite VM for Docker Compose.
3. Keep PostgreSQL and Redis private.
4. Open public web ingress only after web, TLS, and security checks pass.
5. Run the validator chain before claiming readiness.

## Runtime priority

Kingsmen core candidate runtime wins. OpenClaw pauses if it competes for CPU, RAM, disk, network, queue, or worker capacity.

## Hard boundaries

- No paid resource change without founder approval.
- No production candidate traffic yet.
- No real candidate documents before storage, signed upload, RLS, and audit gates pass.
- No public PostgreSQL or Redis.
- productionReady remains false.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json' -Data $vmPlan
  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/checklists/oracle-vm-founder-checklist.json' -Data ([ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.9'
    productionReady = $false
    checklist = $vmPlan.maskedEvidenceToCollectLater
    hardBoundaries = $vmPlan.blockedUntilFutureApproval
    nextTrackerRow = 'ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs'
  })
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-vm-bootstrap-plan.md' -Content $readme

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.9'
    script = 'scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.10 - scripts/validators/validate-oracle-vm-bootstrap-plan.mjs' } else { 'ORACLE.9 repair - fix failed checks in reports/oracle/oracle-vm-bootstrap-plan-report.json' })
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
    submodule = 'ORACLE.9'
    script = 'scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-vm-bootstrap-plan:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1' })
    nextTrackerRow = 'ORACLE.9 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
