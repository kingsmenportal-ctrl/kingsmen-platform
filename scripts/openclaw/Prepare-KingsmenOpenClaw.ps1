#requires -Version 5.1
<#
OPENCLAW.2 - Prepare-KingsmenOpenClaw.ps1
Prepares a governed OpenClaw workspace for Kingsmen build-stage assistance.
Writes reports/openclaw/openclaw-prepare-report.json.
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
$script:ReportDir = Join-Path $script:RepoRoot 'reports/openclaw'
$script:ReportPath = Join-Path $script:ReportDir 'openclaw-prepare-report.json'

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
  $json = $Data | ConvertTo-Json -Depth 18
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
  Test-KmRequiredFile -RelativePath 'kingsmen/openclaw/openclaw-operator-policy.json' -Label 'openclaw-policy'
  Test-KmRequiredFile -RelativePath 'scripts/KINGSMEN_CREATOR.ps1' -Label 'creator'
  Test-KmRequiredFile -RelativePath 'scripts/phases/Invoke-KingsmenPhase.ps1' -Label 'phase-runner'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  $directories = @(
    'kingsmen/openclaw',
    'kingsmen/openclaw/workspace',
    'kingsmen/openclaw/masked-reports',
    'kingsmen/openclaw/inbox',
    'kingsmen/openclaw/outbox',
    'kingsmen/openclaw/drafts',
    'kingsmen/openclaw/source-scout',
    'kingsmen/openclaw/action-packets',
    'docs/openclaw',
    'reports/openclaw',
    'scripts/openclaw'
  )

  foreach ($directory in $directories) { Ensure-KmDirectory -RelativePath $directory }

  $runtimeConfig = [ordered]@{
    module = 'OPENCLAW'
    submodule = 'OPENCLAW.2'
    name = 'Kingsmen OpenClaw Build Stage Workspace'
    status = 'prepared_pending_validation'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    repoRoot = $script:RepoRoot
    defaultPermissionLevel = 2
    maxPermissionLevelWithoutFounderApproval = 3
    openClawIsBusinessBrain = $false
    backendGovernsRuntime = $true
    postgresqlIsTruth = $true
    powershellCreatorMaterializes = $true
    validatorsProve = $true
    githubPreservesHistory = $true
    oracleLiteFirst = $true
    candidateSafetyWins = $true
    workspace = [ordered]@{
      root = 'kingsmen/openclaw'
      reports = 'reports/openclaw'
      maskedReports = 'kingsmen/openclaw/masked-reports'
      drafts = 'kingsmen/openclaw/drafts'
      sourceScout = 'kingsmen/openclaw/source-scout'
      actionPackets = 'kingsmen/openclaw/action-packets'
    }
    nextTrackerRow = 'OPENCLAW.3 - scripts/validators/validate-openclaw-safety.mjs'
  }

  $allowedCommands = [ordered]@{
    module = 'OPENCLAW'
    submodule = 'OPENCLAW.2'
    productionReady = $false
    allowed = @(
      'git status --short',
      'git log --oneline -n 5',
      'node scripts/validators/validate-provider-health.mjs',
      'node scripts/validators/validate-n09-3.mjs',
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/KINGSMEN_CREATOR.ps1 -Phase Doctor',
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/phases/Invoke-KingsmenPhase.ps1 -Action Report'
    )
    approvalRequired = @(
      'git write operations',
      'runtime deployment operations',
      'external communication operations',
      'commercial policy operations',
      'candidate escalation operations'
    )
  }

  $readme = @'
# Kingsmen OpenClaw Workspace

OpenClaw may assist Kingsmen during the build stage as a governed report reader, validator runner, source scout, and draft assistant.

It does not replace ChatGPT, PowerShell Creator, backend policy, PostgreSQL truth, GitHub proof, or founder approval.

Safe first tasks are report reading, validator running, failure summaries, draft patches, action packets, and official public source scouting for later Kingsmen verification.
'@

  Write-KmJsonFile -RelativePath 'kingsmen/openclaw/runtime-config.json' -Data $runtimeConfig
  Write-KmJsonFile -RelativePath 'kingsmen/openclaw/allowed-commands.json' -Data $allowedCommands
  Write-KmTextFile -RelativePath 'docs/openclaw/README.md' -Content $readme

  $gitHash = Get-KmGitHash
  Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [ordered]@{
    module = 'OPENCLAW'
    submodule = 'OPENCLAW.2'
    script = 'scripts/openclaw/Prepare-KingsmenOpenClaw.ps1'
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
    nextTrackerRow = $(if ($passed) { 'OPENCLAW.3 - scripts/validators/validate-openclaw-safety.mjs' } else { 'OPENCLAW.2 repair - fix failed checks in reports/openclaw/openclaw-prepare-report.json' })
  }

  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report | ConvertTo-Json -Depth 20 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 20
  if ($passed) { exit 0 }
  exit 1
} catch {
  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report = [ordered]@{
    module = 'OPENCLAW'
    submodule = 'OPENCLAW.2'
    script = 'scripts/openclaw/Prepare-KingsmenOpenClaw.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'openclaw-prepare:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/openclaw/Prepare-KingsmenOpenClaw.ps1' })
    nextTrackerRow = 'OPENCLAW.2 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
