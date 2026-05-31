#requires -Version 5.1
<#
CREATOR.6 - tracker update command / proof sync.
Reads proof reports and updates Kingsmen_Build_Tracker.csv statuses.
Writes reports/creator/proof-tracker-sync-report.json.
#>
[CmdletBinding()]
param(
  [string]$Root = '',
  [string]$TrackerPath = 'Kingsmen_Build_Tracker.csv',
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

  return (Get-Location).Path
}

$script:RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
Set-Location $script:RepoRoot
$script:ProductionReady = $false
$script:Checks = @()
$script:Updates = @()
$script:Now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$script:TrackerFullPath = Join-Path $script:RepoRoot $TrackerPath
$script:ReportDir = Join-Path $script:RepoRoot 'reports/creator'
$script:ReportPath = Join-Path $script:ReportDir 'proof-tracker-sync-report.json'

function Add-KmCheck {
  param([string]$Name, [object]$Passed, [string]$Detail = '', [string]$Path = '')
  $safePassed = $false
  try { $safePassed = [System.Convert]::ToBoolean($Passed) } catch { $safePassed = $false }
  $script:Checks += [pscustomobject]@{ name = $Name; passed = $safePassed; detail = $Detail; path = $Path }
}

function Read-KmJson {
  param([string]$RelativePath)
  $full = Join-Path $script:RepoRoot $RelativePath
  if (-not (Test-Path $full -PathType Leaf)) { return $null }
  try { return (Get-Content -Path $full -Raw | ConvertFrom-Json) } catch { return $null }
}

function Get-KmGitHash {
  try {
    $hash = (& git rev-parse --short HEAD 2>$null)
    if ([string]::IsNullOrWhiteSpace($hash)) { return '' }
    return $hash.Trim()
  } catch { return '' }
}

function Test-ReportPassed {
  param([string]$RelativePath, [string]$Label)
  $json = Read-KmJson -RelativePath $RelativePath
  $exists = $null -ne $json
  Add-KmCheck -Name ('proof-report:{0}:exists-and-parses' -f $Label) -Passed $exists -Detail $(if ($exists) { 'parsed' } else { 'missing or invalid json' }) -Path $RelativePath
  if (-not $exists) { return $false }

  $passed = ($json.PSObject.Properties.Name -contains 'passed') -and ($json.passed -eq $true)
  Add-KmCheck -Name ('proof-report:{0}:passed' -f $Label) -Passed $passed -Detail ('passed={0}' -f $json.passed) -Path $RelativePath

  $prodSafe = ($json.PSObject.Properties.Name -contains 'productionReady') -and ($json.productionReady -eq $false)
  Add-KmCheck -Name ('proof-report:{0}:productionReadyFalse' -f $Label) -Passed $prodSafe -Detail ('productionReady={0}' -f $json.productionReady) -Path $RelativePath

  return ($passed -and $prodSafe)
}

function Find-TrackerRow {
  param([object[]]$Rows, [string]$Module)
  return @($Rows | Where-Object { $_.Module -eq $Module } | Select-Object -First 1)
}

function Add-OrUpdateTrackerRow {
  param(
    [ref]$RowsRef,
    [string]$Phase,
    [string]$PhaseName,
    [string]$Module,
    [string]$ModuleName,
    [string]$FilePath,
    [string]$FileType,
    [string]$Status,
    [string]$Dependencies,
    [string]$SACritical,
    [string]$UIComponent,
    [string]$Notes,
    [string]$DateCreated,
    [string]$DateValidated,
    [string]$ValidatorPassed,
    [string]$ReportGenerated,
    [string]$GitCommitHash,
    [string]$Reviewer
  )

  $rows = @($RowsRef.Value)
  $existing = $rows | Where-Object { $_.Module -eq $Module } | Select-Object -First 1
  if ($null -eq $existing) {
    $existing = [pscustomobject]@{
      Phase = $Phase
      Phase_Name = $PhaseName
      Module = $Module
      Module_Name = $ModuleName
      File_Path = $FilePath
      File_Type = $FileType
      Status = $Status
      Dependencies = $Dependencies
      SA_Critical = $SACritical
      UI_Component = $UIComponent
      Notes = $Notes
      Date_Created = $DateCreated
      Date_Validated = $DateValidated
      Validator_Passed = $ValidatorPassed
      Report_Generated = $ReportGenerated
      Git_Commit_Hash = $GitCommitHash
      ChatGPT_Session = 'GPT-5.5 Thinking'
      Reviewer = $Reviewer
    }
    $RowsRef.Value = @($RowsRef.Value) + $existing
    $script:Updates += [pscustomobject]@{ module = $Module; action = 'added'; status = $Status; path = $FilePath }
    return
  }

  $existing.Phase = $Phase
  $existing.Phase_Name = $PhaseName
  $existing.Module_Name = $ModuleName
  $existing.File_Path = $FilePath
  $existing.File_Type = $FileType
  $existing.Status = $Status
  $existing.Dependencies = $Dependencies
  $existing.SA_Critical = $SACritical
  $existing.UI_Component = $UIComponent
  $existing.Notes = $Notes
  $existing.Date_Created = $DateCreated
  $existing.Date_Validated = $DateValidated
  $existing.Validator_Passed = $ValidatorPassed
  $existing.Report_Generated = $ReportGenerated
  $existing.Git_Commit_Hash = $GitCommitHash
  $existing.ChatGPT_Session = 'GPT-5.5 Thinking'
  $existing.Reviewer = $Reviewer
  $script:Updates += [pscustomobject]@{ module = $Module; action = 'updated'; status = $Status; path = $FilePath }
}

New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null

$trackerExists = Test-Path $script:TrackerFullPath -PathType Leaf
Add-KmCheck -Name 'tracker:exists' -Passed $trackerExists -Detail $(if ($trackerExists) { 'found' } else { 'missing' }) -Path $TrackerPath
if (-not $trackerExists) {
  throw "Tracker file missing: $TrackerPath"
}

$rows = @(Import-Csv -Path $script:TrackerFullPath)
Add-KmCheck -Name 'tracker:rows-loaded' -Passed ($rows.Count -gt 0) -Detail ('rows={0}' -f $rows.Count) -Path $TrackerPath

$n09Passed = Test-ReportPassed -RelativePath 'reports/n09/n09-3-validation-report.json' -Label 'n09-3'
$creatorPassed = Test-ReportPassed -RelativePath 'reports/creator/creator-validation-report.json' -Label 'creator-validation'
$gitGuardPassed = Test-ReportPassed -RelativePath 'reports/creator/git-checkpoint-guard-report.json' -Label 'git-checkpoint-guard'

$gitHash = Get-KmGitHash
Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($gitHash)) -Detail $gitHash

if ($n09Passed) {
  Add-OrUpdateTrackerRow ([ref]$rows) '1' 'Close_Open_Wound' 'N09.3.1' 'n09-action-packet-bridge-policy' 'packages/db/src/n09-action-packet-bridge-policy.ts' 'typescript' 'Validated' 'N09.2' 'No' 'No' 'Completed n09AssertBridgeSafe and validated with N09.3 report' $script:Now $script:Now 'Yes' 'reports/n09/n09-3-validation-report.json' $gitHash 'Kimi/local proof'
  Add-OrUpdateTrackerRow ([ref]$rows) '1' 'Close_Open_Wound' 'N09.3.2' 'N09.3_Validator' 'scripts/validators/validate-n09-3.mjs' 'javascript' 'Validated' 'N09.3.1' 'No' 'No' 'Self-validating script passed and generated report' $script:Now $script:Now 'Yes' 'reports/n09/n09-3-validation-report.json' $gitHash 'Kimi/local proof'
  Add-OrUpdateTrackerRow ([ref]$rows) '1' 'Close_Open_Wound' 'N09.3.3' 'N09.3_Manifest' 'manifests/modules/N09.3-communications-contracts.json' 'json' 'Validated' 'N09.3.2' 'No' 'No' 'Module manifest included in N09.3 validation' $script:Now $script:Now 'Yes' 'reports/n09/n09-3-validation-report.json' $gitHash 'Kimi/local proof'
}

if ($creatorPassed) {
  Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.1' 'KINGSMEN_CREATOR_Core' 'scripts/KINGSMEN_CREATOR.ps1' 'powershell' 'Validated' 'N09.3.3' 'No' 'No' 'Founder-facing Windows-first phase runner validated by creator self-test' $script:Now $script:Now 'Yes' 'reports/creator/creator-validation-report.json' $gitHash 'Kimi/local proof'
  Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.2' 'Test_KingsmenCreator' 'scripts/testing/Test-KingsmenCreator.ps1' 'powershell' 'Validated' 'CREATOR.1' 'No' 'No' 'Self-test passed with 28 checks and zero failures' $script:Now $script:Now 'Yes' 'reports/creator/creator-validation-report.json' $gitHash 'Kimi/local proof'
  Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.3' 'Creator_Validation_Report' 'reports/creator/creator-validation-report.json' 'json' 'Validated' 'CREATOR.2' 'No' 'No' 'Creator validation report preserved' $script:Now $script:Now 'Yes' 'reports/creator/creator-validation-report.json' $gitHash 'Kimi/local proof'
  Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.4' 'Creator_Config' 'kingsmen/config/creator.config.json' 'json' 'Built' 'CREATOR.1' 'No' 'No' 'Creator proof configuration created; validation covered by tracker sync and checkpoint guard' $script:Now '' 'Pending' '' $gitHash 'Kimi/local proof'
}

if ($gitGuardPassed) {
  Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.5' 'Git_Checkpoint_Guard' 'scripts/git/Assert-KingsmenGitCheckpoint.ps1' 'powershell' 'Validated' 'CREATOR.3' 'No' 'No' 'Git checkpoint guard passed and hooks installed' $script:Now $script:Now 'Yes' 'reports/creator/git-checkpoint-guard-report.json' $gitHash 'Kimi/local proof'
}

Add-OrUpdateTrackerRow ([ref]$rows) '2' 'Build_Materializer' 'CREATOR.6' 'Tracker_Proof_Sync' 'scripts/tracker/Sync-KingsmenProofTracker.ps1' 'powershell' 'Built' 'CREATOR.5' 'No' 'No' 'Synchronizes proof reports into Kingsmen_Build_Tracker.csv' $script:Now '' 'Pending' 'reports/creator/proof-tracker-sync-report.json' $gitHash 'ChatGPT'

if (-not $DryRun) {
  $rows | Export-Csv -Path $script:TrackerFullPath -NoTypeInformation -Encoding UTF8
  Add-KmCheck -Name 'tracker:written' -Passed $true -Detail 'tracker CSV updated' -Path $TrackerPath
} else {
  Add-KmCheck -Name 'tracker:dry-run' -Passed $true -Detail 'no CSV write performed' -Path $TrackerPath
}

$failed = @($script:Checks | Where-Object { $_.passed -ne $true })
$passed = ($failed.Count -eq 0)
$report = [ordered]@{
  module = 'CREATOR'
  submodule = 'CREATOR.6'
  validator = 'Sync-KingsmenProofTracker.ps1'
  productionReady = $script:ProductionReady
  generatedAt = $script:Now
  repoRoot = $script:RepoRoot
  trackerPath = $TrackerPath
  dryRun = [bool]$DryRun
  passed = $passed
  totalChecks = @($script:Checks).Count
  failedChecks = @($failed).Count
  failed = @($failed)
  updates = @($script:Updates)
  checks = @($script:Checks)
  nextTrackerRow = $(if ($passed) { 'N01.5 - config/environment/.env.template' } else { 'CREATOR.6 repair - fix failed checks in reports/creator/proof-tracker-sync-report.json' })
}

$report | ConvertTo-Json -Depth 16 | Set-Content -Path $script:ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 16

if ($passed) { exit 0 }
exit 1
