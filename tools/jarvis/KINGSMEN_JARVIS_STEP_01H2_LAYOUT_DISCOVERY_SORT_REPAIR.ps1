# KINGSMEN JARVIS STEP 01H2 - LAYOUT DISCOVERY SORT REPAIR
# READ-ONLY. This fixes the STEP 01H "Argument types do not match" Sort-Object failure.
# It does NOT modify JarvisHudClient.tsx, JarvisHud.module.css, or any layout file.

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

function ReadTextSafe([string]$Path) {
  if (!(Test-Path $Path)) { return "" }
  try { return [System.IO.File]::ReadAllText($Path) } catch { return "" }
}

function Sha256Text([string]$Text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

function CountRegex([string]$Text, [string]$Pattern) {
  if ([string]::IsNullOrEmpty($Text)) { return 0 }
  return ([regex]::Matches($Text, $Pattern)).Count
}

function GetBytes([string]$Text) {
  if ($null -eq $Text) { return 0 }
  return [System.Text.Encoding]::UTF8.GetByteCount($Text)
}

function NewCandidate(
  [string]$Source,
  [string]$HudText,
  [string]$CssText,
  [bool]$HudExists,
  [bool]$CssExists
) {
  $score = [int]0
  $reasons = New-Object System.Collections.Generic.List[string]

  $hudBytes = [int](GetBytes $HudText)
  $cssBytes = [int](GetBytes $CssText)

  $stylesUsage = [int](CountRegex $HudText "styles\.")
  $classCount = [int](CountRegex $HudText "className")
  $moduleImport = $false

  if ($HudText -match "JarvisHud\.module\.css") {
    $moduleImport = $true
    $score += 25
    [void]$reasons.Add("imports JarvisHud.module.css")
  }

  if ($stylesUsage -gt 20) {
    $score += 35
    [void]$reasons.Add("strong CSS module usage: $stylesUsage")
  } elseif ($stylesUsage -gt 5) {
    $score += 20
    [void]$reasons.Add("moderate CSS module usage: $stylesUsage")
  } elseif ($stylesUsage -gt 0) {
    $score += 8
    [void]$reasons.Add("weak CSS module usage: $stylesUsage")
  } else {
    $score -= 30
    [void]$reasons.Add("no CSS module usage")
  }

  if ($classCount -gt 20) {
    $score += 20
    [void]$reasons.Add("many className entries: $classCount")
  } elseif ($classCount -gt 5) {
    $score += 10
    [void]$reasons.Add("some className entries: $classCount")
  }

  if ($CssExists -and $cssBytes -gt 6000) {
    $score += 35
    [void]$reasons.Add("large styled CSS file: $cssBytes bytes")
  } elseif ($CssExists -and $cssBytes -gt 2000) {
    $score += 20
    [void]$reasons.Add("substantial CSS file: $cssBytes bytes")
  } elseif ($CssExists -and $cssBytes -gt 300) {
    $score += 5
    [void]$reasons.Add("small CSS file: $cssBytes bytes")
  } else {
    $score -= 35
    [void]$reasons.Add("missing or tiny CSS file")
  }

  foreach ($term in @(
    "COMMANDER-ONLY DOCTRINE",
    "VOICE BRIDGE",
    "EXACT DOCTRINE LOCK",
    "EVIDENCE / ERRORS",
    "JARVIS REPLY",
    "KINGSMEN PROTOCOL",
    "FULL REPO COMMAND VOICE",
    "V5 LOCKED"
  )) {
    if ($HudText -like ("*" + $term + "*")) {
      $score += 3
    }
  }

  foreach ($term in @(
    "radial-gradient",
    "linear-gradient",
    "border-radius",
    "box-shadow",
    "grid-template",
    "backdrop-filter",
    "letter-spacing",
    "animation",
    "@keyframes",
    "min-height: 100vh"
  )) {
    if ($CssText -like ("*" + $term + "*")) {
      $score += 5
    }
  }

  $plainRisk = $false
  if ((!$moduleImport) -or (!$CssExists) -or ($cssBytes -lt 300) -or ($stylesUsage -eq 0)) {
    $plainRisk = $true
  }

  [pscustomobject]@{
    Source = [string]$Source
    Score = [int]$score
    PlainPageRisk = [bool]$plainRisk
    HudExists = [bool]$HudExists
    CssExists = [bool]$CssExists
    HudBytes = [int]$hudBytes
    CssBytes = [int]$cssBytes
    HudSha256 = [string](Sha256Text $HudText)
    CssSha256 = [string](Sha256Text $CssText)
    StylesUsageCount = [int]$stylesUsage
    ClassNameCount = [int]$classCount
    Reasons = [string](($reasons.ToArray()) -join "; ")
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01H2 - LAYOUT DISCOVERY SORT REPAIR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Read-only. Fixes the 01H sort failure. No layout files are changed." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { $Repo = (Get-Location).Path }
if (!(Test-Path (Join-Path $Repo "apps\web"))) {
  throw "Kingsmen web repo not found. Expected C:\Kingsmen\kingsmen-platform\apps\web"
}

$HudRel = "apps\web\src\app\jarvis\JarvisHudClient.tsx"
$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"
$HudPath = Join-Path $Repo $HudRel
$CssPath = Join-Path $Repo $CssRel

$ReportDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
EnsureDir $ReportDir
EnsureDir $DocsDir
EnsureDir $ToolsDir

$JsonReport = Join-Path $ReportDir "STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR_PROOF.json"
$MdReport = Join-Path $ReportDir "STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR_REPORT.md"
$LedgerPath = Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md"

$candidates = New-Object System.Collections.Generic.List[object]

$currentHud = ReadTextSafe $HudPath
$currentCss = ReadTextSafe $CssPath
$candidates.Add((NewCandidate "LIVE_CURRENT" $currentHud $currentCss (Test-Path $HudPath) (Test-Path $CssPath)))

$BackupRoot = Join-Path $Repo "backups"
if (Test-Path $BackupRoot) {
  $dirs = Get-ChildItem -Path $BackupRoot -Directory -Recurse -ErrorAction SilentlyContinue
  foreach ($dir in $dirs) {
    $h = Join-Path $dir.FullName $HudRel
    $c = Join-Path $dir.FullName $CssRel
    if ((Test-Path $h) -or (Test-Path $c)) {
      $ht = ReadTextSafe $h
      $ct = ReadTextSafe $c
      $candidates.Add((NewCandidate ("BACKUP:" + $dir.FullName) $ht $ct (Test-Path $h) (Test-Path $c)))
    }
  }
}

try {
  $inside = (& git -C $Repo rev-parse --is-inside-work-tree 2>$null)
  if ($inside -eq "true") {
    $logLines = & git -C $Repo log --all --format="%H|%ci|%s" -- $HudRel 2>$null
    $taken = 0
    foreach ($line in $logLines) {
      if ($taken -ge 60) { break }
      if ([string]::IsNullOrWhiteSpace($line)) { continue }

      $parts = $line -split "\|", 3
      $sha = $parts[0]
      $date = ""
      $subject = ""
      if ($parts.Count -gt 1) { $date = $parts[1] }
      if ($parts.Count -gt 2) { $subject = $parts[2] }

      $hudGit = ""
      $cssGit = ""
      try { $hudGit = (& git -C $Repo show ($sha + ":" + $HudRel) 2>$null) -join "`n" } catch {}
      try { $cssGit = (& git -C $Repo show ($sha + ":" + $CssRel) 2>$null) -join "`n" } catch {}

      if (($hudGit.Length -gt 0) -or ($cssGit.Length -gt 0)) {
        $candidates.Add((NewCandidate ("GIT:" + $sha + " | " + $date + " | " + $subject) $hudGit $cssGit ($hudGit.Length -gt 0) ($cssGit.Length -gt 0)))
        $taken++
      }
    }
  }
} catch {
  # Git history discovery is optional.
}

# Sort repair: use explicit integer properties, no calculated-property hashtables.
$sorted = @($candidates.ToArray()) | Sort-Object -Property Score, CssBytes, HudBytes -Descending
$top = @($sorted | Select-Object -First 20)
$best = $top[0]

$finding = "Discovery completed."
if ($best.Source -eq "LIVE_CURRENT" -and $best.PlainPageRisk -eq $true) {
  $finding = "LIVE_CURRENT is the best available candidate, but it still has plain-page risk. No safe styled source was found."
} elseif ($best.Source -ne "LIVE_CURRENT") {
  $finding = "A better styled source was found outside the live layout. Restore must be a separate explicit step from this exact source."
} elseif ($best.Source -eq "LIVE_CURRENT" -and $best.PlainPageRisk -eq $false) {
  $finding = "LIVE_CURRENT appears styled by static inspection. If browser is plain, the problem is likely CSS build/import/cache/runtime, not source recovery."
}

$now = (Get-Date).ToUniversalTime().ToString("o")

$proofTop = @()
foreach ($cand in $top) {
  $proofTop += [ordered]@{
    source = $cand.Source
    score = $cand.Score
    plain_page_risk = $cand.PlainPageRisk
    hud_exists = $cand.HudExists
    css_exists = $cand.CssExists
    hud_bytes = $cand.HudBytes
    css_bytes = $cand.CssBytes
    hud_sha256 = $cand.HudSha256
    css_sha256 = $cand.CssSha256
    styles_usage_count = $cand.StylesUsageCount
    className_count = $cand.ClassNameCount
    reasons = $cand.Reasons
  }
}

$proof = [ordered]@{
  step = "STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR"
  status = "COMPLETE"
  created_at = $now
  repo = $Repo
  read_only = $true
  live_files_modified = $false
  finding = $finding
  best_candidate = $proofTop[0]
  top_candidates = $proofTop
  next = "Send the BEST CANDIDATE printed below. No restore before approval."
}
WriteNoBom $JsonReport ($proof | ConvertTo-Json -Depth 50)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# STEP 01H2 - Layout Discovery Sort Repair")
$lines.Add("")
$lines.Add("Created: $now")
$lines.Add("")
$lines.Add("Read-only: true")
$lines.Add("Live files modified: false")
$lines.Add("")
$lines.Add("## Finding")
$lines.Add("")
$lines.Add($finding)
$lines.Add("")
$lines.Add("## BEST CANDIDATE")
$lines.Add("")
$lines.Add("- Source: " + $best.Source)
$lines.Add("- Score: " + $best.Score)
$lines.Add("- Plain page risk: " + $best.PlainPageRisk)
$lines.Add("- HUD exists: " + $best.HudExists)
$lines.Add("- CSS exists: " + $best.CssExists)
$lines.Add("- HUD bytes: " + $best.HudBytes)
$lines.Add("- CSS bytes: " + $best.CssBytes)
$lines.Add("- HUD SHA256: " + $best.HudSha256)
$lines.Add("- CSS SHA256: " + $best.CssSha256)
$lines.Add("- Styles usage count: " + $best.StylesUsageCount)
$lines.Add("- ClassName count: " + $best.ClassNameCount)
$lines.Add("- Reasons: " + $best.Reasons)
$lines.Add("")
$lines.Add("## Top candidates")
$lines.Add("")
$i = 1
foreach ($cand in $top) {
  $lines.Add("### Candidate " + $i)
  $lines.Add("- Source: " + $cand.Source)
  $lines.Add("- Score: " + $cand.Score)
  $lines.Add("- Plain page risk: " + $cand.PlainPageRisk)
  $lines.Add("- HUD bytes: " + $cand.HudBytes)
  $lines.Add("- CSS bytes: " + $cand.CssBytes)
  $lines.Add("- Reasons: " + $cand.Reasons)
  $lines.Add("")
  $i++
}
WriteNoBom $MdReport (($lines -join "`r`n") + "`r`n")

$ledger = @(
  "",
  "## STEP 01H2 - Layout Discovery Sort Repair",
  "",
  "Status: COMPLETE at $now",
  "",
  "Finding:",
  $finding,
  "",
  "Reports:",
  "- $JsonReport",
  "- $MdReport",
  "",
  "Rule:",
  "- Read-only discovery only. No restore before Commander approval.",
  ""
)
Add-Content -Path $LedgerPath -Value $ledger -Encoding UTF8

if ($PSCommandPath) {
  $repoTool = Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR.ps1"
  Copy-Item $PSCommandPath $repoTool -Force
}
$cmdPath = "C:\Kingsmen\JARVIS_STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR.cmd"
$cmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 01H2 LAYOUT DISCOVERY SORT REPAIR",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01H2_LAYOUT_DISCOVERY_SORT_REPAIR.ps1"""
)
[System.IO.File]::WriteAllLines($cmdPath, $cmdLines, [System.Text.Encoding]::ASCII)

Write-Host "DISCOVERY COMPLETE." -ForegroundColor Green
Write-Host ""
Write-Host "Finding:" -ForegroundColor Cyan
Write-Host $finding -ForegroundColor Yellow
Write-Host ""
Write-Host "BEST CANDIDATE" -ForegroundColor Cyan
Write-Host ("Source: " + $best.Source) -ForegroundColor Green
Write-Host ("Score: " + $best.Score) -ForegroundColor Green
Write-Host ("Plain page risk: " + $best.PlainPageRisk) -ForegroundColor Green
Write-Host ("HUD bytes: " + $best.HudBytes) -ForegroundColor Green
Write-Host ("CSS bytes: " + $best.CssBytes) -ForegroundColor Green
Write-Host ("Styles usage count: " + $best.StylesUsageCount) -ForegroundColor Green
Write-Host ("Reasons: " + $best.Reasons) -ForegroundColor Green
Write-Host ""
Write-Host "Reports:" -ForegroundColor Cyan
Write-Host $JsonReport
Write-Host $MdReport
Write-Host ""
Write-Host "Send me the BEST CANDIDATE lines above before any restore." -ForegroundColor Yellow
