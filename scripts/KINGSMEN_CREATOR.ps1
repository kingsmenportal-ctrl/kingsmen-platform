#requires -Version 5.1
<#
KINGSMEN_CREATOR.ps1
Founder-facing Windows-first build, validate, commit, and push runner.
Usage:
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Scaffold
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Materialize
  .\scripts\KINGSMEN_CREATOR.ps1 -Action Validate -ModuleName "n09-3"
  .\scripts\KINGSMEN_CREATOR.ps1 -Action GitCommit -CommitMessage "N09.3: Built"
  .\scripts\KINGSMEN_CREATOR.ps1 -Action FullBuild -ModuleName "n09-3" -CommitMessage "N09.3: Built and validated"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("Scaffold","Materialize","Validate","GitCommit","FullBuild")]
  [string]$Action,
  [Parameter(Mandatory=$false)] [string]$ModuleName,
  [Parameter(Mandatory=$false)] [string]$CommitMessage
)

$ErrorActionPreference = "Stop"
$script:RepoRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $script:RepoRoot ".git"))) {
  if (Test-Path (Join-Path (Get-Location) ".git")) { $script:RepoRoot = (Get-Location).Path }
  else { throw "Not inside a Git repository. Run from kingsmen-platform or place this script under scripts/." }
}
Set-Location $script:RepoRoot

function Write-KMLine([string]$Text,[string]$Color="Gray") { Write-Host $Text -ForegroundColor $Color }
function Ensure-Dir([string]$Path) { if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null } }

function Invoke-Scaffold {
  Write-KMLine "KINGSMEN CREATOR — SCAFFOLD" "Cyan"
  $dirs = @(
    "apps/web/src/app/(public)","apps/web/src/app/auth/login","apps/web/src/app/auth/register","apps/web/src/app/auth/passwordless",
    "apps/web/src/app/candidate/dashboard","apps/web/src/app/candidate/documents","apps/web/src/app/candidate/finance","apps/web/src/app/candidate/login","apps/web/src/app/candidate/map","apps/web/src/app/candidate/messages","apps/web/src/app/candidate/outcomes","apps/web/src/app/candidate/payments","apps/web/src/app/candidate/phoenix","apps/web/src/app/candidate/profile","apps/web/src/app/candidate/routes","apps/web/src/app/candidate/success","apps/web/src/app/candidate/support",
    "apps/web/src/app/founder/analytics","apps/web/src/app/founder/commands","apps/web/src/app/founder/comms","apps/web/src/app/founder/control-plane","apps/web/src/app/founder/mirror","apps/web/src/app/founder/mobile","apps/web/src/app/founder/schools",
    "apps/web/src/app/operator/documents","apps/web/src/app/operator/escalations","apps/web/src/app/operator/finance","apps/web/src/app/operator/opportunities","apps/web/src/app/operator/profile-review","apps/web/src/app/operator/routes","apps/web/src/app/operator/support","apps/web/src/app/operator/tribunal",
    "apps/web/src/app/partner","apps/web/src/app/pricing","apps/web/src/app/schools","apps/web/src/app/cv-revamp","apps/web/src/components/candidate","apps/web/src/components/founder","apps/web/src/components/n08","apps/web/src/components/ui","apps/web/src/lib","apps/web/public",
    "apps/api/src/auth","apps/api/src/candidate","apps/api/src/integrations","apps/api/src/kernel","apps/api/src/repositories","apps/api/src/routes","apps/api/src/server","apps/api/src/services",
    "apps/workers/src","packages/contracts/src","packages/db/src","scripts/validators","scripts/testing","scripts/phases","scripts/deploy","scripts/security","scripts/seed","scripts/db","scripts/seo","scripts/maintenance","config/environment","config/providers","config/creator","docs/modules","docs/database","docs/handover","docs/commands","reports/n09","reports/creator","reports/ui","reports/n02","reports/n03","reports/security","reports/oracle","reports/n20","reports/tracker","reports/validation","kingsmen/config","kingsmen/seeds","manifests/modules","supabase/migrations","infrastructure/nginx","infrastructure/docker",".github/workflows"
  )
  $created = 0
  foreach ($dir in $dirs) {
    $full = Join-Path $script:RepoRoot $dir
    if (-not (Test-Path $full)) { New-Item -ItemType Directory -Force -Path $full | Out-Null; $created++ }
    $gitkeep = Join-Path $full ".gitkeep"
    if (-not (Test-Path $gitkeep)) { "" | Set-Content -Path $gitkeep -Encoding UTF8 }
  }
  Write-KMLine "SCAFFOLD COMPLETE — created $created new directories; ensured $($dirs.Count) .gitkeep files." "Green"
}

function Invoke-Materialize {
  Write-KMLine "KINGSMEN CREATOR — MATERIALIZE FROM CLIPBOARD" "Cyan"
  $content = Get-Clipboard -Raw
  if ([string]::IsNullOrWhiteSpace($content)) { throw "Clipboard is empty." }
  $pattern = '(?s)FILE:\s*(.+?)\r?\n---\r?\n(.+?)(?=\r?\n---\r?\nFILE:|\r?\n---\s*$|$)'
  $matches = [regex]::Matches($content,$pattern)
  if ($matches.Count -eq 0) { throw "No FILE: blocks found. Use FILE: path / --- / content / --- format." }
  foreach ($m in $matches) {
    $path = $m.Groups[1].Value.Trim()
    $body = $m.Groups[2].Value.TrimEnd()
    $target = Join-Path $script:RepoRoot $path
    Ensure-Dir (Split-Path $target -Parent)
    [System.IO.File]::WriteAllText($target,$body,[System.Text.Encoding]::UTF8)
    Write-KMLine "WRITTEN: $path" "Green"
  }
  Write-KMLine "MATERIALIZE COMPLETE — $($matches.Count) files." "Green"
}

function Invoke-Validate([string]$Name) {
  if ([string]::IsNullOrWhiteSpace($Name)) { throw "ModuleName required for Validate." }
  $validator = Join-Path $script:RepoRoot "scripts/validators/validate-$Name.mjs"
  if (-not (Test-Path $validator)) { throw "Validator not found: $validator" }
  Write-KMLine "KINGSMEN CREATOR — VALIDATE $Name" "Cyan"
  & node $validator
  if ($LASTEXITCODE -ne 0) { throw "Validation failed for $Name. Exit code $LASTEXITCODE." }
  Write-KMLine "VALIDATION PASSED: $Name" "Green"
}

function Invoke-GitCommit([string]$Msg) {
  if ([string]::IsNullOrWhiteSpace($Msg)) { $Msg = "KINGSMEN_CREATOR auto-commit $(Get-Date -Format s)" }
  $status = git status --porcelain
  if ([string]::IsNullOrWhiteSpace($status)) { Write-KMLine "Nothing to commit." "Yellow"; return }
  git add .
  git commit -m $Msg
  $hash = git rev-parse HEAD
  Write-KMLine "COMMITTED: $hash" "Green"
  $branch = git branch --show-current
  if (-not [string]::IsNullOrWhiteSpace((git remote))) { git push origin $branch; Write-KMLine "PUSHED: origin/$branch" "Green" }
}

function Invoke-FullBuild([string]$Name,[string]$Msg) {
  Invoke-Materialize
  if (-not [string]::IsNullOrWhiteSpace($Name)) { Invoke-Validate $Name }
  Invoke-GitCommit $Msg
}

switch ($Action) {
  "Scaffold" { Invoke-Scaffold }
  "Materialize" { Invoke-Materialize }
  "Validate" { Invoke-Validate $ModuleName }
  "GitCommit" { Invoke-GitCommit $CommitMessage }
  "FullBuild" { Invoke-FullBuild $ModuleName $CommitMessage }
}
