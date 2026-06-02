#requires -Version 5.1
[CmdletBinding()]
param(
  [ValidateSet('', 'AuditExisting','Validate','N09.3Complete','Report','Doctor','Help')]
  [string]$Phase = '',

  [ValidateSet('', 'Help','Scaffold','Materialize','Validate','GitCommit','FullBuild')]
  [string]$Action = '',

  [string]$ModuleName = '',
  [string]$InputFile = '',
  [string]$CommitMessage = '',
  [string]$Root = '',
  [switch]$FailOnMissingOptional
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-RepoRoot {
  $current = Get-Location
  while ($null -ne $current) {
    if (Test-Path (Join-Path $current.Path ".git") -PathType Container) {
      return $current.Path
    }
    $parent = Split-Path -Parent $current.Path
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current.Path) { break }
    $current = Get-Item $parent
  }
  throw "ERROR: Not inside a Git repository."
}

$RepoRoot = Resolve-RepoRoot
$ReportsRoot = Join-Path $RepoRoot "reports"
$CreatorReports = Join-Path $ReportsRoot "creator"

function Write-JsonNoBom {
  param([string]$Path, [object]$Data)
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $json = $Data | ConvertTo-Json -Depth 80
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, $utf8)
}

function New-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail = "")
  [pscustomobject]@{ name = $Name; passed = $Passed; detail = $Detail }
}

function Write-ActionReport {
  param([string]$Name, [bool]$Passed, [object[]]$Checks, [string]$Detail = "")
  $failed = @($Checks | Where-Object { $_.passed -ne $true })
  $report = [pscustomobject]@{
    schema = "kingsmen.creator-action-report.v1"
    module = "CREATOR"
    submodule = "CREATOR.2B"
    action = $Name
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    repoRoot = $RepoRoot
    passed = ($Passed -and $failed.Count -eq 0)
    detail = $Detail
    totalChecks = $Checks.Count
    failedChecks = $failed.Count
    failed = $failed
    checks = $Checks
  }
  Write-JsonNoBom -Path (Join-Path $CreatorReports ("creator-action-{0}-report.json" -f $Name.ToLowerInvariant())) -Data $report
  $report | ConvertTo-Json -Depth 80
  if ($report.passed -ne $true) { exit 1 }
  exit 0
}

function Invoke-Phase {
  param([string]$Name)
  $phaseScript = Join-Path $RepoRoot "scripts\KINGSMEN_CREATOR_PHASE.ps1"
  if (-not (Test-Path $phaseScript)) { throw "Missing scripts\KINGSMEN_CREATOR_PHASE.ps1" }
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $phaseScript -Phase $Name
  exit $LASTEXITCODE
}

function Invoke-Scaffold {
  $dirs = @(
    "docs","docs\constitution","docs\reality","docs\growth","docs\business","docs\tools",
    "manifests","manifests\modules","manifests\proof","manifests\tools","manifests\business",
    "apps","apps\api","apps\api\src","apps\web","apps\web\src",
    "packages","packages\contracts","packages\contracts\src","packages\db","packages\db\src",
    "scripts","scripts\validators","scripts\testing",
    "reports","reports\creator","reports\validation","reports\n09",
    "incoming",".github",".github\workflows"
  )
  $checks = @()
  foreach ($d in $dirs) {
    $p = Join-Path $RepoRoot $d
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
    $checks += New-Check -Name "scaffold:$d" -Passed (Test-Path $p) -Detail "directory ensured"
  }
  Write-ActionReport -Name "Scaffold" -Passed $true -Checks $checks -Detail "Repository skeleton ensured."
}

function Get-ValidatorPath {
  param([string]$Name)
  switch ($Name.ToLowerInvariant()) {
    "merge-foundation" { "scripts\validators\validate-merge-foundation.mjs" }
    "creator-normalize" { "scripts\validators\validate-creator-normalize.mjs" }
    "creator-2b" { "scripts\validators\validate-creator-action-layer.mjs" }
    default { "scripts\validators\validate-$Name.mjs" }
  }
}

function Invoke-ValidateAction {
  $checks = @()

  if ([string]::IsNullOrWhiteSpace($ModuleName)) {
    $checks += New-Check -Name "validate:module-name" -Passed $false -Detail "ModuleName required"
    Write-ActionReport -Name "Validate" -Passed $false -Checks $checks -Detail "Missing ModuleName."
  }

  $validator = Get-ValidatorPath -Name $ModuleName
  $full = Join-Path $RepoRoot $validator

  $checks += New-Check -Name "validate:validator-exists" -Passed (Test-Path $full) -Detail $validator

  if (Test-Path $full) {
    Push-Location $RepoRoot
    try {
      & node $validator
      $code = $LASTEXITCODE
      $checks += New-Check -Name "validate:exit-code" -Passed ($code -eq 0) -Detail "exitCode=$code"
    } finally {
      Pop-Location
    }
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })
  Write-ActionReport -Name "Validate" -Passed ($failed.Count -eq 0) -Checks $checks -Detail "Validator executed for $ModuleName."
}

function Invoke-Materialize {
  $checks = @()

  if ([string]::IsNullOrWhiteSpace($InputFile)) {
    $checks += New-Check -Name "materialize:input-file" -Passed $false -Detail "InputFile required"
    Write-ActionReport -Name "Materialize" -Passed $false -Checks $checks -Detail "Use -InputFile."
  }

  $input = if ([System.IO.Path]::IsPathRooted($InputFile)) { $InputFile } else { Join-Path $RepoRoot $InputFile }

  if (-not (Test-Path $input)) {
    $checks += New-Check -Name "materialize:input-exists" -Passed $false -Detail $InputFile
    Write-ActionReport -Name "Materialize" -Passed $false -Checks $checks -Detail "Input file missing."
  }

  $raw = Get-Content $input -Raw
  $pattern = '(?s)FILE:\s*(.+?)\r?\n---\r?\n(.+?)(?=\r?\n---\r?\nFILE:|\r?\n---\r?\n$|$)'
  $matches = [regex]::Matches($raw, $pattern)

  $checks += New-Check -Name "materialize:blocks" -Passed ($matches.Count -gt 0) -Detail "blocks=$($matches.Count)"

  foreach ($m in $matches) {
    $rel = $m.Groups[1].Value.Trim().Replace("\","/")
    if ($rel -match '(^|/)\.\.(/|$)' -or [System.IO.Path]::IsPathRooted($rel)) {
      $checks += New-Check -Name "materialize:path-safe:$rel" -Passed $false -Detail "unsafe"
      continue
    }
    $target = Join-Path $RepoRoot $rel
    $dir = Split-Path -Parent $target
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($target, $m.Groups[2].Value.TrimEnd() + [Environment]::NewLine, $utf8)
    $checks += New-Check -Name "materialize:wrote:$rel" -Passed (Test-Path $target) -Detail "written"
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })
  Write-ActionReport -Name "Materialize" -Passed ($failed.Count -eq 0) -Checks $checks -Detail "Materialize complete."
}

function Invoke-GitCommitAction {
  $checks = @()
  $msg = if ([string]::IsNullOrWhiteSpace($CommitMessage)) { "Kingsmen Creator checkpoint" } else { $CommitMessage }

  Push-Location $RepoRoot
  try {
    $dirty = git status --porcelain
    if (-not $dirty) {
      $checks += New-Check -Name "git:changes" -Passed $true -Detail "nothing to commit"
      Write-ActionReport -Name "GitCommit" -Passed $true -Checks $checks -Detail "No changes to commit."
    }
    git add -A
    $checks += New-Check -Name "git:add" -Passed ($LASTEXITCODE -eq 0) -Detail "git add"
    git commit -m $msg
    $checks += New-Check -Name "git:commit" -Passed ($LASTEXITCODE -eq 0) -Detail $msg
  } finally {
    Pop-Location
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })
  Write-ActionReport -Name "GitCommit" -Passed ($failed.Count -eq 0) -Checks $checks -Detail "Commit attempted. Push manually."
}

function Invoke-FullBuild {
  $checks = @()

  if (-not [string]::IsNullOrWhiteSpace($InputFile)) {
    Invoke-Materialize
  }

  if ([string]::IsNullOrWhiteSpace($ModuleName)) {
    $checks += New-Check -Name "fullbuild:module-name" -Passed $false -Detail "ModuleName required"
    Write-ActionReport -Name "FullBuild" -Passed $false -Checks $checks -Detail "FullBuild requires ModuleName."
  }

  Invoke-ValidateAction
}

if (-not [string]::IsNullOrWhiteSpace($Phase) -and -not [string]::IsNullOrWhiteSpace($Action)) {
  throw "Use either -Phase or -Action, not both."
}

if (-not [string]::IsNullOrWhiteSpace($Phase)) {
  Invoke-Phase -Name $Phase
}

if ([string]::IsNullOrWhiteSpace($Action)) {
  $Action = "Help"
}

switch ($Action) {
  "Help" {
    [pscustomobject]@{
      module = "CREATOR"
      submodule = "CREATOR.2B"
      productionReady = $false
      actions = @("Scaffold","Materialize","Validate","GitCommit","FullBuild")
      examples = @(
        ".\scripts\KINGSMEN_CREATOR.ps1 -Action Scaffold",
        ".\scripts\KINGSMEN_CREATOR.ps1 -Action Validate -ModuleName merge-foundation"
      )
    } | ConvertTo-Json -Depth 20
    exit 0
  }
  "Scaffold" { Invoke-Scaffold }
  "Materialize" { Invoke-Materialize }
  "Validate" { Invoke-ValidateAction }
  "GitCommit" { Invoke-GitCommitAction }
  "FullBuild" { Invoke-FullBuild }
}