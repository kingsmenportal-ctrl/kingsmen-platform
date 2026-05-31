#requires -Version 5.1
<#
CREATOR.2 - Test-KingsmenCreator.ps1
Validates the Windows-first KINGSMEN_CREATOR.ps1 foundation.
This script writes reports/creator/creator-validation-report.json.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$Checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
    param(
        [string] $Name,
        [bool] $Passed,
        [string] $Detail,
        [string] $File = ''
    )
    $Checks.Add([ordered]@{
        name = $Name
        passed = $Passed
        detail = $Detail
        file = $File
    }) | Out-Null
}

function Test-TextPresent {
    param(
        [string] $Content,
        [string] $Token,
        [string] $File
    )
    $present = $Content.Contains($Token)
    Add-Check -Name ('contains:' + $File + ':' + $Token) -Passed $present -Detail ($(if ($present) { 'found' } else { 'missing' })) -File $File
}

$CreatorPath = Join-Path $RepoRoot 'scripts/KINGSMEN_CREATOR.ps1'
$ReportDir = Join-Path $RepoRoot 'reports/creator'
$ReportPath = Join-Path $ReportDir 'creator-validation-report.json'

try {
    $exists = Test-Path $CreatorPath
    Add-Check -Name 'exists:scripts/KINGSMEN_CREATOR.ps1' -Passed $exists -Detail ($(if ($exists) { 'found' } else { 'missing' })) -File 'scripts/KINGSMEN_CREATOR.ps1'

    if ($exists) {
        $creator = Get-Content -Path $CreatorPath -Raw
        Test-TextPresent -Content $creator -Token "ValidateSet('Scaffold','Materialize','Validate','GitCommit','FullBuild')" -File 'scripts/KINGSMEN_CREATOR.ps1'
        Test-TextPresent -Content $creator -Token 'function Invoke-Scaffold' -File 'scripts/KINGSMEN_CREATOR.ps1'
        Test-TextPresent -Content $creator -Token 'function Invoke-Materialize' -File 'scripts/KINGSMEN_CREATOR.ps1'
        Test-TextPresent -Content $creator -Token 'function Invoke-Validate' -File 'scripts/KINGSMEN_CREATOR.ps1'
        Test-TextPresent -Content $creator -Token 'function Invoke-GitCommit' -File 'scripts/KINGSMEN_CREATOR.ps1'
        Test-TextPresent -Content $creator -Token 'function Invoke-FullBuild' -File 'scripts/KINGSMEN_CREATOR.ps1'

        $forbidden = @(
            @{ name = 'productionReadyTrue'; pattern = 'productionReady\s*[:=]\s*true' },
            @{ name = 'hardcodedPassword'; pattern = 'password\s*[:=]\s*["''][^"'']+' },
            @{ name = 'hardcodedToken'; pattern = 'token\s*[:=]\s*["''][^"'']+' },
            @{ name = 'hardcodedApiKey'; pattern = 'api[_-]?key\s*[:=]\s*["''][^"'']+' },
            @{ name = 'hardcodedSecret'; pattern = 'secret\s*[:=]\s*["''][^"'']+' }
        )

        foreach ($item in $forbidden) {
            $hit = [regex]::IsMatch($creator, $item.pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            Add-Check -Name ('forbidden:scripts/KINGSMEN_CREATOR.ps1:' + $item.name) -Passed (-not $hit) -Detail ($(if ($hit) { 'forbidden content found' } else { 'not found' })) -File 'scripts/KINGSMEN_CREATOR.ps1'
        }
    }

    $scaffoldOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $CreatorPath -Action Scaffold 2>&1
    Add-Check -Name 'creator-action:Scaffold' -Passed ($LASTEXITCODE -eq 0) -Detail (($scaffoldOutput | Out-String).Trim()) -File 'scripts/KINGSMEN_CREATOR.ps1'

} catch {
    Add-Check -Name 'creator-test:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/testing/Test-KingsmenCreator.ps1'
}

$failed = @($Checks | Where-Object { -not $_.passed })
$report = [ordered]@{
    module = 'CREATOR'
    submodule = 'CREATOR.2'
    validator = 'Test-KingsmenCreator.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    passed = ($failed.Count -eq 0)
    totalChecks = $Checks.Count
    failedChecks = $failed.Count
    failed = @($failed)
    checks = @($Checks)
    nextTrackerRow = $(if ($failed.Count -eq 0) { 'CREATOR.3 - reports/creator/creator-validation-report.json' } else { 'CREATOR.2 repair - fix failed checks in reports/creator/creator-validation-report.json' })
}

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 8

if ($failed.Count -eq 0) {
    exit 0
}
exit 1
