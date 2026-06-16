# KINGSMEN JARVIS STEP 01I - EXACT LAYOUT RESTORE FROM VERIFIED SOURCE
# Controlled restore only.
# Source was selected by STEP 01H2 discovery:
# BACKUP:C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551
#
# This script:
# - backs up the current plain/unstyled live layout first
# - restores JarvisHudClient.tsx and JarvisHud.module.css from the verified source
# - re-locks the layout manifest
# - records proof
# - does not create a new design
# - does not modify voice runtime
# - does not touch API logic

$ErrorActionPreference = "Stop"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function WriteNoBom([string]$Path, [string]$Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
}

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

function ReadTextSafe([string]$Path) {
  if (!(Test-Path $Path)) { return "" }
  try { return [System.IO.File]::ReadAllText($Path) } catch { return "" }
}

function CountRegex([string]$Text, [string]$Pattern) {
  if ([string]::IsNullOrEmpty($Text)) { return 0 }
  return ([regex]::Matches($Text, $Pattern)).Count
}

function FileMeta([string]$Path) {
  $text = ReadTextSafe $Path
  $bytes = 0
  if (Test-Path $Path) { $bytes = ([System.IO.File]::ReadAllBytes($Path)).Length }
  return [ordered]@{
    exists = (Test-Path $Path)
    bytes = $bytes
    sha256 = (Sha256File $Path)
    styles_usage_count = (CountRegex $text "styles\.")
    className_count = (CountRegex $text "className")
    css_module_import = ($text -match "JarvisHud\.module\.css")
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01I - EXACT LAYOUT RESTORE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Restoring from the verified 01H2 source only. No new design." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) {
  throw "Kingsmen repo not found at C:\Kingsmen\kingsmen-platform"
}

$SourceRoot = "C:\Kingsmen\kingsmen-platform\backups\jarvis-step-01e2-parse-safe-before-rollback-20260614_025551"
if (!(Test-Path $SourceRoot)) {
  throw "Verified source backup not found: $SourceRoot"
}

$HudRel = "apps\web\src\app\jarvis\JarvisHudClient.tsx"
$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"

$SourceHud = Join-Path $SourceRoot $HudRel
$SourceCss = Join-Path $SourceRoot $CssRel
$LiveHud = Join-Path $Repo $HudRel
$LiveCss = Join-Path $Repo $CssRel

if (!(Test-Path $SourceHud)) { throw "Verified source HUD file missing: $SourceHud" }
if (!(Test-Path $SourceCss)) { throw "Verified source CSS file missing: $SourceCss" }

$sourceHudMeta = FileMeta $SourceHud
$sourceCssMeta = FileMeta $SourceCss

if ($sourceHudMeta.css_module_import -ne $true) {
  throw "Source rejected: JarvisHudClient.tsx does not import JarvisHud.module.css"
}
if ([int]$sourceHudMeta.styles_usage_count -lt 20) {
  throw "Source rejected: expected strong CSS module usage, found $($sourceHudMeta.styles_usage_count)"
}
if ([int]$sourceCssMeta.bytes -lt 6000) {
  throw "Source rejected: expected substantial CSS, found $($sourceCssMeta.bytes) bytes"
}

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SafetyBackupRoot = Join-Path $Repo ("backups\jarvis-step-01i-before-exact-restore-" + $Stamp)
EnsureDir $SafetyBackupRoot

if (Test-Path $LiveHud) {
  $dest = Join-Path $SafetyBackupRoot $HudRel
  EnsureDir (Split-Path -Parent $dest)
  Copy-Item $LiveHud $dest -Force
}
if (Test-Path $LiveCss) {
  $dest = Join-Path $SafetyBackupRoot $CssRel
  EnsureDir (Split-Path -Parent $dest)
  Copy-Item $LiveCss $dest -Force
}

EnsureDir (Split-Path -Parent $LiveHud)
EnsureDir (Split-Path -Parent $LiveCss)

Copy-Item $SourceHud $LiveHud -Force
Copy-Item $SourceCss $LiveCss -Force

$liveHudMeta = FileMeta $LiveHud
$liveCssMeta = FileMeta $LiveCss

if ($liveHudMeta.sha256 -ne $sourceHudMeta.sha256) {
  throw "Restore verification failed: HUD SHA mismatch after copy."
}
if ($liveCssMeta.sha256 -ne $sourceCssMeta.sha256) {
  throw "Restore verification failed: CSS SHA mismatch after copy."
}

$ManifestDir = Join-Path $Repo "manifests\jarvis"
$ReportsDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
EnsureDir $ManifestDir
EnsureDir $ReportsDir
EnsureDir $DocsDir
EnsureDir $ToolsDir

$LayoutLockPath = Join-Path $ManifestDir "jarvis-layout-lock.json"
$ProofPath = Join-Path $ReportsDir "STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE_PROOF.json"
$ReportPath = Join-Path $ReportsDir "STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE_REPORT.md"
$LedgerPath = Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md"

$now = (Get-Date).ToUniversalTime().ToString("o")

$layoutLock = [ordered]@{
  lock_name = "jarvis-layout-lock"
  status = "LOCKED_RESTORED_FROM_VERIFIED_SOURCE"
  locked_at = $now
  repo = $Repo
  source = $SourceRoot
  restored_files = @(
    [ordered]@{
      path = $HudRel
      source_sha256 = $sourceHudMeta.sha256
      live_sha256 = $liveHudMeta.sha256
      bytes = $liveHudMeta.bytes
      css_module_import = $liveHudMeta.css_module_import
      styles_usage_count = $liveHudMeta.styles_usage_count
      className_count = $liveHudMeta.className_count
    },
    [ordered]@{
      path = $CssRel
      source_sha256 = $sourceCssMeta.sha256
      live_sha256 = $liveCssMeta.sha256
      bytes = $liveCssMeta.bytes
    }
  )
  rule = "Do not modify JarvisHudClient.tsx or JarvisHud.module.css without creating a source backup, proof JSON, ledger entry, and Commander approval."
  next = "Runtime verification only. No visual redesign."
}
WriteNoBom $LayoutLockPath ($layoutLock | ConvertTo-Json -Depth 20)

$proof = [ordered]@{
  step = "STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE"
  status = "COMPLETE"
  created_at = $now
  verified_source = $SourceRoot
  safety_backup = $SafetyBackupRoot
  restored = $true
  no_new_design = $true
  voice_runtime_touched = $false
  api_logic_touched = $false
  live_hud = $liveHudMeta
  live_css = $liveCssMeta
  layout_lock = $LayoutLockPath
  next = "Refresh http://127.0.0.1:3000/jarvis with Ctrl+F5. If still plain, restart the Next server window."
}
WriteNoBom $ProofPath ($proof | ConvertTo-Json -Depth 30)

$report = @(
  "# STEP 01I - Exact Layout Restore From Verified Source",
  "",
  "Created: $now",
  "",
  "Status: COMPLETE",
  "",
  "Verified source:",
  "- $SourceRoot",
  "",
  "Safety backup created before restore:",
  "- $SafetyBackupRoot",
  "",
  "Restored files:",
  "- $HudRel",
  "- $CssRel",
  "",
  "Verification:",
  "- HUD SHA matched source: " + ($liveHudMeta.sha256 -eq $sourceHudMeta.sha256),
  "- CSS SHA matched source: " + ($liveCssMeta.sha256 -eq $sourceCssMeta.sha256),
  "- CSS module import: " + $liveHudMeta.css_module_import,
  "- Styles usage count: " + $liveHudMeta.styles_usage_count,
  "- CSS bytes: " + $liveCssMeta.bytes,
  "",
  "Rule:",
  "- No new visual design was created.",
  "- This was an exact restore from the source selected by STEP 01H2.",
  "- Next work is runtime verification only.",
  ""
)
WriteNoBom $ReportPath (($report -join "`r`n") + "`r`n")

$ledger = @(
  "",
  "## STEP 01I - Exact Layout Restore From Verified Source",
  "",
  "Status: COMPLETE at $now",
  "",
  "Verified source:",
  "- $SourceRoot",
  "",
  "Safety backup:",
  "- $SafetyBackupRoot",
  "",
  "Restored:",
  "- $HudRel",
  "- $CssRel",
  "",
  "Proof:",
  "- $ProofPath",
  "- $ReportPath",
  "",
  "Instruction:",
  "- Refresh Jarvis with Ctrl+F5.",
  "- Do not run another visual redesign step.",
  ""
)
Add-Content -Path $LedgerPath -Value $ledger -Encoding UTF8

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE.ps1") -Force
}

$CmdPath = "C:\Kingsmen\JARVIS_STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE.cmd"
$CmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 01I EXACT LAYOUT RESTORE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01I_EXACT_LAYOUT_RESTORE_FROM_VERIFIED_SOURCE.ps1"""
)
[System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)

Write-Host "RESTORE COMPLETE." -ForegroundColor Green
Write-Host ""
Write-Host "Verified source:" -ForegroundColor Cyan
Write-Host $SourceRoot -ForegroundColor Green
Write-Host ""
Write-Host "Safety backup:" -ForegroundColor Cyan
Write-Host $SafetyBackupRoot -ForegroundColor Green
Write-Host ""
Write-Host "Restored and locked:" -ForegroundColor Cyan
Write-Host $HudRel -ForegroundColor Green
Write-Host $CssRel -ForegroundColor Green
Write-Host ""
Write-Host "Proof:" -ForegroundColor Cyan
Write-Host $ProofPath
Write-Host $ReportPath
Write-Host ""
Write-Host "Now refresh Jarvis with Ctrl+F5:" -ForegroundColor Yellow
Write-Host "http://127.0.0.1:3000/jarvis" -ForegroundColor Yellow
Write-Host ""
Write-Host "If it still appears plain, restart the Next server window. Do not run another visual step." -ForegroundColor Yellow
