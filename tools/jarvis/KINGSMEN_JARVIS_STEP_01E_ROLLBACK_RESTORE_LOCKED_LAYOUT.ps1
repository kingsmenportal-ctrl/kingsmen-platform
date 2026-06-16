# KINGSMEN JARVIS STEP 01E ROLLBACK - RESTORE LOCKED LAYOUT
# Purpose:
# - Undo the wrong Step 01E visual redesign.
# - Restore the Jarvis layout files from the automatic backup Step 01E created.
# - Re-lock the restored layout.
# - Record the failure and rollback in the Jarvis build ledger.
#
# This does NOT create a new visual layout.
# This does NOT modify voice capture.
# This does NOT touch backend routes.

$ErrorActionPreference = "Stop"

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { $Repo = (Get-Location).Path }
if (!(Test-Path (Join-Path $Repo "apps"))) { throw "Kingsmen repo not found. Expected C:\Kingsmen\kingsmen-platform or run from repo root." }

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Now = (Get-Date).ToUniversalTime().ToString("o")

$HudRel = "apps\web\src\app\jarvis\JarvisHudClient.tsx"
$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"
$LockRel = "manifests\jarvis\jarvis-layout-lock.json"
$LedgerRel = "docs\jarvis\JARVIS_BUILD_STEP_LEDGER.md"
$ProofRel = "reports\jarvis\steps\STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT_PROOF.json"

$RollbackBackupRoot = Join-Path $Repo ("backups\jarvis-step-01e-rollback-safety-" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $RollbackBackupRoot | Out-Null

function Sha256Path([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $Bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($Bytes)).Replace("-","").ToLowerInvariant()
}

function Sha256File([string]$Relative) {
  return Sha256Path (Join-Path $Repo $Relative)
}

function CopyCurrentToSafety([string]$Relative) {
  $Source = Join-Path $Repo $Relative
  if (Test-Path $Source) {
    $Target = Join-Path $RollbackBackupRoot $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
    Copy-Item $Source $Target -Force
  }
}

function RestoreFromBackupOrRemove([string]$Relative, [string]$BackupRoot) {
  $BackupFile = Join-Path $BackupRoot $Relative
  $LiveFile = Join-Path $Repo $Relative

  CopyCurrentToSafety $Relative

  if (Test-Path $BackupFile) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LiveFile) | Out-Null
    Copy-Item $BackupFile $LiveFile -Force
    Write-Host ("RESTORED: " + $Relative) -ForegroundColor Green
    return "restored"
  }

  if (Test-Path $LiveFile) {
    Remove-Item $LiveFile -Force
    Write-Host ("REMOVED STEP 01E FILE NOT PRESENT BEFORE: " + $Relative) -ForegroundColor Yellow
    return "removed"
  }

  Write-Host ("NO FILE TO RESTORE OR REMOVE: " + $Relative) -ForegroundColor DarkYellow
  return "absent"
}

function FileLock([string]$Relative) {
  $Path = Join-Path $Repo $Relative
  if (!(Test-Path $Path)) {
    return [ordered]@{
      path = $Relative
      exists = $false
      locked = $false
      sha256 = $null
      bytes = 0
      lines = 0
    }
  }

  $Text = [System.IO.File]::ReadAllText($Path)
  $Bytes = [System.IO.File]::ReadAllBytes($Path)

  return [ordered]@{
    path = $Relative
    exists = $true
    locked = $true
    sha256 = (Sha256Path $Path)
    bytes = $Bytes.Length
    lines = (($Text -split "`n").Count)
  }
}

function WriteText([string]$Relative, [string]$Content) {
  $Path = Join-Path $Repo $Relative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Path) | Out-Null
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
  Write-Host ("WROTE: " + $Relative) -ForegroundColor Green
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Red
Write-Host " KINGSMEN JARVIS STEP 01E ROLLBACK - RESTORE LOCKED LAYOUT" -ForegroundColor Red
Write-Host "===============================================================" -ForegroundColor Red
Write-Host "This removes the wrong Step 01E visual redesign and restores the backup." -ForegroundColor Yellow
Write-Host "No new UI is created here." -ForegroundColor Yellow
Write-Host ""

$BackupsPath = Join-Path $Repo "backups"
if (!(Test-Path $BackupsPath)) {
  throw "No backups folder found. Cannot rollback safely."
}

$Step01EBackup = Get-ChildItem -Path $BackupsPath -Directory -Filter "jarvis-step-01e-visual-styles-*" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if ($null -eq $Step01EBackup) {
  throw "No Step 01E backup found. Cannot rollback safely. Expected backups\jarvis-step-01e-visual-styles-*"
}

Write-Host ("FOUND STEP 01E BACKUP: " + $Step01EBackup.FullName) -ForegroundColor Cyan

$BeforeHudSha = Sha256File $HudRel
$BeforeCssSha = Sha256File $CssRel

$HudResult = RestoreFromBackupOrRemove $HudRel $Step01EBackup.FullName
$CssResult = RestoreFromBackupOrRemove $CssRel $Step01EBackup.FullName

$AfterHudSha = Sha256File $HudRel
$AfterCssSha = Sha256File $CssRel

$LockedFiles = @(
  (FileLock $HudRel),
  (FileLock $CssRel),
  (FileLock "apps\web\src\app\jarvis\page.tsx"),
  (FileLock "apps\web\src\app\api\jarvis\status\route.ts"),
  (FileLock "apps\web\src\app\api\jarvis\command\route.ts"),
  (FileLock "apps\web\src\app\api\jarvis\voice\route.ts"),
  (FileLock "apps\web\src\lib\jarvis\doctrine.ts"),
  (FileLock "docs\jarvis\KINGSMEN_JARVIS_V5_MASTER_COMMAND_SCRIPT_LOCK.md")
)

$NewLock = [ordered]@{
  lock_name = "KINGSMEN_JARVIS_LAYOUT_LOCK_AFTER_STEP_01E_ROLLBACK"
  locked_at = $Now
  repo = $Repo
  reason = "Step 01E created an unwanted redesigned HUD. This rollback restores the previous backed-up layout and prevents unapproved redesign."
  commander_only = $true
  public_chatbot = $false
  visual_policy = "No visual redesign without Commander approval."
  build_policy = "Continue in small steps. Each step must preserve the locked layout unless explicitly named as a Commander-approved visual step."
  doctrine_policy = "Jarvis V5 doctrine remains canonical and must not be minimized."
  rollback_source = $Step01EBackup.FullName
  rollback_safety_backup = $RollbackBackupRoot
  locked_files = $LockedFiles
}
WriteText $LockRel ($NewLock | ConvertTo-Json -Depth 30)

$Proof = [ordered]@{
  step = "STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT"
  status = "COMPLETE"
  created_at = $Now
  repo = $Repo
  reason = "Wrong Step 01E visual redesign was not requested."
  rollback_source = $Step01EBackup.FullName
  rollback_safety_backup = $RollbackBackupRoot
  hud_result = $HudResult
  css_result = $CssResult
  before = [ordered]@{
    hud_sha256 = $BeforeHudSha
    css_sha256 = $BeforeCssSha
  }
  after = [ordered]@{
    hud_sha256 = $AfterHudSha
    css_sha256 = $AfterCssSha
  }
  layout_relocked = $true
  changed_files = @(
    $HudRel,
    $CssRel,
    $LockRel,
    $LedgerRel,
    $ProofRel
  )
  next = "Refresh browser with Ctrl+F5. If needed, restart C:\Kingsmen\START_JARVIS_FULL_COMMAND_VOICE.cmd."
}
WriteText $ProofRel ($Proof | ConvertTo-Json -Depth 20)

$LedgerAppend = @"

## STEP 01E ROLLBACK - Restore Locked Layout

Status: COMPLETE at $Now

Reason:
- Step 01E produced an unapproved visual redesign.
- Commander did not request a new generic ring/cockpit layout.
- The correct response is rollback, not another redesign.

Action:
- Restored JarvisHudClient.tsx from the automatic Step 01E backup when available.
- Restored or removed JarvisHud.module.css depending on whether it existed before Step 01E.
- Re-locked the current restored layout.
- Recorded proof in reports/jarvis/steps/STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT_PROOF.json.

Rollback source:
$($Step01EBackup.FullName)

Safety backup of wrong Step 01E state:
$RollbackBackupRoot

Rule from here:
- No visual redesign without Commander approval.
- Next work must continue on voice capture, wake response, API wiring, evidence logs, and command behaviour while preserving the restored layout.
"@
Add-Content -Path (Join-Path $Repo $LedgerRel) -Value $LedgerAppend -Encoding UTF8

$CmdPath = "C:\Kingsmen\JARVIS_STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT.cmd"
$Cmd = ' + '@echo off
title KINGSMEN JARVIS STEP 01E ROLLBACK RESTORE LOCKED LAYOUT
powershell -ExecutionPolicy Bypass -NoExit -File "C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT.ps1"
'
# Write the cmd only if this script has already installed itself into repo tools.
$RepoToolPath = Join-Path $Repo "tools\jarvis\KINGSMEN_JARVIS_STEP_01E_ROLLBACK_RESTORE_LOCKED_LAYOUT.ps1"
if (Test-Path $RepoToolPath) {
  [System.IO.File]::WriteAllText($CmdPath, $Cmd, [System.Text.Encoding]::ASCII)
}

Write-Host ""
Write-Host "ROLLBACK COMPLETE - wrong Step 01E visual redesign removed." -ForegroundColor Green
Write-Host "Refresh browser with Ctrl+F5:" -ForegroundColor Yellow
Write-Host "http://127.0.0.1:3000/jarvis" -ForegroundColor Yellow
Write-Host ""
Write-Host "If the browser still shows the wrong layout, restart the Next server window and run:" -ForegroundColor Cyan
Write-Host "C:\Kingsmen\START_JARVIS_FULL_COMMAND_VOICE.cmd" -ForegroundColor Cyan
