#requires -Version 5.1
<#
ORACLE.7 - Write-OracleFounderActionPacket.ps1
Creates a founder-facing Oracle Free / Oracle Lite action packet from validated proof reports.
This script does not create cloud resources, does not store credentials, and does not deploy production.
Writes reports/oracle/oracle-founder-action-packet-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-founder-action-packet-report.json'

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
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-prerequisites-validation-report.json' -Label 'oracle-prerequisites-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-prerequisites-report.json' -Label 'oracle-prerequisites'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-bootstrap-report.json' -Label 'oracle-bootstrap'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-workspace-report.json' -Label 'oracle-workspace'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-workspace-validation-report.json' -Label 'oracle-workspace-validation'
  Test-KmRequiredFile -RelativePath 'reports/openclaw/openclaw-safety-report.json' -Label 'openclaw-safety'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/oracle-free-bootstrap-plan.json' -Label 'oracle-plan'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/checklists/founder-oracle-free-checklist.json' -Label 'founder-checklist'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/cost-guard/oracle-cost-guard.json' -Label 'cost-guard'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/security/oracle-security-checklist.json' -Label 'security-checklist'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle6 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-prerequisites-validation-report.json' -Label 'oracle-prerequisites-validation'
  $oracle5 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-free-prerequisites-report.json' -Label 'oracle-prerequisites'
  $oracle4 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-workspace-validation-report.json' -Label 'oracle-workspace-validation'
  $openclaw = Test-KmPassedReport -RelativePath 'reports/openclaw/openclaw-safety-report.json' -Label 'openclaw-safety'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/action-packets'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/runtime-notes'
  Ensure-KmDirectory -RelativePath 'reports/oracle'
  Ensure-KmDirectory -RelativePath 'docs/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $actionPacket = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.7'
    name = 'Founder Oracle Free Action Packet'
    status = 'written_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Give the founder a safe, step-by-step Oracle Free / Oracle Lite action packet after ORACLE.6 validated the prerequisite chain.'
    currentProof = [ordered]@{
      oraclePrerequisitesValidationPassed = ($oracle6 -ne $null -and $oracle6.passed -eq $true)
      oraclePrerequisitesPassed = ($oracle5 -ne $null -and $oracle5.passed -eq $true)
      oracleWorkspaceValidationPassed = ($oracle4 -ne $null -and $oracle4.passed -eq $true)
      openClawSafetyPassed = ($openclaw -ne $null -and $openclaw.passed -eq $true)
      productionReady = $false
      gitHeadHash = $gitHash
    }
    founderActions = @(
      [ordered]@{
        order = 1
        title = 'Confirm Oracle account boundary'
        owner = 'Founder'
        action = 'Use Oracle official Free Tier signup or console only. Confirm account, region, free-resource availability, and MFA.'
        proofToCapture = 'Record only non-sensitive details: tenancy region, compartment name, selected free-eligible shape family, and MFA enabled yes/no.'
        blocked = 'Do not paste passwords, private keys, card details, tokens, tenancy OCIDs, or secret values into Git or chat.'
      },
      [ordered]@{
        order = 2
        title = 'Choose region and compartment'
        owner = 'Founder'
        action = 'Choose the nearest available OCI commercial region with free capacity. Create or identify a Kingsmen compartment.'
        proofToCapture = 'Masked region and compartment names only.'
        blocked = 'Do not claim capacity until Oracle console confirms it for the account and region.'
      },
      [ordered]@{
        order = 3
        title = 'Prepare free-eligible VM plan'
        owner = 'Founder approval required'
        action = 'Plan one Oracle Lite host for backend, web, PostgreSQL, Redis, Nginx, and validators using low concurrency.'
        proofToCapture = 'Shape family, OS image family, intended boot volume, and public IP presence if assigned.'
        blocked = 'No paid shape, paid database, paid storage increase, or paid network change without explicit founder approval.'
      },
      [ordered]@{
        order = 4
        title = 'Keep Kingsmen core first'
        owner = 'Founder / PowerShell Creator'
        action = 'Prioritize candidate runtime and repo validation. Pause OpenClaw if it competes for Oracle Lite CPU, RAM, disk, or queue capacity.'
        proofToCapture = 'Capacity note and any paused helper process note.'
        blocked = 'OpenClaw must not become business brain, production deployer, or candidate runtime authority.'
      },
      [ordered]@{
        order = 5
        title = 'Run future Oracle prerequisite installs'
        owner = 'Future ORACLE.8+ scripts'
        action = 'Install Docker, Git, Node, Nginx, firewall rules, log pruning, and clone repo only after the VM exists.'
        proofToCapture = 'Masked install and health reports.'
        blocked = 'No production candidate traffic until full local run, provider health, security audit, and interaction proof pass.'
      }
    )
    commandPlan = [ordered]@{
      localNextValidation = 'node scripts/validators/validate-oracle-action-packet.mjs'
      laterCloudCommandsRequireFounderApproval = @(
        'create OCI VM',
        'open public ingress',
        'attach or expand storage',
        'configure production domain',
        'enable real email/payment providers'
      )
      safeNow = @(
        'read reports',
        'validate reports',
        'prepare masked checklist',
        'draft founder action packet',
        'keep productionReady false'
      )
    }
    safetyBoundaries = [ordered]@{
      noCloudResourcesCreatedByThisScript = $true
      noCredentialsStoredByThisScript = $true
      noProductionDeployByThisScript = $true
      noPaidResourceChangeByThisScript = $true
      productionReady = $false
      oracleLiteFirst = $true
      dockerComposeFirst = $true
      candidateSafetyWins = $true
    }
    nextTrackerRow = 'ORACLE.8 - scripts/validators/validate-oracle-action-packet.mjs'
  }

  $markdown = @"
# Kingsmen Oracle Free Founder Action Packet

Generated: $script:GeneratedAt
Production ready: false

## Proof status

- ORACLE.6 prerequisites validation: $($actionPacket.currentProof.oraclePrerequisitesValidationPassed)
- ORACLE.5 prerequisites: $($actionPacket.currentProof.oraclePrerequisitesPassed)
- ORACLE.4 workspace validation: $($actionPacket.currentProof.oracleWorkspaceValidationPassed)
- OPENCLAW.3 safety: $($actionPacket.currentProof.openClawSafetyPassed)
- Git head: $gitHash

## Founder actions

1. Confirm Oracle Free account and MFA through Oracle official pages only.
2. Choose region and compartment, recording only masked/non-sensitive details.
3. Plan the free-eligible Oracle Lite VM without paid resources.
4. Keep Kingsmen core first; pause OpenClaw if it competes for capacity.
5. Use future scripts for VM setup only after founder approval and verified free boundary.

## Hard boundaries

- No secrets in Git.
- No paid resources without founder approval.
- No production candidate traffic yet.
- No real candidate documents before N03/N05/RLS/signed-upload/audit gates pass.
- PostgreSQL and Redis must remain private.
- OpenClaw is a governed helper only.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/action-packets/oracle-founder-action-packet.json' -Data $actionPacket
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-founder-action-packet.md' -Content $markdown

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.7'
    script = 'scripts/oracle/Write-OracleFounderActionPacket.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.8 - scripts/validators/validate-oracle-action-packet.mjs' } else { 'ORACLE.7 repair - fix failed checks in reports/oracle/oracle-founder-action-packet-report.json' })
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
    submodule = 'ORACLE.7'
    script = 'scripts/oracle/Write-OracleFounderActionPacket.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-founder-action-packet:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Write-OracleFounderActionPacket.ps1' })
    nextTrackerRow = 'ORACLE.7 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
