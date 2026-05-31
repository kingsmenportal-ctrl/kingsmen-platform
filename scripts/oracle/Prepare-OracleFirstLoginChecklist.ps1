#requires -Version 5.1
<#
ORACLE.13 - Prepare-OracleFirstLoginChecklist.ps1
Creates a founder-facing first-login checklist for the future Oracle Free / Oracle Lite VM.
This script writes planning artifacts only. It does not connect to a server, create cloud resources, store credentials, or deploy production.
Writes reports/oracle/oracle-first-login-checklist-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-first-login-checklist-report.json'

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
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-access-guide-validation-report.json' -Label 'oracle-access-guide-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-ssh-bootstrap-guide-report.json' -Label 'oracle-ssh-bootstrap-guide-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/security/oracle-ssh-bootstrap-guide.json' -Label 'oracle-ssh-bootstrap-guide'
  Test-KmRequiredFile -RelativePath 'docs/oracle/oracle-ssh-bootstrap-guide.md' -Label 'oracle-ssh-bootstrap-guide-md'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-vm-bootstrap-plan-validation-report.json' -Label 'oracle-vm-bootstrap-plan-validation'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json' -Label 'oracle-vm-bootstrap-plan'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle12 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-access-guide-validation-report.json' -Label 'oracle-access-guide-validation'
  $oracle11 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-ssh-bootstrap-guide-report.json' -Label 'oracle-ssh-bootstrap-guide'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/first-login'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/network'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/security'
  Ensure-KmDirectory -RelativePath 'docs/oracle'
  Ensure-KmDirectory -RelativePath 'reports/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $checklist = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.13'
    name = 'Kingsmen Oracle First Login Checklist'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Prepare the founder first-login checklist for a future Oracle Lite VM without connecting to infrastructure or storing sensitive values.'
    proofInput = [ordered]@{
      oracleAccessGuideValidationPassed = ($oracle12 -ne $null -and $oracle12.passed -eq $true)
      oracleSshGuideReportPassed = ($oracle11 -ne $null -and $oracle11.passed -eq $true)
      gitHeadHash = $gitHash
    }
    firstLoginChecklist = @(
      [ordered]@{ order = 1; title = 'Confirm VM identity'; evidence = 'Record masked VM display name, region, and public IP presence only.'; blocker = 'Do not record tenancy identifiers, secrets, or private access material.' },
      [ordered]@{ order = 2; title = 'Confirm host fingerprint'; evidence = 'Record masked host fingerprint and timestamp.'; blocker = 'Stop if the host fingerprint unexpectedly changes.' },
      [ordered]@{ order = 3; title = 'Confirm base user and privilege path'; evidence = 'Record masked admin username category and whether least-privilege escalation is available.'; blocker = 'No shared operator identity at this stage.' },
      [ordered]@{ order = 4; title = 'Confirm firewall baseline'; evidence = 'Record whether only required admin/web ports are planned.'; blocker = 'No public PostgreSQL, no public Redis, no broad admin exposure.' },
      [ordered]@{ order = 5; title = 'Confirm runtime prerequisites will be installed later'; evidence = 'Record planned Git, Node, Docker, Compose, Nginx, and log-pruning checks.'; blocker = 'No production traffic or real candidate documents before later gates pass.' },
      [ordered]@{ order = 6; title = 'Run validator chain before readiness claim'; evidence = 'Record local report paths only.'; blocker = 'No production-ready claim while productionReady remains false.' }
    )
    allowedEvidence = @('masked VM display name', 'masked region', 'public IP present yes/no', 'host fingerprint hash only', 'admin username category', 'firewall summary', 'validator report path')
    blockedEvidence = @('passwords', 'tokens', 'service role keys', 'database passwords', 'raw private access material', 'full tenancy identifiers', 'candidate documents')
    safetyBoundaries = [ordered]@{
      noCloudResourcesCreatedByThisScript = $true
      noServerConnectionByThisScript = $true
      noCredentialMaterialStoredByThisScript = $true
      noProductionDeployByThisScript = $true
      noPaidResourceChangeByThisScript = $true
      postgresRedisPrivate = $true
      candidateSafetyWins = $true
      productionReady = $false
    }
    nextTrackerRow = 'ORACLE.14 - scripts/validators/validate-oracle-first-login-checklist.mjs'
  }

  $markdown = @"
# Kingsmen Oracle First Login Checklist

Generated: $script:GeneratedAt
Production ready: false

This is a checklist only. It does not connect to Oracle, create resources, store credentials, or deploy production.

## First-login sequence

1. Confirm VM identity with masked evidence only.
2. Confirm host fingerprint before trusting the connection.
3. Confirm least-privilege admin path.
4. Confirm firewall baseline.
5. Confirm Git, Node, Docker, Compose, Nginx, and log-pruning will be installed only in later approved scripts.
6. Run validators before any readiness claim.

## Hard boundaries

- No secrets in Git or reports.
- No production candidate traffic yet.
- No real candidate documents yet.
- PostgreSQL and Redis stay private.
- productionReady remains false.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json' -Data $checklist
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-first-login-checklist.md' -Content $markdown

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.13'
    script = 'scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.14 - scripts/validators/validate-oracle-first-login-checklist.mjs' } else { 'ORACLE.13 repair - fix failed checks in reports/oracle/oracle-first-login-checklist-report.json' })
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
    submodule = 'ORACLE.13'
    script = 'scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-first-login-checklist:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1' })
    nextTrackerRow = 'ORACLE.13 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
