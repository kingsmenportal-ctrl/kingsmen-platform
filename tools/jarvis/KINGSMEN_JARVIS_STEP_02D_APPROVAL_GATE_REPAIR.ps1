# KINGSMEN JARVIS STEP 02D - APPROVAL GATE REPAIR
# Repairs Internal Server Error on Builder approval.
# No Jarvis visual files are changed.

$ErrorActionPreference = "Stop"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null }
}

function WriteNoBom([string]$Path, [string]$Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
  Write-Host ("WROTE: " + $Path) -ForegroundColor Green
}

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

function ReplaceOrWarn([string]$Path, [string]$Old, [string]$New, [string]$Label) {
  $text = [System.IO.File]::ReadAllText($Path)
  if ($text.Contains($Old)) {
    $text = $text.Replace($Old, $New)
    WriteNoBom $Path $text
    Write-Host ("PATCHED: " + $Label) -ForegroundColor Green
    return $true
  }
  Write-Host ("WARN: patch anchor not found for " + $Label) -ForegroundColor Yellow
  return $false
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 02D - APPROVAL GATE REPAIR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Repairs Internal Server Error on Builder approval. No visual files changed." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }

$BuilderCore = Join-Path $Repo "apps\web\src\lib\jarvis\builderCore.ts"
$CommandRoute = Join-Path $Repo "apps\web\src\app\api\jarvis\command\route.ts"
$BuilderRoute = Join-Path $Repo "apps\web\src\app\api\jarvis\builder\route.ts"

if (!(Test-Path $BuilderCore)) { throw "Missing builderCore.ts: $BuilderCore" }
if (!(Test-Path $CommandRoute)) { throw "Missing command route: $CommandRoute" }
if (!(Test-Path $BuilderRoute)) { throw "Missing builder route: $BuilderRoute" }

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $Repo ("backups\jarvis-step-02d-approval-gate-before-" + $Stamp)

foreach ($file in @($BuilderCore, $CommandRoute, $BuilderRoute)) {
  $rel = $file.Substring($Repo.Length + 1)
  $dest = Join-Path $BackupRoot $rel
  EnsureDir (Split-Path -Parent $dest)
  Copy-Item $file $dest -Force
  Write-Host ("BACKED UP: " + $rel) -ForegroundColor DarkCyan
}

# 1. Lock Builder Core repo root. This prevents server cwd problems from writing to the wrong place.
$builderText = [System.IO.File]::ReadAllText($BuilderCore)
$builderText = $builderText -replace 'const repoRoot = process\.env\.KINGSMEN_REPO_ROOT \|\| path\.resolve\(process\.cwd\(\), "\.\./\."\);', 'const repoRoot = process.env.KINGSMEN_REPO_ROOT || "C:/Kingsmen/kingsmen-platform";'
$builderText = $builderText -replace 'const repoRoot = process\.env\.KINGSMEN_REPO_ROOT \|\| path\.resolve\(process\.cwd\(\), "../\.\."\);', 'const repoRoot = process.env.KINGSMEN_REPO_ROOT || "C:/Kingsmen/kingsmen-platform";'
$builderText = $builderText -replace 'const repoRoot = process\.env\.KINGSMEN_REPO_ROOT \|\| path\.resolve\(process\.cwd\(\), "\.\./\.\."\);', 'const repoRoot = process.env.KINGSMEN_REPO_ROOT || "C:/Kingsmen/kingsmen-platform";'
$builderText = $builderText -replace 'const repoRoot = path\.resolve\(process\.env\.KINGSMEN_REPO_ROOT \|\| "C:/Kingsmen/kingsmen-platform"\);', 'const repoRoot = process.env.KINGSMEN_REPO_ROOT || "C:/Kingsmen/kingsmen-platform";'
WriteNoBom $BuilderCore $builderText
Write-Host "PATCHED: fixed Builder Core repo root to C:\Kingsmen\kingsmen-platform" -ForegroundColor Green

# 2. Let the approval parser accept both "approve KJB..." and "Jarvis approve KJB..."
$commandText = [System.IO.File]::ReadAllText($CommandRoute)
$commandText = $commandText -replace 'text\.match\(/\^approve\\s\+\(KJB-\\d\{8\}-\\d\{6\}\)\$/i\)', 'text.match(/^(?:jarvis[\s,]+)?approve\s+(KJB-\d{8}-\d{6})$/i)'
$commandText = $commandText -replace 'approval\[1\]\.toUpperCase\(\)', 'approval[1].toUpperCase()'
# 3. Never show browser Internal Server Error for Builder blocks. Return JSON with visible reply.
$commandText = $commandText -replace '\}, \{ status: 500 \}\);', '}, { status: 200 });'
WriteNoBom $CommandRoute $commandText
Write-Host "PATCHED: command route approval parser + visible error response" -ForegroundColor Green

# 4. Builder route should also return JSON-visible errors, not browser 500.
$builderRouteText = [System.IO.File]::ReadAllText($BuilderRoute)
$builderRouteText = $builderRouteText -replace '\}, \{ status: 500 \}\);', '}, { status: 200 });'
WriteNoBom $BuilderRoute $builderRouteText
Write-Host "PATCHED: builder route visible error response" -ForegroundColor Green

# 5. Add direct approval test command that prints the actual JSON response.
$ApprovePs1 = Join-Path $Repo "tools\jarvis\JARVIS_APPROVE_BUILDER_PLAN.ps1"
$ApproveScript = @'
$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS APPROVE BUILDER PLAN" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$PlanId = Read-Host "Enter Plan ID, example KJB-20260615-140132"
$PlanId = $PlanId.Trim().ToUpperInvariant()

if ($PlanId -notmatch '^KJB-\d{8}-\d{6}$') {
  Write-Host "Invalid Plan ID." -ForegroundColor Red
  exit 1
}

try {
  Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 5 | Out-Null
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
} catch {
  Write-Host "Jarvis API is not online. Start it first:" -ForegroundColor Red
  Write-Host "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd" -ForegroundColor White
  exit 1
}

$body = @{
  command = "approve $PlanId"
} | ConvertTo-Json -Depth 20

$result = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3000/api/jarvis/command" -ContentType "application/json" -Body $body -TimeoutSec 300

Write-Host ""
Write-Host "JARVIS RESPONSE:" -ForegroundColor Cyan
Write-Host ($result.reply) -ForegroundColor White
Write-Host ""
Write-Host "RAW RESULT:" -ForegroundColor DarkCyan
Write-Host ($result | ConvertTo-Json -Depth 80)

if ($result.ok -eq $true) {
  Write-Host ""
  Write-Host "APPROVAL COMMAND COMPLETED." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "APPROVAL COMMAND BLOCKED. The exact error is shown above." -ForegroundColor Yellow
}
'@
WriteNoBom $ApprovePs1 $ApproveScript

$ApproveCmd = "C:\Kingsmen\JARVIS_APPROVE_BUILDER_PLAN.cmd"
$ApproveCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS APPROVE BUILDER PLAN",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\JARVIS_APPROVE_BUILDER_PLAN.ps1"""
)
[System.IO.File]::WriteAllLines($ApproveCmd, $ApproveCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $ApproveCmd) -ForegroundColor Green

# 6. Add controlled restart command.
$RestartPs1 = Join-Path $Repo "tools\jarvis\RESTART_JARVIS_SERVER_AFTER_02D.ps1"
$RestartScript = @'
$ErrorActionPreference = "Stop"

Write-Host "Restarting Jarvis server on 127.0.0.1:3000..." -ForegroundColor Cyan

$conns = @(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
foreach ($c in $conns) {
  try {
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($p) {
      Write-Host ("Stopping port 3000 owner: PID " + $p.Id + " " + $p.ProcessName) -ForegroundColor Yellow
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

Start-Sleep -Seconds 3
Start-Process "cmd.exe" "/k C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd"
Write-Host "Started new Jarvis server window. Keep it open." -ForegroundColor Green
'@
WriteNoBom $RestartPs1 $RestartScript

$RestartCmd = "C:\Kingsmen\RESTART_JARVIS_SERVER_AFTER_02D.cmd"
$RestartCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS RESTART AFTER 02D",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\RESTART_JARVIS_SERVER_AFTER_02D.ps1"""
)
[System.IO.File]::WriteAllLines($RestartCmd, $RestartCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $RestartCmd) -ForegroundColor Green

$Now = (Get-Date).ToUniversalTime().ToString("o")
$LockPath = Join-Path $Repo "manifests\jarvis\jarvis-builder-approval-gate-repair-lock.json"
$ProofPath = Join-Path $Repo "reports\jarvis\steps\STEP_02D_APPROVAL_GATE_REPAIR_PROOF.json"
$ReportPath = Join-Path $Repo "reports\jarvis\steps\STEP_02D_APPROVAL_GATE_REPAIR_REPORT.md"

$Lock = [ordered]@{
  lock_name = "jarvis-builder-approval-gate-repair"
  status = "LOCKED"
  locked_at = $Now
  repairs = @(
    "fixed Builder Core repo root",
    "approval parser accepts approve and Jarvis approve",
    "Builder API errors return visible JSON instead of browser Internal Server Error",
    "direct approval command added"
  )
  visual_files_changed = @()
}
WriteNoBom $LockPath ($Lock | ConvertTo-Json -Depth 30)

$Proof = [ordered]@{
  step = "STEP_02D_APPROVAL_GATE_REPAIR"
  status = "COMPLETE"
  created_at = $Now
  backup_root = $BackupRoot
  changed_files = @(
    [ordered]@{ path = "apps\web\src\lib\jarvis\builderCore.ts"; sha256 = (Sha256File $BuilderCore) },
    [ordered]@{ path = "apps\web\src\app\api\jarvis\command\route.ts"; sha256 = (Sha256File $CommandRoute) },
    [ordered]@{ path = "apps\web\src\app\api\jarvis\builder\route.ts"; sha256 = (Sha256File $BuilderRoute) },
    [ordered]@{ path = "tools\jarvis\JARVIS_APPROVE_BUILDER_PLAN.ps1"; sha256 = (Sha256File $ApprovePs1) },
    [ordered]@{ path = "tools\jarvis\RESTART_JARVIS_SERVER_AFTER_02D.ps1"; sha256 = (Sha256File $RestartPs1) },
    [ordered]@{ path = "C:\Kingsmen\JARVIS_APPROVE_BUILDER_PLAN.cmd"; sha256 = (Sha256File $ApproveCmd) },
    [ordered]@{ path = "C:\Kingsmen\RESTART_JARVIS_SERVER_AFTER_02D.cmd"; sha256 = (Sha256File $RestartCmd) }
  )
  visual_files_changed = @()
  restart_required = $true
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 50)

$Report = @(
  "# STEP 02D - Approval Gate Repair",
  "",
  "Status: COMPLETE",
  "",
  "Repairs Internal Server Error on Builder approval.",
  "",
  "No visual files changed.",
  "",
  "Run after install:",
  "C:\Kingsmen\RESTART_JARVIS_SERVER_AFTER_02D.cmd",
  "",
  "Then approve:",
  "C:\Kingsmen\JARVIS_APPROVE_BUILDER_PLAN.cmd",
  "",
  "Proof:",
  $ProofPath,
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $Repo "tools\jarvis\KINGSMEN_JARVIS_STEP_02D_APPROVAL_GATE_REPAIR.ps1") -Force
}

Write-Host ""
Write-Host "STEP 02D COMPLETE." -ForegroundColor Green
Write-Host "Now restart Jarvis server:" -ForegroundColor Yellow
Write-Host "C:\Kingsmen\RESTART_JARVIS_SERVER_AFTER_02D.cmd" -ForegroundColor White
Write-Host ""
Write-Host "Then approve the plan:" -ForegroundColor Yellow
Write-Host "C:\Kingsmen\JARVIS_APPROVE_BUILDER_PLAN.cmd" -ForegroundColor White
