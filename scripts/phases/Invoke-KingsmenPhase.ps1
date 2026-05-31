#requires -Version 5.1
<#
N01.6 - Invoke-KingsmenPhase.ps1
Windows-first proof phase runner for Kingsmen repo materialization.
Writes reports/phases/n01-6-phase-runner-report.json.
#>
[CmdletBinding()]
param(
  [ValidateSet('List','Status','Validate','Run','Report')]
  [string]$Action = 'List',
  [string]$PhaseName = '',
  [string]$ModuleName = '',
  [string]$Root = ''
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
$script:PhaseResults = @()
$script:ProductionReady = $false
$script:ReportDir = Join-Path $script:RepoRoot 'reports/phases'
$script:ReportPath = Join-Path $script:ReportDir 'n01-6-phase-runner-report.json'
New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null

function Add-KmCheck {
  param([string]$Name, [object]$Passed, [string]$Detail = '', [string]$File = '')
  $safePassed = $false
  try { $safePassed = [System.Convert]::ToBoolean($Passed) } catch { $safePassed = $false }
  $script:Checks += [pscustomobject]@{ name = $Name; passed = $safePassed; detail = $Detail; file = $File }
}

function Read-KmJson {
  param([string]$RelativePath)
  $full = Join-Path $script:RepoRoot $RelativePath
  if (-not (Test-Path $full -PathType Leaf)) { return $null }
  try { return (Get-Content -Path $full -Raw | ConvertFrom-Json) } catch { return $null }
}

function Test-KmPath {
  param([string]$RelativePath, [string]$Label)
  $full = Join-Path $script:RepoRoot $RelativePath
  $ok = Test-Path $full
  Add-KmCheck -Name ('exists:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { 'found' } else { 'missing' }) -File $RelativePath
  return $ok
}

function Test-KmReportPassed {
  param([string]$RelativePath, [string]$Label)
  $json = Read-KmJson -RelativePath $RelativePath
  $parsed = $null -ne $json
  Add-KmCheck -Name ('report:{0}:json' -f $Label) -Passed $parsed -Detail $(if ($parsed) { 'parsed' } else { 'missing or invalid json' }) -File $RelativePath
  if (-not $parsed) { return $false }

  $hasPassed = $json.PSObject.Properties.Name -contains 'passed'
  $passed = $hasPassed -and ($json.passed -eq $true)
  Add-KmCheck -Name ('report:{0}:passed' -f $Label) -Passed $passed -Detail ('passed={0}' -f $json.passed) -File $RelativePath

  $hasProd = $json.PSObject.Properties.Name -contains 'productionReady'
  $prodSafe = $hasProd -and ($json.productionReady -eq $false)
  Add-KmCheck -Name ('report:{0}:productionReadyFalse' -f $Label) -Passed $prodSafe -Detail ('productionReady={0}' -f $json.productionReady) -File $RelativePath

  return ($passed -and $prodSafe)
}

function Invoke-KmCommand {
  param([string]$Label, [string]$Executable, [string[]]$Arguments, [string]$File)
  $raw = & $Executable @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  $output = ($raw | Out-String).Trim()
  $ok = ($exitCode -eq 0)
  Add-KmCheck -Name ('command:{0}:exit-code' -f $Label) -Passed $ok -Detail ('exitCode={0}' -f $exitCode) -File $File
  $script:PhaseResults += [pscustomobject]@{ label = $Label; executable = $Executable; exitCode = $exitCode; outputPreview = $output.Substring(0, [Math]::Min(1200, $output.Length)) }
  return $ok
}

$script:PhaseRegistry = @(
  [pscustomobject]@{ name = 'Close_Open_Wound'; phase = '1'; status = 'validated'; validatorKind = 'node'; validator = 'scripts/validators/validate-n09-3.mjs'; report = 'reports/n09/n09-3-validation-report.json'; runKind = 'creator'; creatorPhase = 'N09.3Complete' },
  [pscustomobject]@{ name = 'Build_Materializer'; phase = '2'; status = 'validated'; validatorKind = 'powershell'; validator = 'scripts/testing/Test-KingsmenCreator.ps1'; report = 'reports/creator/creator-validation-report.json'; runKind = 'creator'; creatorPhase = 'Doctor' },
  [pscustomobject]@{ name = 'Checkpoint_Guard'; phase = '2'; status = 'validated'; validatorKind = 'powershell'; validator = 'scripts/git/Assert-KingsmenGitCheckpoint.ps1'; report = 'reports/creator/git-checkpoint-guard-report.json'; runKind = 'script'; creatorPhase = '' },
  [pscustomobject]@{ name = 'Proof_Tracker_Sync'; phase = '2'; status = 'validated'; validatorKind = 'powershell'; validator = 'scripts/tracker/Sync-KingsmenProofTracker.ps1'; report = 'reports/creator/proof-tracker-sync-report.json'; runKind = 'script'; creatorPhase = '' },
  [pscustomobject]@{ name = 'Infrastructure_Gate'; phase = '3'; status = 'validated'; validatorKind = 'node'; validator = 'scripts/validators/validate-provider-health.mjs'; report = 'reports/validation/provider-health-report.json'; runKind = 'script'; creatorPhase = '' },
  [pscustomobject]@{ name = 'N01_Phase_Runner'; phase = '3'; status = 'built_pending_validation'; validatorKind = 'self'; validator = 'scripts/phases/Invoke-KingsmenPhase.ps1'; report = 'reports/phases/n01-6-phase-runner-report.json'; runKind = 'self'; creatorPhase = '' },
  [pscustomobject]@{ name = 'First_Clickable_Surface'; phase = '4'; status = 'not_started'; validatorKind = 'future'; validator = 'scripts/testing/Test-FirstClickableSurface.ps1'; report = 'reports/ui/first-clickable-surface-report.json'; runKind = 'future'; creatorPhase = '' }
)

function Get-KmPhase {
  param([string]$Name)
  $matches = @($script:PhaseRegistry | Where-Object { $_.name -eq $Name })
  if ($matches.Count -eq 1) { return $matches[0] }
  return $null
}

function Write-KmPhaseReport {
  param([string]$NextTrackerRow)
  $failed = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)
  $report = [ordered]@{
    module = 'N01'
    submodule = 'N01.6'
    runner = 'scripts/phases/Invoke-KingsmenPhase.ps1'
    productionReady = $script:ProductionReady
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    repoRoot = $script:RepoRoot
    action = $Action
    phaseName = $PhaseName
    moduleName = $ModuleName
    passed = $passed
    totalChecks = @($script:Checks).Count
    failedChecks = @($failed).Count
    phaseRegistry = @($script:PhaseRegistry)
    commandResults = @($script:PhaseResults)
    failed = @($failed)
    checks = @($script:Checks)
    nextTrackerRow = $(if ($passed) { $NextTrackerRow } else { 'N01.6 repair - fix failed checks in reports/phases/n01-6-phase-runner-report.json' })
  }
  $report | ConvertTo-Json -Depth 18 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 18
  if ($passed) { exit 0 }
  exit 1
}

try {
  Test-KmPath -RelativePath 'scripts/KINGSMEN_CREATOR.ps1' -Label 'creator' | Out-Null
  Test-KmPath -RelativePath 'kingsmen/config/creator.config.json' -Label 'creator-config' | Out-Null
  Test-KmPath -RelativePath 'Kingsmen_Build_Tracker.csv' -Label 'tracker' | Out-Null
  Test-KmPath -RelativePath 'config/environment/.env.template' -Label 'env-template' | Out-Null
  Test-KmPath -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry' | Out-Null

  $config = Read-KmJson -RelativePath 'kingsmen/config/creator.config.json'
  Add-KmCheck -Name 'creator-config:json' -Passed ($null -ne $config) -Detail $(if ($null -ne $config) { 'parsed' } else { 'missing or invalid json' }) -File 'kingsmen/config/creator.config.json'
  if ($null -ne $config) {
    Add-KmCheck -Name 'creator-config:productionReadyFalse' -Passed ($config.productionReady -eq $false) -Detail ('productionReady={0}' -f $config.productionReady) -File 'kingsmen/config/creator.config.json'
    Add-KmCheck -Name 'creator-config:phaseRunnerScript' -Passed ($config.phaseRunner.script -eq 'scripts/KINGSMEN_CREATOR.ps1') -Detail ([string]$config.phaseRunner.script) -File 'kingsmen/config/creator.config.json'
  }

  if ($Action -eq 'List') {
    Add-KmCheck -Name 'phase-registry:list' -Passed ($script:PhaseRegistry.Count -ge 7) -Detail ('phases={0}' -f $script:PhaseRegistry.Count) -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Write-KmPhaseReport -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
  }

  if ($Action -eq 'Report') {
    Test-KmReportPassed -RelativePath 'reports/n09/n09-3-validation-report.json' -Label 'n09-3' | Out-Null
    Test-KmReportPassed -RelativePath 'reports/creator/creator-validation-report.json' -Label 'creator-validation' | Out-Null
    Test-KmReportPassed -RelativePath 'reports/creator/git-checkpoint-guard-report.json' -Label 'git-checkpoint-guard' | Out-Null
    Test-KmReportPassed -RelativePath 'reports/validation/provider-health-report.json' -Label 'provider-health' | Out-Null
    Write-KmPhaseReport -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
  }

  if ([string]::IsNullOrWhiteSpace($PhaseName)) {
    Add-KmCheck -Name 'phase-name:required' -Passed $false -Detail 'PhaseName is required for Status, Validate, and Run.' -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Write-KmPhaseReport -NextTrackerRow 'N01.6 repair - provide PhaseName'
  }

  $phase = Get-KmPhase -Name $PhaseName
  Add-KmCheck -Name ('phase-exists:{0}' -f $PhaseName) -Passed ($null -ne $phase) -Detail $(if ($null -ne $phase) { 'found' } else { 'missing' }) -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
  if ($null -eq $phase) { Write-KmPhaseReport -NextTrackerRow 'N01.6 repair - unknown phase' }

  if ($Action -eq 'Status') {
    Add-KmCheck -Name ('phase-status:{0}' -f $PhaseName) -Passed $true -Detail $phase.status -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Add-KmCheck -Name ('phase-validator:{0}' -f $PhaseName) -Passed (-not [string]::IsNullOrWhiteSpace($phase.validator)) -Detail $phase.validator -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Add-KmCheck -Name ('phase-report:{0}' -f $PhaseName) -Passed (-not [string]::IsNullOrWhiteSpace($phase.report)) -Detail $phase.report -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Test-KmReportPassed -RelativePath $phase.report -Label $PhaseName | Out-Null
    Write-KmPhaseReport -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
  }

  if ($Action -eq 'Validate') {
    if ($phase.validatorKind -eq 'future') {
      Add-KmCheck -Name ('phase-validator-supported:{0}' -f $PhaseName) -Passed $false -Detail 'Future phase validator not created yet.' -File $phase.validator
      Write-KmPhaseReport -NextTrackerRow 'N01.6 repair - future phase cannot validate yet'
    }

    if ($phase.validatorKind -eq 'self') {
      Add-KmCheck -Name 'self-validator:path' -Passed (Test-Path (Join-Path $script:RepoRoot $phase.validator) -PathType Leaf) -Detail $phase.validator -File $phase.validator
    }
    elseif ($phase.validatorKind -eq 'node') {
      $validatorFull = Join-Path $script:RepoRoot $phase.validator
      Add-KmCheck -Name ('validator-exists:{0}' -f $PhaseName) -Passed (Test-Path $validatorFull -PathType Leaf) -Detail $phase.validator -File $phase.validator
      if (Test-Path $validatorFull -PathType Leaf) { Invoke-KmCommand -Label ('validate:{0}' -f $PhaseName) -Executable 'node' -Arguments @($phase.validator) -File $phase.validator | Out-Null }
    }
    elseif ($phase.validatorKind -eq 'powershell') {
      $validatorFull = Join-Path $script:RepoRoot $phase.validator
      Add-KmCheck -Name ('validator-exists:{0}' -f $PhaseName) -Passed (Test-Path $validatorFull -PathType Leaf) -Detail $phase.validator -File $phase.validator
      if (Test-Path $validatorFull -PathType Leaf) { Invoke-KmCommand -Label ('validate:{0}' -f $PhaseName) -Executable 'powershell.exe' -Arguments @('-NoProfile','-ExecutionPolicy','Bypass','-File',$phase.validator) -File $phase.validator | Out-Null }
    }
    else {
      Add-KmCheck -Name ('validator-kind-supported:{0}' -f $PhaseName) -Passed $false -Detail $phase.validatorKind -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    }

    Test-KmReportPassed -RelativePath $phase.report -Label $PhaseName | Out-Null
    Write-KmPhaseReport -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
  }

  if ($Action -eq 'Run') {
    if ($phase.runKind -eq 'creator') {
      Invoke-KmCommand -Label ('run-creator:{0}' -f $PhaseName) -Executable 'powershell.exe' -Arguments @('-NoProfile','-ExecutionPolicy','Bypass','-File','scripts/KINGSMEN_CREATOR.ps1','-Phase',$phase.creatorPhase) -File 'scripts/KINGSMEN_CREATOR.ps1' | Out-Null
    }
    elseif ($phase.runKind -eq 'script') {
      if ($phase.validatorKind -eq 'node') { Invoke-KmCommand -Label ('run-script:{0}' -f $PhaseName) -Executable 'node' -Arguments @($phase.validator) -File $phase.validator | Out-Null }
      elseif ($phase.validatorKind -eq 'powershell') { Invoke-KmCommand -Label ('run-script:{0}' -f $PhaseName) -Executable 'powershell.exe' -Arguments @('-NoProfile','-ExecutionPolicy','Bypass','-File',$phase.validator) -File $phase.validator | Out-Null }
      else { Add-KmCheck -Name ('run-script-supported:{0}' -f $PhaseName) -Passed $false -Detail $phase.validatorKind -File 'scripts/phases/Invoke-KingsmenPhase.ps1' }
    }
    elseif ($phase.runKind -eq 'self') {
      Add-KmCheck -Name 'run-self:N01.6' -Passed $true -Detail 'Self phase runner is present. Use Action Report for proof rollup.' -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    }
    else {
      Add-KmCheck -Name ('phase-run-supported:{0}' -f $PhaseName) -Passed $false -Detail 'This phase is not runnable yet.' -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    }

    Test-KmReportPassed -RelativePath $phase.report -Label $PhaseName | Out-Null
    Write-KmPhaseReport -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
  }
} catch {
  Add-KmCheck -Name 'phase-runner:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
  Write-KmPhaseReport -NextTrackerRow 'N01.6 repair - runner crashed'
}
