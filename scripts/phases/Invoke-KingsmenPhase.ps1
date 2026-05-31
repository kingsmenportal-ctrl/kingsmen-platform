#requires -Version 5.1
<#
N01.6 - Invoke-KingsmenPhase.ps1
Runs Kingsmen tracker phases in a Windows-first, proof-based way.

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\phases\Invoke-KingsmenPhase.ps1 -Action List
  powershell -ExecutionPolicy Bypass -File .\scripts\phases\Invoke-KingsmenPhase.ps1 -Action Status -PhaseName Build_Materializer
  powershell -ExecutionPolicy Bypass -File .\scripts\phases\Invoke-KingsmenPhase.ps1 -Action Validate -PhaseName Infrastructure_Gate
  powershell -ExecutionPolicy Bypass -File .\scripts\phases\Invoke-KingsmenPhase.ps1 -Action Run -PhaseName Scaffold

This script does not replace KINGSMEN_CREATOR.ps1.
It calls the Creator where appropriate and writes reports/phases/*.json evidence.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('List','Status','Validate','Run')]
    [string] $Action,

    [Parameter(Mandatory = $false)]
    [string] $PhaseName = '',

    [Parameter(Mandatory = $false)]
    [string] $ModuleName = '',

    [Parameter(Mandatory = $false)]
    [string] $CommitMessage = ''
)

$ErrorActionPreference = 'Stop'

function Write-KmLine {
    param(
        [string] $Text,
        [string] $Color = 'Gray'
    )
    Write-Host $Text -ForegroundColor $Color
}

function Get-KmRepoRoot {
    $fromScript = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
    if (Test-Path (Join-Path $fromScript '.git')) {
        return $fromScript
    }

    $fromCurrent = (Get-Location).Path
    if (Test-Path (Join-Path $fromCurrent '.git')) {
        return $fromCurrent
    }

    throw 'Not inside a Git repository. Run from kingsmen-platform.'
}

function Add-KmCheck {
    param(
        [string] $Name,
        $Passed,
        [string] $Detail,
        [string] $File = ''
    )

    $script:Checks += [pscustomobject]@{
        name = $Name
        passed = [bool]$Passed
        detail = $Detail
        file = $File
    }
}

function Write-KmReport {
    param(
        [string] $ReportName,
        [string] $Submodule,
        [string] $NextTrackerRow
    )

    $failed = @($script:Checks | Where-Object { -not $_.passed })
    $passed = ($failed.Count -eq 0)
    $report = [ordered]@{
        module = 'N01'
        submodule = $Submodule
        runner = 'scripts/phases/Invoke-KingsmenPhase.ps1'
        productionReady = $false
        generatedAt = (Get-Date).ToUniversalTime().ToString('o')
        action = $Action
        phaseName = $PhaseName
        moduleName = $ModuleName
        passed = $passed
        totalChecks = @($script:Checks).Count
        failedChecks = @($failed).Count
        failed = @($failed)
        checks = @($script:Checks)
        nextTrackerRow = $(if ($passed) { $NextTrackerRow } else { 'N01.6 repair - fix failed checks in reports/phases/' + $ReportName })
    }

    $reportPath = Join-Path $script:ReportDir $ReportName
    $report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath -Encoding UTF8
    $report | ConvertTo-Json -Depth 10

    if ($passed) {
        exit 0
    }
    exit 1
}

$script:RepoRoot = Get-KmRepoRoot
Set-Location $script:RepoRoot

$script:Checks = @()
$script:ReportDir = Join-Path $script:RepoRoot 'reports/phases'
New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null

$CreatorPath = Join-Path $script:RepoRoot 'scripts/KINGSMEN_CREATOR.ps1'
$CreatorConfigPath = Join-Path $script:RepoRoot 'config/creator.config.json'
$TrackerPath = Join-Path $script:RepoRoot 'Kingsmen_Build_Tracker.csv'
$ProviderValidatorPath = Join-Path $script:RepoRoot 'scripts/validators/validate-provider-health.mjs'
$N09ValidatorPath = Join-Path $script:RepoRoot 'scripts/validators/validate-n09-3.mjs'

$PhaseRegistry = @(
    [ordered]@{ name = 'Close_Open_Wound'; phase = 1; validator = 'scripts/validators/validate-n09-3.mjs'; report = 'reports/n09/n09-3-validation-report.json'; status = 'validated' },
    [ordered]@{ name = 'Build_Materializer'; phase = 2; validator = 'scripts/testing/Test-KingsmenCreator.ps1'; report = 'reports/creator/creator-validation-report.json'; status = 'validated' },
    [ordered]@{ name = 'Infrastructure_Gate'; phase = 3; validator = 'scripts/validators/validate-provider-health.mjs'; report = 'reports/validation/provider-health-report.json'; status = 'in_progress' },
    [ordered]@{ name = 'First_Clickable_Surface'; phase = 4; validator = 'scripts/testing/Test-FirstClickableSurface.ps1'; report = 'reports/ui/first-clickable-surface-report.json'; status = 'not_started' },
    [ordered]@{ name = 'Scaffold'; phase = 0; validator = ''; report = 'reports/creator/creator-validation-report.json'; status = 'available_creator_action' }
)

try {
    Add-KmCheck -Name 'exists:scripts/KINGSMEN_CREATOR.ps1' -Passed (Test-Path $CreatorPath) -Detail $(if (Test-Path $CreatorPath) { 'found' } else { 'missing' }) -File 'scripts/KINGSMEN_CREATOR.ps1'
    Add-KmCheck -Name 'exists:config/creator.config.json' -Passed (Test-Path $CreatorConfigPath) -Detail $(if (Test-Path $CreatorConfigPath) { 'found' } else { 'missing' }) -File 'config/creator.config.json'
    Add-KmCheck -Name 'exists:Kingsmen_Build_Tracker.csv' -Passed (Test-Path $TrackerPath) -Detail $(if (Test-Path $TrackerPath) { 'found' } else { 'missing' }) -File 'Kingsmen_Build_Tracker.csv'

    if (Test-Path $CreatorConfigPath) {
        $config = Get-Content -Path $CreatorConfigPath -Raw | ConvertFrom-Json
        Add-KmCheck -Name 'creator-config:productionReadyFalse' -Passed ($config.productionReady -eq $false) -Detail ('productionReady=' + $config.productionReady) -File 'config/creator.config.json'
        Add-KmCheck -Name 'creator-config:canonicalCreator' -Passed ($config.repo.canonicalCreator -eq 'scripts/KINGSMEN_CREATOR.ps1') -Detail ($config.repo.canonicalCreator) -File 'config/creator.config.json'
    }

    if ($Action -eq 'List') {
        foreach ($phase in $PhaseRegistry) {
            Write-KmLine -Text ($phase.phase.ToString() + ' | ' + $phase.name + ' | ' + $phase.status) -Color 'Cyan'
        }
        Add-KmCheck -Name 'phase-registry:list' -Passed $true -Detail ('listed ' + $PhaseRegistry.Count + ' phases') -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
        Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
    }

    if ([string]::IsNullOrWhiteSpace($PhaseName)) {
        throw 'PhaseName is required for Status, Validate, and Run.'
    }

    $phaseMatch = @($PhaseRegistry | Where-Object { $_.name -eq $PhaseName })
    Add-KmCheck -Name ('phase-exists:' + $PhaseName) -Passed ($phaseMatch.Count -eq 1) -Detail ($(if ($phaseMatch.Count -eq 1) { 'found' } else { 'missing or duplicate' })) -File 'scripts/phases/Invoke-KingsmenPhase.ps1'

    if ($phaseMatch.Count -ne 1) {
        Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6 repair - unknown phase'
    }

    $phase = $phaseMatch[0]

    if ($Action -eq 'Status') {
        $reportFile = Join-Path $script:RepoRoot $phase.report
        Add-KmCheck -Name ('phase-status:' + $PhaseName) -Passed $true -Detail $phase.status -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
        Add-KmCheck -Name ('phase-report-path:' + $PhaseName) -Passed (-not [string]::IsNullOrWhiteSpace($phase.report)) -Detail $phase.report -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
        Add-KmCheck -Name ('phase-report-exists:' + $PhaseName) -Passed (Test-Path $reportFile) -Detail $(if (Test-Path $reportFile) { 'found' } else { 'not generated yet' }) -File $phase.report
        Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
    }

    if ($Action -eq 'Validate') {
        if ($PhaseName -eq 'Close_Open_Wound') {
            Add-KmCheck -Name 'validator-exists:n09-3' -Passed (Test-Path $N09ValidatorPath) -Detail $(if (Test-Path $N09ValidatorPath) { 'found' } else { 'missing' }) -File 'scripts/validators/validate-n09-3.mjs'
            if (Test-Path $N09ValidatorPath) {
                $output = node $N09ValidatorPath 2>&1
                Add-KmCheck -Name 'validator-run:n09-3' -Passed ($LASTEXITCODE -eq 0) -Detail (($output | Out-String).Trim()) -File 'scripts/validators/validate-n09-3.mjs'
            }
        }
        elseif ($PhaseName -eq 'Infrastructure_Gate') {
            Add-KmCheck -Name 'validator-exists:provider-health' -Passed (Test-Path $ProviderValidatorPath) -Detail $(if (Test-Path $ProviderValidatorPath) { 'found' } else { 'missing' }) -File 'scripts/validators/validate-provider-health.mjs'
            if (Test-Path $ProviderValidatorPath) {
                $output = node $ProviderValidatorPath 2>&1
                Add-KmCheck -Name 'validator-run:provider-health' -Passed ($LASTEXITCODE -eq 0) -Detail (($output | Out-String).Trim()) -File 'scripts/validators/validate-provider-health.mjs'
            }
        }
        elseif ($PhaseName -eq 'Build_Materializer') {
            $testPath = Join-Path $script:RepoRoot 'scripts/testing/Test-KingsmenCreator.ps1'
            Add-KmCheck -Name 'validator-exists:creator-self-test' -Passed (Test-Path $testPath) -Detail $(if (Test-Path $testPath) { 'found' } else { 'missing' }) -File 'scripts/testing/Test-KingsmenCreator.ps1'
            if (Test-Path $testPath) {
                $output = powershell -NoProfile -ExecutionPolicy Bypass -File $testPath 2>&1
                Add-KmCheck -Name 'validator-run:creator-self-test' -Passed ($LASTEXITCODE -eq 0) -Detail (($output | Out-String).Trim()) -File 'scripts/testing/Test-KingsmenCreator.ps1'
            }
        }
        else {
            Add-KmCheck -Name ('validator-supported:' + $PhaseName) -Passed $false -Detail 'No validator implemented for this phase yet.' -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
        }

        Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
    }

    if ($Action -eq 'Run') {
        if ($PhaseName -eq 'Scaffold') {
            $output = powershell -NoProfile -ExecutionPolicy Bypass -File $CreatorPath -Action Scaffold 2>&1
            Add-KmCheck -Name 'phase-run:Scaffold' -Passed ($LASTEXITCODE -eq 0) -Detail (($output | Out-String).Trim()) -File 'scripts/KINGSMEN_CREATOR.ps1'
        }
        else {
            Add-KmCheck -Name ('phase-run-supported:' + $PhaseName) -Passed $false -Detail 'Only Scaffold run is enabled in N01.6. Use Validate for proof checks.' -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
        }

        Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6.1 - manifests/master-build-index.json'
    }
} catch {
    Add-KmCheck -Name 'phase-runner:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/phases/Invoke-KingsmenPhase.ps1'
    Write-KmReport -ReportName 'n01-6-phase-runner-report.json' -Submodule 'N01.6' -NextTrackerRow 'N01.6 repair - runner crashed'
}
