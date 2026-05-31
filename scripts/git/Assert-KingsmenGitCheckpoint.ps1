#requires -Version 5.1
<#
CREATOR.5 - Git checkpoint guard.
Validates proof reports before a checkpoint commit is accepted.
Writes reports/creator/git-checkpoint-guard-report.json.
#>
[CmdletBinding()]
param(
  [string]$Root = '',
  [switch]$InstallHooks
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

  return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

$script:RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
Set-Location $script:RepoRoot

$script:Checks = @()
$script:ProductionReady = $false
$ReportDir = Join-Path $script:RepoRoot 'reports/creator'
$ReportPath = Join-Path $ReportDir 'git-checkpoint-guard-report.json'

function Add-KmCheck {
  param(
    [string]$Name,
    [object]$Passed,
    [string]$Detail = '',
    [string]$Path = ''
  )

  $safePassed = $false
  try { $safePassed = [System.Convert]::ToBoolean($Passed) } catch { $safePassed = $false }

  $script:Checks += [pscustomobject]@{
    name = $Name
    passed = $safePassed
    detail = $Detail
    path = $Path
  }
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path $Path -PathType Leaf)) { return $null }
  try { return (Get-Content -Path $Path -Raw | ConvertFrom-Json) } catch { return $null }
}

function Test-ReportPassed {
  param(
    [string]$RelativePath,
    [string]$Label
  )

  $full = Join-Path $script:RepoRoot $RelativePath
  $exists = Test-Path $full -PathType Leaf
  Add-KmCheck -Name ('exists:{0}' -f $RelativePath) -Passed $exists -Detail $(if ($exists) { 'found' } else { 'missing' }) -Path $RelativePath

  if (-not $exists) { return }

  $json = Read-JsonFile -Path $full
  $parsed = $null -ne $json
  Add-KmCheck -Name ('json:{0}' -f $RelativePath) -Passed $parsed -Detail $(if ($parsed) { 'parsed' } else { 'parse failed' }) -Path $RelativePath

  if (-not $parsed) { return }

  $passed = ($json.PSObject.Properties.Name -contains 'passed') -and ($json.passed -eq $true)
  Add-KmCheck -Name ('passed:{0}' -f $Label) -Passed $passed -Detail ('passed={0}' -f $json.passed) -Path $RelativePath

  if ($json.PSObject.Properties.Name -contains 'productionReady') {
    Add-KmCheck -Name ('productionReadyFalse:{0}' -f $Label) -Passed ($json.productionReady -eq $false) -Detail ('productionReady={0}' -f $json.productionReady) -Path $RelativePath
  } else {
    Add-KmCheck -Name ('productionReadyField:{0}' -f $Label) -Passed $false -Detail 'missing productionReady field' -Path $RelativePath
  }
}

function Test-GitAvailable {
  try {
    $gitVersion = (& git --version 2>$null)
    Add-KmCheck -Name 'git:available' -Passed (-not [string]::IsNullOrWhiteSpace($gitVersion)) -Detail $gitVersion
    $inside = (& git rev-parse --is-inside-work-tree 2>$null)
    Add-KmCheck -Name 'git:inside-work-tree' -Passed ($inside -eq 'true') -Detail $inside
  } catch {
    Add-KmCheck -Name 'git:available' -Passed $false -Detail $_.Exception.Message
  }
}

function Test-RequiredTrackedFiles {
  $requiredFiles = @(
    'scripts/KINGSMEN_CREATOR.ps1',
    'scripts/testing/Test-KingsmenCreator.ps1',
    'kingsmen/config/creator.config.json',
    'reports/creator/creator-validation-report.json',
    'reports/n09/n09-3-validation-report.json',
    'packages/db/src/n09-action-packet-bridge-policy.ts',
    'scripts/validators/validate-n09-3.mjs',
    'manifests/modules/N09.3-communications-contracts.json'
  )

  foreach ($file in $requiredFiles) {
    $full = Join-Path $script:RepoRoot $file
    Add-KmCheck -Name ('tracked-file:{0}' -f $file) -Passed (Test-Path $full -PathType Leaf) -Detail $(if (Test-Path $full -PathType Leaf) { 'found' } else { 'missing' }) -Path $file
  }
}

function Install-KingsmenHooks {
  $hookDir = Join-Path $script:RepoRoot '.githooks'
  New-Item -ItemType Directory -Force -Path $hookDir | Out-Null

  $preCommitPath = Join-Path $hookDir 'pre-commit'
  $hook = @'
#!/bin/sh
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/git/Assert-KingsmenGitCheckpoint.ps1
if [ $? -ne 0 ]; then
  echo "Kingsmen checkpoint guard failed. Commit blocked."
  exit 1
fi
exit 0
'@
  Set-Content -Path $preCommitPath -Value $hook -Encoding ASCII
  & git config core.hooksPath .githooks | Out-Null

  Add-KmCheck -Name 'hooks:installed' -Passed $true -Detail '.githooks/pre-commit installed and core.hooksPath set' -Path '.githooks/pre-commit'
}

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

Test-GitAvailable
Test-RequiredTrackedFiles
Test-ReportPassed -RelativePath 'reports/creator/creator-validation-report.json' -Label 'creator-validation'
Test-ReportPassed -RelativePath 'reports/n09/n09-3-validation-report.json' -Label 'n09-validation'

if ($InstallHooks) { Install-KingsmenHooks }

$Failed = @($script:Checks | Where-Object { $_.passed -ne $true })
$Passed = ($Failed.Count -eq 0)

$Report = [ordered]@{
  module = 'CREATOR'
  submodule = 'CREATOR.5'
  validator = 'Assert-KingsmenGitCheckpoint.ps1'
  productionReady = $script:ProductionReady
  generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
  repoRoot = $script:RepoRoot
  passed = $Passed
  totalChecks = @($script:Checks).Count
  failedChecks = @($Failed).Count
  failed = @($Failed)
  checks = @($script:Checks)
  nextTrackerRow = $(if ($Passed) { 'CREATOR.6 - tracker update command / proof sync' } else { 'CREATOR.5 repair - fix failed checks in reports/creator/git-checkpoint-guard-report.json' })
}

$Report | ConvertTo-Json -Depth 14 | Set-Content -Path $ReportPath -Encoding UTF8
$Report | ConvertTo-Json -Depth 14

if ($Passed) { exit 0 }
exit 1
