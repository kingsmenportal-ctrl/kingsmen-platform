#requires -Version 5.1
<#
ORACLE.17 - Prepare-OracleFirewallPlan.ps1
Creates a founder-facing Oracle Lite firewall and ingress plan after ORACLE.16 validates the runtime install plan.
This script writes planning artifacts only. It does not connect to a server, change firewall rules, create cloud resources, store credentials, or deploy production.
Writes reports/oracle/oracle-firewall-plan-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-firewall-plan-report.json'

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
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-runtime-install-plan-validation-report.json' -Label 'oracle-runtime-install-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-runtime-install-plan-report.json' -Label 'oracle-runtime-install-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json' -Label 'oracle-runtime-install-plan'
  Test-KmRequiredFile -RelativePath 'docs/oracle/oracle-runtime-install-plan.md' -Label 'oracle-runtime-install-plan-md'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json' -Label 'oracle-vm-bootstrap-plan'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle16 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-runtime-install-plan-validation-report.json' -Label 'oracle-runtime-install-validation'
  $oracle15 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-runtime-install-plan-report.json' -Label 'oracle-runtime-install-plan'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/network'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/network/firewall'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/security'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime/health'
  Ensure-KmDirectory -RelativePath 'docs/oracle'
  Ensure-KmDirectory -RelativePath 'reports/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $firewallPlan = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.17'
    name = 'Kingsmen Oracle Lite Firewall Plan'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Prepare safe firewall, ingress, and private-service rules for the future Oracle Lite VM without applying any firewall changes from this local script.'
    proofInput = [ordered]@{
      oracleRuntimeInstallValidationPassed = ($oracle16 -ne $null -and $oracle16.passed -eq $true)
      oracleRuntimeInstallPlanPassed = ($oracle15 -ne $null -and $oracle15.passed -eq $true)
      gitHeadHash = $gitHash
    }
    ingressPolicy = [ordered]@{
      defaultInbound = 'deny'
      defaultOutbound = 'allow_required_updates_and_provider_calls_only'
      ssh = [ordered]@{ port = 22; exposure = 'founder_admin_only_restricted_source'; openAtStage = 'after SSH guide and first login proof'; publicToWorld = $false }
      http = [ordered]@{ port = 80; exposure = 'web_only_after_readiness'; openAtStage = 'after nginx and web health checks'; publicToWorld = $true }
      https = [ordered]@{ port = 443; exposure = 'web_tls_only_after_readiness'; openAtStage = 'after tls readiness'; publicToWorld = $true }
      postgres = [ordered]@{ port = 5432; exposure = 'private_internal_only'; publicToWorld = $false; mustRemainPrivate = $true }
      redis = [ordered]@{ port = 6379; exposure = 'private_internal_only'; publicToWorld = $false; mustRemainPrivate = $true }
      appInternal = [ordered]@{ exposure = 'docker_network_or_loopback_only'; publicToWorld = $false }
    }
    oracleCloudLayer = [ordered]@{
      securityListOrNsg = 'founder chooses Oracle security list or NSG during VM setup'
      sshSource = 'founder IP or founder-approved narrow range, never 0.0.0.0/0 by default'
      webSource = '0.0.0.0/0 only for 80 and 443 after readiness checks'
      databaseSource = 'private subnet or host-only only'
      redisSource = 'private subnet or host-only only'
      noPublicDatabaseRules = $true
      noPublicRedisRules = $true
    }
    hostFirewallLayer = [ordered]@{
      tool = 'ufw or equivalent OS firewall when available'
      defaultDenyIncoming = $true
      allowSshRestricted = $true
      allowHttpAfterReadiness = $true
      allowHttpsAfterTlsReadiness = $true
      denyPostgresPublic = $true
      denyRedisPublic = $true
      logDenied = $true
    }
    nginxLayer = [ordered]@{
      reverseProxyOnly = $true
      apiBehindNginx = $true
      webBehindNginx = $true
      rateLimitsPlanned = $true
      compressionPlanned = $true
      tlsRequiredBeforePublicCandidateTraffic = $true
    }
    safetyTestsPlanned = @(
      'confirm PostgreSQL is not publicly reachable',
      'confirm Redis is not publicly reachable',
      'confirm only planned web ports are public after readiness',
      'confirm SSH is restricted to founder-approved source',
      'confirm Docker internal services are not bound to public interfaces',
      'confirm Nginx config validates before reload',
      'confirm productionReady remains false until later gates pass'
    )
    blockedUntilLaterGates = @('production candidate traffic', 'real candidate document storage', 'payment runtime', 'bulk email sending', 'public database access', 'public redis access', 'paid load balancer or paid firewall expansion')
    safetyBoundaries = [ordered]@{
      noServerConnectionByThisScript = $true
      noFirewallChangeByThisScript = $true
      noCloudResourcesCreatedByThisScript = $true
      noCredentialMaterialStoredByThisScript = $true
      noProductionDeployByThisScript = $true
      noPaidResourceChangeByThisScript = $true
      postgresRedisPrivate = $true
      candidateSafetyWins = $true
      productionReady = $false
    }
    nextTrackerRow = 'ORACLE.18 - scripts/validators/validate-oracle-firewall-plan.mjs'
  }

  $markdown = @"
# Kingsmen Oracle Lite Firewall Plan

Generated: $script:GeneratedAt
Production ready: false

This is a planning artifact only. It does not connect to Oracle, change firewall rules, create resources, store credentials, or deploy production.

## Firewall model

1. Default inbound deny.
2. SSH is founder-admin-only and must be restricted to founder-approved source.
3. HTTP 80 opens only after web and Nginx readiness.
4. HTTPS 443 opens only after TLS readiness.
5. PostgreSQL 5432 remains private.
6. Redis 6379 remains private.
7. Docker internal services stay behind loopback, Docker network, or Nginx.

## Oracle Lite boundaries

- PostgreSQL and Redis must never be public.
- No production candidate traffic yet.
- No real candidate documents yet.
- No paid network resource expansion without founder approval.
- OpenClaw must not compete with Kingsmen core runtime.
- productionReady remains false.

## Future validation targets

- Confirm private database and Redis binding.
- Confirm Nginx config validates before reload.
- Confirm only required web ingress exists after readiness.
- Confirm SSH is not broadly exposed.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/network/firewall/oracle-firewall-plan.json' -Data $firewallPlan
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-firewall-plan.md' -Content $markdown

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.17'
    script = 'scripts/oracle/Prepare-OracleFirewallPlan.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.18 - scripts/validators/validate-oracle-firewall-plan.mjs' } else { 'ORACLE.17 repair - fix failed checks in reports/oracle/oracle-firewall-plan-report.json' })
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
    submodule = 'ORACLE.17'
    script = 'scripts/oracle/Prepare-OracleFirewallPlan.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-firewall-plan:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Prepare-OracleFirewallPlan.ps1' })
    nextTrackerRow = 'ORACLE.17 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
