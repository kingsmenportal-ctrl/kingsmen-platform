#requires -Version 5.1
<#
CREATOR.2 - Test-KingsmenCreator.ps1
PowerShell 5.1-safe self-test for scripts/KINGSMEN_CREATOR.ps1.
Writes reports/creator/creator-validation-report.json.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

$Checks = @()

function Add-KmCheck {
    param(
        [string] $Name,
        $Passed,
        [string] $Detail,
        [string] $File
    )

    $script:Checks += [pscustomobject]@{
        name = $Name
        passed = [bool]$Passed
        detail = $Detail
        file = $File
    }
}

function Add-ContainsCheck {
    param(
        [string] $Content,
        [string] $Token,
        [string] $File
    )

    $present = $Content.IndexOf($Token, [System.StringComparison]::Ordinal) -ge 0
    Add-KmCheck -Name ('contains:' + $File + ':' + $Token) -Passed $present -Detail $(if ($present) { 'found' } else { 'missing' }) -File $File
}

$CreatorRelativePath = 'scripts/KINGSMEN_CREATOR.ps1'
$CreatorPath = Join-Path $RepoRoot $CreatorRelativePath
$ReportDir = Join-Path $RepoRoot 'reports/creator'
$ReportPath = Join-Path $ReportDir 'creator-validation-report.json'

try {
    $exists = Test-Path $CreatorPath
    Add-KmCheck -Name ('exists:' + $CreatorRelativePath) -Passed $exists -Detail $(if ($exists) { 'found' } else { 'missing' }) -File $CreatorRelativePath

    if ($exists) {
        $creator = Get-Content -Path $CreatorPath -Raw

        Add-ContainsCheck -Content $creator -Token "ValidateSet('Scaffold','Materialize','Validate','GitCommit','FullBuild')" -File $CreatorRelativePath
        Add-ContainsCheck -Content $creator -Token 'function Invoke-Scaffold' -File $CreatorRelativePath
        Add-ContainsCheck -Content $creator -Token 'function Invoke-Materialize' -File $CreatorRelativePath
        Add-ContainsCheck -Content $creator -Token 'function Invoke-Validate' -File $CreatorRelativePath
        Add-ContainsCheck -Content $creator -Token 'function Invoke-GitCommit' -File $CreatorRelativePath
        Add-ContainsCheck -Content $creator -Token 'function Invoke-FullBuild' -File $CreatorRelativePath

        $productionReadyTrue = $creator -match 'productionReady\s*[:=]\s*true'
        Add-KmCheck -Name ('forbidden:' + $CreatorRelativePath + ':productionReadyTrue') -Passed (-not $productionReadyTrue) -Detail $(if ($productionReadyTrue) { 'forbidden content found' } else { 'not found' }) -File $CreatorRelativePath

        $secretWords = @('SUPABASE_SERVICE_ROLE','SMTP_PASSWORD','WHATSAPP_TOKEN','PAYMENT_SECRET','AIRTABLE_TOKEN')
        foreach ($word in $secretWords) {
            $hit = $creator.IndexOf($word, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
            Add-KmCheck -Name ('forbidden:' + $CreatorRelativePath + ':' + $word) -Passed (-not $hit) -Detail $(if ($hit) { 'forbidden content found' } else { 'not found' }) -File $CreatorRelativePath
        }

        $scaffoldOutput = powershell -NoProfile -ExecutionPolicy Bypass -File $CreatorPath -Action Scaffold 2>&1
        $scaffoldPassed = ($LASTEXITCODE -eq 0)
        Add-KmCheck -Name 'creator-action:Scaffold' -Passed $scaffoldPassed -Detail (($scaffoldOutput | Out-String).Trim()) -File $CreatorRelativePath
    }
} catch {
    Add-KmCheck -Name 'creator-test:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/testing/Test-KingsmenCreator.ps1'
}

$Failed = @($Checks | Where-Object { -not $_.passed })
$Passed = ($Failed.Count -eq 0)

$Report = [ordered]@{
    module = 'CREATOR'
    submodule = 'CREATOR.2'
    validator = 'Test-KingsmenCreator.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    passed = $Passed
    totalChecks = @($Checks).Count
    failedChecks = @($Failed).Count
    failed = @($Failed)
    checks = @($Checks)
    nextTrackerRow = $(if ($Passed) { 'CREATOR.3 - reports/creator/creator-validation-report.json' } else { 'CREATOR.2 repair - fix failed checks in reports/creator/creator-validation-report.json' })
}

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Report | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8
$Report | ConvertTo-Json -Depth 8

if ($Passed) {
    exit 0
}

exit 1
