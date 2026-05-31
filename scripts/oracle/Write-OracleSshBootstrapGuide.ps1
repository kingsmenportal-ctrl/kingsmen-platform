#requires -Version 5.1
<#
ORACLE.11 - Write-OracleSshBootstrapGuide.ps1
Creates a safe founder-facing SSH bootstrap guide for the future Oracle Free / Oracle Lite VM.
This script is a guide writer only: it does not create cloud resources, does not generate private keys, does not store credentials, and does not deploy production.
Writes reports/oracle/oracle-ssh-bootstrap-guide-report.json.
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
$script:ReportPath = Join-Path $script:ReportDir 'oracle-ssh-bootstrap-guide-report.json'

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
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-vm-bootstrap-plan-validation-report.json' -Label 'oracle-vm-bootstrap-plan-validation'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-vm-bootstrap-plan-report.json' -Label 'oracle-vm-bootstrap-plan-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json' -Label 'oracle-vm-bootstrap-plan'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/vm-bootstrap/checklists/oracle-vm-founder-checklist.json' -Label 'oracle-vm-founder-checklist'
  Test-KmRequiredFile -RelativePath 'docs/oracle/oracle-vm-bootstrap-plan.md' -Label 'oracle-vm-bootstrap-plan-md'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/cost-guard/oracle-cost-guard.json' -Label 'oracle-cost-guard'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/security/oracle-security-checklist.json' -Label 'oracle-security-checklist'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $oracle10 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-vm-bootstrap-plan-validation-report.json' -Label 'oracle-vm-bootstrap-plan-validation'
  $oracle9 = Test-KmPassedReport -RelativePath 'reports/oracle/oracle-vm-bootstrap-plan-report.json' -Label 'oracle-vm-bootstrap-plan'

  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/security'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/runtime'
  Ensure-KmDirectory -RelativePath 'kingsmen/oracle/vm-bootstrap/network'
  Ensure-KmDirectory -RelativePath 'docs/oracle'
  Ensure-KmDirectory -RelativePath 'reports/oracle'

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $sshGuide = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.11'
    name = 'Kingsmen Oracle SSH Bootstrap Guide'
    status = 'written_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    purpose = 'Prepare a founder-safe SSH access guide for the future Oracle Free / Oracle Lite VM without generating, storing, or exposing private keys.'
    proofInput = [ordered]@{
      oracleVmBootstrapPlanValidationPassed = ($oracle10 -ne $null -and $oracle10.passed -eq $true)
      oracleVmBootstrapPlanPassed = ($oracle9 -ne $null -and $oracle9.passed -eq $true)
      gitHeadHash = $gitHash
    }
    sshDoctrine = [ordered]@{
      privateKeyNeverStoredInRepo = $true
      publicKeyOnlyMayBeRecordedWhenMasked = $true
      founderOwnsPrivateKey = $true
      passphraseRecommended = $true
      noPasswordLoginTarget = $true
      noRootPasswordLoginTarget = $true
      noSharedOperatorKey = $true
      productionReady = $false
    }
    founderSteps = @(
      [ordered]@{
        order = 1
        title = 'Create or choose SSH key outside the repo'
        action = 'Use Windows OpenSSH or Oracle Console key flow. Keep private key only on founder device or approved password manager.'
        proofToCapture = 'Masked key name, public key fingerprint, and storage location category only.'
        blocked = 'Do not paste private key, passphrase, PEM contents, tokens, tenancy IDs, or secrets into Git, chat, reports, or docs.'
      },
      [ordered]@{
        order = 2
        title = 'Attach public key during VM creation'
        action = 'Paste the public key only into the Oracle VM creation screen when the founder creates the free-eligible instance.'
        proofToCapture = 'Masked VM display name and public-key fingerprint only.'
        blocked = 'Do not commit authorized_keys, private keys, or cloud-init secrets.'
      },
      [ordered]@{
        order = 3
        title = 'Restrict administrative access'
        action = 'Use founder-only SSH access, least privilege, and firewall rules. Keep PostgreSQL and Redis private.'
        proofToCapture = 'Masked admin username, SSH port status, and firewall summary.'
        blocked = 'No public PostgreSQL, public Redis, shared SSH keys, or password-based root login.'
      },
      [ordered]@{
        order = 4
        title = 'Validate host identity before first login'
        action = 'Record the host fingerprint on first connection and compare it when reconnecting.'
        proofToCapture = 'Masked host fingerprint and timestamp only.'
        blocked = 'Do not ignore unexpected host-key changes.'
      },
      [ordered]@{
        order = 5
        title = 'Run future bootstrap only after access is safe'
        action = 'Future scripts may install Docker, Git, Node, firewall baseline, log pruning, and repo clone after SSH proof is validated.'
        proofToCapture = 'Validation report path and masked command summary.'
        blocked = 'No production traffic, real candidate documents, paid providers, or public database services before later gates pass.'
      }
    )
    allowedCommandsLater = @(
      'ssh -i <local_private_key_path> <founder_user>@<vm_public_ip>',
      'ssh-keygen -lf <public_key_path>',
      'ssh-keygen -y -f <local_private_key_path>',
      'git clone <repo_url>',
      'node scripts/validators/validate-oracle-ssh-bootstrap-guide.mjs'
    )
    blockedPatterns = @(
      'private key content in Git',
      'private key content in chat',
      'password login as default target',
      'root password login',
      'shared operator SSH key',
      'public PostgreSQL',
      'public Redis',
      'production candidate traffic'
    )
    maskedEvidenceToCollectLater = @(
      'SSH key display name',
      'public key fingerprint',
      'public key algorithm',
      'founder device category',
      'VM display name',
      'VM public IP presence yes or no',
      'admin username category',
      'host fingerprint',
      'firewall SSH rule summary',
      'password login disabled yes or no',
      'root login disabled yes or no',
      'validator pass summary'
    )
    safetyBoundaries = [ordered]@{
      noCloudResourcesCreatedByThisScript = $true
      noCredentialMaterialGeneratedByThisScript = $true
      noCredentialMaterialStoredByThisScript = $true
      noPrivateKeyAcceptedByThisScript = $true
      noProductionDeployByThisScript = $true
      noPaidResourceChangeByThisScript = $true
      postgresRedisPrivate = $true
      candidateSafetyWins = $true
      productionReady = $false
    }
    nextTrackerRow = 'ORACLE.12 - scripts/validators/validate-oracle-ssh-bootstrap-guide.mjs'
  }

  $markdown = @"
# Kingsmen Oracle SSH Bootstrap Guide

Generated: $script:GeneratedAt
Production ready: false

This is a founder guide only. It does not create OCI resources, generate private keys, store credentials, or deploy production.

## Proof status

- ORACLE.10 VM bootstrap plan validation: $($sshGuide.proofInput.oracleVmBootstrapPlanValidationPassed)
- ORACLE.9 VM bootstrap plan: $($sshGuide.proofInput.oracleVmBootstrapPlanPassed)
- Git head: $gitHash

## Founder SSH rules

1. Private key stays outside Git and outside chat.
2. Public key may be used for Oracle VM creation, but only masked fingerprint evidence should be recorded.
3. Founder owns the first key; no shared operator key at this stage.
4. Target no password login and no root password login.
5. PostgreSQL and Redis remain private.
6. No production candidate traffic yet.

## Future command examples

```powershell
ssh-keygen -lf <public_key_path>
ssh -i <local_private_key_path> <founder_user>@<vm_public_ip>
node scripts/validators/validate-oracle-ssh-bootstrap-guide.mjs
```

## Hard boundary

Never paste or commit a private key, passphrase, token, tenancy identifier, service role key, database password, or provider secret.
"@

  Write-KmJsonFile -RelativePath 'kingsmen/oracle/vm-bootstrap/security/oracle-ssh-bootstrap-guide.json' -Data $sshGuide
  Write-KmTextFile -RelativePath 'docs/oracle/oracle-ssh-bootstrap-guide.md' -Content $markdown

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.11'
    script = 'scripts/oracle/Write-OracleSshBootstrapGuide.ps1'
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
    nextTrackerRow = $(if ($passed) { 'ORACLE.12 - scripts/validators/validate-oracle-ssh-bootstrap-guide.mjs' } else { 'ORACLE.11 repair - fix failed checks in reports/oracle/oracle-ssh-bootstrap-guide-report.json' })
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
    submodule = 'ORACLE.11'
    script = 'scripts/oracle/Write-OracleSshBootstrapGuide.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-ssh-bootstrap-guide:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Write-OracleSshBootstrapGuide.ps1' })
    nextTrackerRow = 'ORACLE.11 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
