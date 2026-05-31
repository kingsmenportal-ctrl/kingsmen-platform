#requires -Version 5.1
<#
N01.8 - prune-logs.ps1
Oracle Lite maintenance job for safe log/report pruning.

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\maintenance\prune-logs.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\maintenance\prune-logs.ps1 -DryRun
  powershell -ExecutionPolicy Bypass -File .\scripts\maintenance\prune-logs.ps1 -KeepDays 14 -MaxLogMb 250

Writes:
  reports/maintenance/prune-logs-report.json

This script must never delete candidate documents, raw evidence, manifests, migrations, source code, or tracker files.
#>

[CmdletBinding()]
param(
    [int] $KeepDays = 30,
    [int] $MaxLogMb = 500,
    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

function Get-KmRepoRoot {
    $fromScript = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
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

function Add-KmAction {
    param(
        [string] $Path,
        [string] $Action,
        [Int64] $Bytes,
        [string] $Reason
    )

    $script:Actions += [pscustomobject]@{
        path = $Path
        action = $Action
        bytes = $Bytes
        reason = $Reason
    }
}

$RepoRoot = Get-KmRepoRoot
Set-Location $RepoRoot

$script:Checks = @()
$script:Actions = @()
$ReportDir = Join-Path $RepoRoot 'reports/maintenance'
$ReportPath = Join-Path $ReportDir 'prune-logs-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$ProtectedRelativeRoots = @(
    'apps',
    'packages',
    'scripts',
    'config',
    'kingsmen',
    'manifests',
    'supabase',
    'infrastructure',
    '.github'
)

$ProtectedExactFiles = @(
    'Kingsmen_Build_Tracker.csv',
    'README.md',
    'package.json',
    'docker-compose.yml'
)

$PrunableRelativeRoots = @(
    'logs',
    'tmp',
    'reports/maintenance',
    'reports/validation',
    'reports/phases',
    'reports/oracle',
    'reports/security',
    'reports/ui',
    'reports/tracker'
)

$ReportKeepAlways = @(
    'reports/n09/n09-3-validation-report.json',
    'reports/creator/creator-validation-report.json',
    'reports/validation/provider-health-report.json',
    'reports/phases/n01-6-phase-runner-report.json'
)

$AllowedExtensions = @('.log', '.tmp', '.bak', '.old', '.trace', '.jsonl')
$Cutoff = (Get-Date).AddDays(-1 * [Math]::Abs($KeepDays))
$MaxBytes = [Int64]$MaxLogMb * 1024 * 1024

try {
    Add-KmCheck -Name 'productionReady:false' -Passed $true -Detail 'maintenance script is non-production proof mode' -File 'scripts/maintenance/prune-logs.ps1'
    Add-KmCheck -Name 'repo-root:exists' -Passed (Test-Path (Join-Path $RepoRoot '.git')) -Detail $RepoRoot -File '.git'
    Add-KmCheck -Name 'keep-days:positive' -Passed ($KeepDays -gt 0) -Detail ('KeepDays=' + $KeepDays) -File 'scripts/maintenance/prune-logs.ps1'
    Add-KmCheck -Name 'max-log-mb:positive' -Passed ($MaxLogMb -gt 0) -Detail ('MaxLogMb=' + $MaxLogMb) -File 'scripts/maintenance/prune-logs.ps1'

    $CandidateForbiddenRoots = @('candidate_documents', 'raw_evidence', 'documents', 'evidence')
    foreach ($root in $CandidateForbiddenRoots) {
        $full = Join-Path $RepoRoot $root
        Add-KmCheck -Name ('protected-root-not-targeted:' + $root) -Passed (-not ($PrunableRelativeRoots -contains $root)) -Detail 'not in prune target list' -File $root
    }

    $Candidates = @()
    foreach ($relativeRoot in $PrunableRelativeRoots) {
        $fullRoot = Join-Path $RepoRoot $relativeRoot
        if (-not (Test-Path $fullRoot)) {
            Add-KmCheck -Name ('prune-root:missing-ok:' + $relativeRoot) -Passed $true -Detail 'root does not exist yet' -File $relativeRoot
            continue
        }

        Add-KmCheck -Name ('prune-root:exists:' + $relativeRoot) -Passed $true -Detail 'found' -File $relativeRoot
        $files = Get-ChildItem -Path $fullRoot -Recurse -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($RepoRoot.Length).TrimStart('\','/') -replace '\\','/'

            if ($ReportKeepAlways -contains $relativePath) {
                Add-KmAction -Path $relativePath -Action 'kept' -Bytes $file.Length -Reason 'protected proof report'
                continue
            }

            $ext = [System.IO.Path]::GetExtension($file.Name).ToLowerInvariant()
            $isOld = $file.LastWriteTime -lt $Cutoff
            $isAllowedExtension = $AllowedExtensions -contains $ext
            $isOversized = $file.Length -gt $MaxBytes

            if (($isOld -and $isAllowedExtension) -or $isOversized) {
                $Candidates += $file
            }
            else {
                Add-KmAction -Path $relativePath -Action 'kept' -Bytes $file.Length -Reason 'not old/oversized or extension not prunable'
            }
        }
    }

    $deletedBytes = [Int64]0
    foreach ($file in $Candidates) {
        $relativePath = $file.FullName.Substring($RepoRoot.Length).TrimStart('\','/') -replace '\\','/'

        $blocked = $false
        foreach ($protected in $ProtectedExactFiles) {
            if ($relativePath -eq $protected) { $blocked = $true }
        }
        foreach ($protectedRoot in $ProtectedRelativeRoots) {
            if ($relativePath.StartsWith($protectedRoot + '/', [System.StringComparison]::OrdinalIgnoreCase)) {
                if (-not ($relativePath.StartsWith('reports/', [System.StringComparison]::OrdinalIgnoreCase))) {
                    $blocked = $true
                }
            }
        }

        if ($blocked) {
            Add-KmAction -Path $relativePath -Action 'blocked' -Bytes $file.Length -Reason 'protected repo artifact'
            continue
        }

        if ($DryRun) {
            Add-KmAction -Path $relativePath -Action 'would_delete' -Bytes $file.Length -Reason 'dry run candidate'
        }
        else {
            $deletedBytes += $file.Length
            Remove-Item -Path $file.FullName -Force
            Add-KmAction -Path $relativePath -Action 'deleted' -Bytes $file.Length -Reason 'old/oversized prunable file'
        }
    }

    Add-KmCheck -Name 'candidate-documents-not-deleted' -Passed $true -Detail 'candidate document/evidence roots are never in prune target list' -File 'scripts/maintenance/prune-logs.ps1'
    Add-KmCheck -Name 'tracker-not-deleted' -Passed (Test-Path (Join-Path $RepoRoot 'Kingsmen_Build_Tracker.csv')) -Detail 'tracker remains present' -File 'Kingsmen_Build_Tracker.csv'

} catch {
    Add-KmCheck -Name 'prune-logs:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/maintenance/prune-logs.ps1'
}

$Failed = @($Checks | Where-Object { -not $_.passed })
$Passed = ($Failed.Count -eq 0)
$Report = [ordered]@{
    module = 'N01'
    submodule = 'N01.8'
    maintenanceJob = 'scripts/maintenance/prune-logs.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    dryRun = [bool]$DryRun
    keepDays = $KeepDays
    maxLogMb = $MaxLogMb
    passed = $Passed
    totalChecks = @($Checks).Count
    failedChecks = @($Failed).Count
    deletedBytes = $deletedBytes
    prunableRoots = $PrunableRelativeRoots
    protectedProofReports = $ReportKeepAlways
    failed = @($Failed)
    checks = @($Checks)
    actions = @($Actions)
    nextTrackerRow = $(if ($Passed) { 'N01.8.1 - scripts/validators/validate-health.mjs' } else { 'N01.8 repair - fix failed checks in reports/maintenance/prune-logs-report.json' })
}

$Report | ConvertTo-Json -Depth 10 | Set-Content -Path $ReportPath -Encoding UTF8
$Report | ConvertTo-Json -Depth 10

if ($Passed) {
    exit 0
}

exit 1
