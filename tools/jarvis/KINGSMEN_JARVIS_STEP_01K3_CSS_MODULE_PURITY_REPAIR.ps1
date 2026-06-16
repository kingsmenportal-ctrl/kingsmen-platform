# KINGSMEN JARVIS STEP 01K3 - CSS MODULE PURITY REPAIR
# Fixes Next.js CSS Modules build error:
# ":global(html), :global(body)" is not pure.
#
# Changes only:
# apps\web\src\app\jarvis\JarvisHud.module.css
#
# Does not change JarvisHudClient.tsx.
# Does not change the locked reference image.
# Does not change voice/API logic.

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
  Write-Host ("WROTE: " + $Path) -ForegroundColor Green
}

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01K3 - CSS MODULE PURITY REPAIR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Fixes :global(html), :global(body) CSS Modules build error only." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }

$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"
$CssPath = Join-Path $Repo $CssRel
if (!(Test-Path $CssPath)) { throw "CSS file not found: $CssPath" }

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $Repo ("backups\jarvis-step-01k3-before-css-module-purity-repair-" + $Stamp)
EnsureDir $BackupRoot

$BackupCss = Join-Path $BackupRoot $CssRel
EnsureDir (Split-Path -Parent $BackupCss)
Copy-Item $CssPath $BackupCss -Force
Write-Host ("BACKED UP: " + $CssRel) -ForegroundColor DarkCyan

$Css = [System.IO.File]::ReadAllText($CssPath)

# Remove the invalid top-level CSS Modules global selector block.
$Pattern = '(?s)^\s*:global\(html\),\s*\r?\n\s*:global\(body\)\s*\{.*?\}\s*\r?\n\s*'
$NewCss = [regex]::Replace($Css, $Pattern, "", 1)

if ($NewCss -eq $Css -and $Css -match ":global\(html\)") {
  throw "Could not safely remove invalid :global(html), :global(body) block."
}

# Ensure .stage itself owns the viewport so no global html/body selector is needed.
$NewCss = [regex]::Replace(
  $NewCss,
  '(?s)\.stage\s*\{',
  ".stage {`r`n  position: fixed;`r`n  inset: 0;`r`n  margin: 0;",
  1
)

if ($NewCss -match ":global\(html\)") {
  throw "Repair failed: :global(html) still exists."
}
if ($NewCss -match ":global\(body\)") {
  throw "Repair failed: :global(body) still exists."
}
if ($NewCss -notmatch "\.stage\s*\{") {
  throw "Repair failed: .stage selector missing."
}

WriteNoBom $CssPath $NewCss

$ReportsDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
EnsureDir $ReportsDir
EnsureDir $DocsDir
EnsureDir $ToolsDir

$Now = (Get-Date).ToUniversalTime().ToString("o")
$ProofPath = Join-Path $ReportsDir "STEP_01K3_CSS_MODULE_PURITY_REPAIR_PROOF.json"
$ReportPath = Join-Path $ReportsDir "STEP_01K3_CSS_MODULE_PURITY_REPAIR_REPORT.md"

$Proof = [ordered]@{
  step = "STEP_01K3_CSS_MODULE_PURITY_REPAIR"
  status = "COMPLETE"
  created_at = $Now
  changed_files = @($CssRel)
  untouched_files = @(
    "apps\web\src\app\jarvis\JarvisHudClient.tsx",
    "apps\web\public\jarvis\locked-reference.png"
  )
  safety_backup = $BackupRoot
  css_sha256_before = (Sha256File $BackupCss)
  css_sha256_after = (Sha256File $CssPath)
  removed_invalid_selectors = @(":global(html)", ":global(body)")
  next_command_1 = "Stop the Next server with Ctrl+C"
  next_command_2 = "cd /d C:\Kingsmen\kingsmen-platform\apps\web && npm run dev -- -H 127.0.0.1 -p 3000"
  next_command_3 = "C:\Kingsmen\OPEN_JARVIS_LOCKED.cmd"
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 20)

$Report = @(
  "# STEP 01K3 - CSS Module Purity Repair",
  "",
  "Created: $Now",
  "",
  "Status: COMPLETE",
  "",
  "Changed file:",
  "- $CssRel",
  "",
  "Removed invalid CSS Modules selectors:",
  "- :global(html)",
  "- :global(body)",
  "",
  "Safety backup:",
  "- $BackupRoot",
  "",
  "Next commands:",
  "1. Stop Next server with Ctrl+C",
  "2. cd /d C:\Kingsmen\kingsmen-platform\apps\web && npm run dev -- -H 127.0.0.1 -p 3000",
  "3. C:\Kingsmen\OPEN_JARVIS_LOCKED.cmd",
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

$Ledger = @(
  "",
  "## STEP 01K3 - CSS Module Purity Repair",
  "",
  "Status: COMPLETE at $Now",
  "",
  "Changed:",
  "- $CssRel",
  "",
  "Fixed:",
  "- Removed invalid top-level CSS Modules global selectors.",
  "",
  "Proof:",
  "- $ProofPath",
  "- $ReportPath",
  ""
)
Add-Content -Path (Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md") -Value $Ledger -Encoding UTF8

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01K3_CSS_MODULE_PURITY_REPAIR.ps1") -Force
}

$CmdPath = "C:\Kingsmen\JARVIS_STEP_01K3_CSS_MODULE_PURITY_REPAIR.cmd"
$CmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 01K3 CSS MODULE PURITY REPAIR",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01K3_CSS_MODULE_PURITY_REPAIR.ps1"""
)
[System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $CmdPath) -ForegroundColor Green

Write-Host ""
Write-Host "STEP 01K3 COMPLETE." -ForegroundColor Green
Write-Host "Fixed build error: removed invalid :global(html), :global(body)." -ForegroundColor Cyan
Write-Host "Changed only:" -ForegroundColor Cyan
Write-Host $CssRel
Write-Host ""
Write-Host "Proof:" -ForegroundColor Cyan
Write-Host $ProofPath
Write-Host $ReportPath
Write-Host ""
Write-Host "Now restart the Next server." -ForegroundColor Yellow
