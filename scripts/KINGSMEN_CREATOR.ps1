#requires -Version 5.1
<#
KINGSMEN_CREATOR.ps1
Founder-facing Windows-first build, validate, commit, and push runner.

Commands:
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Scaffold
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Materialize
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Validate -ModuleName n09-3
  .\scripts\KINGSMEN_CREATOR.ps1 -Action GitCommit -CommitMessage "message"
  .\scripts\KINGSMEN_CREATOR.ps1 -Action FullBuild -ModuleName n09-3 -CommitMessage "message"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Scaffold','Materialize','Validate','GitCommit','FullBuild')]
    [string] $Action,

    [Parameter(Mandatory = $false)]
    [string] $ModuleName = '',

    [Parameter(Mandatory = $false)]
    [string] $CommitMessage = ''
)

$ErrorActionPreference = 'Stop'

function Write-KMLine {
    param(
        [Parameter(Mandatory = $true)] [string] $Text,
        [Parameter(Mandatory = $false)] [string] $Color = 'Gray'
    )
    Write-Host $Text -ForegroundColor $Color
}

function Get-KMRepoRoot {
    $fromScript = Split-Path -Parent $PSScriptRoot
    if (Test-Path (Join-Path $fromScript '.git')) {
        return $fromScript
    }

    $fromCurrent = (Get-Location).Path
    if (Test-Path (Join-Path $fromCurrent '.git')) {
        return $fromCurrent
    }

    throw 'Not inside a Git repository. Run from kingsmen-platform or place this script under scripts/.'
}

$script:RepoRoot = Get-KMRepoRoot
Set-Location $script:RepoRoot

function Ensure-Dir {
    param([Parameter(Mandatory = $true)] [string] $Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Force -Path $Path | Out-Null
    }
}

function Invoke-Scaffold {
    Write-KMLine -Text 'KINGSMEN CREATOR | SCAFFOLD' -Color 'Cyan'

    $dirs = @(
        'apps/web/src/app/(public)',
        'apps/web/src/app/auth/login',
        'apps/web/src/app/auth/register',
        'apps/web/src/app/auth/passwordless',
        'apps/web/src/app/candidate/dashboard',
        'apps/web/src/app/candidate/documents',
        'apps/web/src/app/candidate/finance',
        'apps/web/src/app/candidate/login',
        'apps/web/src/app/candidate/map',
        'apps/web/src/app/candidate/messages',
        'apps/web/src/app/candidate/outcomes',
        'apps/web/src/app/candidate/payments',
        'apps/web/src/app/candidate/phoenix',
        'apps/web/src/app/candidate/profile',
        'apps/web/src/app/candidate/routes',
        'apps/web/src/app/candidate/success',
        'apps/web/src/app/candidate/support',
        'apps/web/src/app/founder/analytics',
        'apps/web/src/app/founder/commands',
        'apps/web/src/app/founder/comms',
        'apps/web/src/app/founder/control-plane',
        'apps/web/src/app/founder/mirror',
        'apps/web/src/app/founder/mobile',
        'apps/web/src/app/founder/schools',
        'apps/web/src/app/operator/documents',
        'apps/web/src/app/operator/escalations',
        'apps/web/src/app/operator/finance',
        'apps/web/src/app/operator/opportunities',
        'apps/web/src/app/operator/profile-review',
        'apps/web/src/app/operator/routes',
        'apps/web/src/app/operator/support',
        'apps/web/src/app/operator/tribunal',
        'apps/web/src/app/partner',
        'apps/web/src/app/pricing',
        'apps/web/src/app/schools',
        'apps/web/src/app/cv-revamp',
        'apps/web/src/components/candidate',
        'apps/web/src/components/founder',
        'apps/web/src/components/n08',
        'apps/web/src/components/ui',
        'apps/web/src/lib',
        'apps/web/public',
        'apps/api/src/auth',
        'apps/api/src/candidate',
        'apps/api/src/integrations',
        'apps/api/src/kernel',
        'apps/api/src/repositories',
        'apps/api/src/routes',
        'apps/api/src/server',
        'apps/api/src/services',
        'apps/workers/src',
        'packages/contracts/src',
        'packages/db/src',
        'scripts/validators',
        'scripts/testing',
        'scripts/phases',
        'scripts/deploy',
        'scripts/security',
        'scripts/seed',
        'scripts/db',
        'scripts/seo',
        'scripts/maintenance',
        'config/environment',
        'config/providers',
        'config/creator',
        'docs/modules',
        'docs/database',
        'docs/handover',
        'docs/commands',
        'reports/n09',
        'reports/creator',
        'reports/ui',
        'reports/n02',
        'reports/n03',
        'reports/security',
        'reports/oracle',
        'reports/n20',
        'reports/tracker',
        'reports/validation',
        'kingsmen/config',
        'kingsmen/seeds',
        'manifests/modules',
        'supabase/migrations',
        'infrastructure/nginx',
        'infrastructure/docker',
        '.github/workflows'
    )

    $created = 0
    foreach ($dir in $dirs) {
        $full = Join-Path $script:RepoRoot $dir
        if (-not (Test-Path $full)) {
            New-Item -ItemType Directory -Force -Path $full | Out-Null
            $created++
        }
        $gitkeep = Join-Path $full '.gitkeep'
        if (-not (Test-Path $gitkeep)) {
            '' | Set-Content -Path $gitkeep -Encoding UTF8
        }
    }

    Write-KMLine -Text ('SCAFFOLD COMPLETE | Created directories: ' + $created + ' | Ensured placeholders: ' + $dirs.Count) -Color 'Green'
}

function Invoke-Materialize {
    Write-KMLine -Text 'KINGSMEN CREATOR | MATERIALIZE FROM CLIPBOARD' -Color 'Cyan'

    $content = Get-Clipboard -Raw
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw 'Clipboard is empty. Copy FILE blocks first.'
    }

    $lines = $content -split "`r?`n"
    $currentPath = $null
    $buffer = New-Object System.Collections.Generic.List[string]
    $written = 0

    function Flush-CurrentFile {
        if ([string]::IsNullOrWhiteSpace($script:CurrentMaterializePath)) {
            return
        }
        $target = Join-Path $script:RepoRoot $script:CurrentMaterializePath
        Ensure-Dir -Path (Split-Path -Parent $target)
        $body = [string]::Join([Environment]::NewLine, $script:CurrentMaterializeBuffer.ToArray())
        [System.IO.File]::WriteAllText($target, $body, [System.Text.Encoding]::UTF8)
        Write-KMLine -Text ('WRITTEN: ' + $script:CurrentMaterializePath) -Color 'Green'
        $script:CurrentMaterializeWritten++
    }

    $script:CurrentMaterializePath = $null
    $script:CurrentMaterializeBuffer = New-Object System.Collections.Generic.List[string]
    $script:CurrentMaterializeWritten = 0
    $state = 'searching'

    foreach ($line in $lines) {
        if ($line -like 'FILE:*') {
            Flush-CurrentFile
            $script:CurrentMaterializePath = $line.Substring(5).Trim()
            $script:CurrentMaterializeBuffer = New-Object System.Collections.Generic.List[string]
            $state = 'awaiting_separator'
            continue
        }

        if ($state -eq 'awaiting_separator') {
            if ($line.Trim() -eq '---') {
                $state = 'collecting'
            }
            continue
        }

        if ($state -eq 'collecting') {
            if ($line.Trim() -eq '---') {
                Flush-CurrentFile
                $script:CurrentMaterializePath = $null
                $script:CurrentMaterializeBuffer = New-Object System.Collections.Generic.List[string]
                $state = 'searching'
                continue
            }
            $script:CurrentMaterializeBuffer.Add($line) | Out-Null
        }
    }

    Flush-CurrentFile

    if ($script:CurrentMaterializeWritten -eq 0) {
        throw 'No FILE blocks found. Use: FILE: path, then ---, then content, then ---.'
    }

    Write-KMLine -Text ('MATERIALIZE COMPLETE | Files written: ' + $script:CurrentMaterializeWritten) -Color 'Green'
}

function Invoke-Validate {
    param([Parameter(Mandatory = $true)] [string] $Name)

    if ([string]::IsNullOrWhiteSpace($Name)) {
        throw 'ModuleName is required for Validate.'
    }

    $validator = Join-Path $script:RepoRoot ('scripts/validators/validate-' + $Name + '.mjs')
    if (-not (Test-Path $validator)) {
        throw ('Validator not found: ' + $validator)
    }

    Write-KMLine -Text ('KINGSMEN CREATOR | VALIDATE ' + $Name) -Color 'Cyan'
    & node $validator
    if ($LASTEXITCODE -ne 0) {
        throw ('Validation failed for ' + $Name + '. Exit code ' + $LASTEXITCODE)
    }
    Write-KMLine -Text ('VALIDATION PASSED: ' + $Name) -Color 'Green'
}

function Invoke-GitCommit {
    param([Parameter(Mandatory = $false)] [string] $Msg)

    if ([string]::IsNullOrWhiteSpace($Msg)) {
        $Msg = 'KINGSMEN_CREATOR auto-commit ' + (Get-Date -Format 's')
    }

    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-KMLine -Text 'Nothing to commit.' -Color 'Yellow'
        return
    }

    git add .
    git commit -m $Msg
    if ($LASTEXITCODE -ne 0) {
        throw 'Git commit failed.'
    }

    $hash = git rev-parse HEAD
    Write-KMLine -Text ('COMMITTED: ' + $hash) -Color 'Green'

    $branch = git branch --show-current
    $remote = git remote
    if (-not [string]::IsNullOrWhiteSpace($remote)) {
        git push origin $branch
        if ($LASTEXITCODE -ne 0) {
            throw 'Git push failed.'
        }
        Write-KMLine -Text ('PUSHED: origin/' + $branch) -Color 'Green'
    }
}

function Invoke-FullBuild {
    param(
        [Parameter(Mandatory = $false)] [string] $Name,
        [Parameter(Mandatory = $false)] [string] $Msg
    )

    Invoke-Materialize
    if (-not [string]::IsNullOrWhiteSpace($Name)) {
        Invoke-Validate -Name $Name
    }
    Invoke-GitCommit -Msg $Msg
}

switch ($Action) {
    'Scaffold' { Invoke-Scaffold }
    'Materialize' { Invoke-Materialize }
    'Validate' { Invoke-Validate -Name $ModuleName }
    'GitCommit' { Invoke-GitCommit -Msg $CommitMessage }
    'FullBuild' { Invoke-FullBuild -Name $ModuleName -Msg $CommitMessage }
}

Write-KMLine -Text 'DONE' -Color 'Cyan'
