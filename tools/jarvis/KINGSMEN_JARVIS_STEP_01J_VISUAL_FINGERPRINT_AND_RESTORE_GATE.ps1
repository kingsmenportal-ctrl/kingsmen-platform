# KINGSMEN JARVIS STEP 01J - VISUAL FINGERPRINT AND RESTORE GATE
# Purpose:
# - Stop blind visual restores.
# - Find every Jarvis layout source in backups and git.
# - Fingerprint each candidate against locked visual requirements.
# - Generate a proof report.
# - Restore ONLY if exactly one candidate passes strict locked-layout rules.
# - If more than one or none pass, NO RESTORE happens.
#
# This step never creates a new design.

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

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

function Sha256Text([string]$Text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

function CountRegex([string]$Text, [string]$Pattern) {
  if ([string]::IsNullOrEmpty($Text)) { return 0 }
  return ([regex]::Matches($Text, $Pattern)).Count
}

function TextBytes([string]$Text) {
  if ($null -eq $Text) { return 0 }
  return [System.Text.Encoding]::UTF8.GetByteCount($Text)
}

function HasAll([string]$Text, [string[]]$Terms) {
  foreach ($term in $Terms) {
    if ($Text -notlike ("*" + $term + "*")) { return $false }
  }
  return $true
}

function HasAny([string]$Text, [string[]]$Terms) {
  foreach ($term in $Terms) {
    if ($Text -like ("*" + $term + "*")) { return $true }
  }
  return $false
}

function CandidateObject(
  [string]$SourceType,
  [string]$SourceRoot,
  [string]$HudPath,
  [string]$CssPath,
  [string]$HudText,
  [string]$CssText,
  [bool]$HudExists,
  [bool]$CssExists
) {
  $score = 0
  $reasons = New-Object System.Collections.Generic.List[string]
  $reject = New-Object System.Collections.Generic.List[string]

  $hudBytes = TextBytes $HudText
  $cssBytes = TextBytes $CssText
  $stylesCount = CountRegex $HudText "styles\."
  $classCount = CountRegex $HudText "className"
  $moduleImport = ($HudText -match "JarvisHud\.module\.css")

  $requiredText = @(
    "KINGSMEN",
    "JARVIS",
    "COMMANDER-ONLY",
    "PRIVATE ROUTE COMMAND HOUSE",
    "SERVER ONLINE",
    "VOICE",
    "V5"
  )

  $badCurrentVisualMarkers = @(
    "COMMANDER-ONLY DOCTRINE",
    "VOICE BRIDGE",
    "EXACT DOCTRINE LOCK",
    "COMMAND BEHAVIOUR",
    "USE IT NOW",
    "TYPING BACKUP",
    "EVIDENCE / ERRORS",
    "Native voice channel monitored"
  )

  $candidateDesiredMarkers = @(
    "Welcome to Kingsmen Command",
    "Kingsmen Command",
    "Commander",
    "Jarvis is online",
    "command house is awake",
    "V5"
  )

  $cssVisualMarkers = @(
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
  )

  if ($HudExists) { $score += 5 } else { [void]$reject.Add("HUD missing") }
  if ($CssExists) { $score += 5 } else { [void]$reject.Add("CSS missing") }
  if ($moduleImport) { $score += 20; [void]$reasons.Add("imports CSS module") } else { [void]$reject.Add("no CSS module import") }

  if ($stylesCount -ge 20) { $score += 20; [void]$reasons.Add("strong styles usage: $stylesCount") }
  elseif ($stylesCount -gt 0) { $score += 5; [void]$reasons.Add("weak styles usage: $stylesCount") }
  else { [void]$reject.Add("no styles usage") }

  if ($classCount -ge 15) { $score += 10; [void]$reasons.Add("className count: $classCount") }

  if ($cssBytes -ge 5000) { $score += 20; [void]$reasons.Add("substantial CSS: $cssBytes bytes") }
  elseif ($cssBytes -gt 0) { $score += 5; [void]$reasons.Add("small CSS: $cssBytes bytes") }
  else { [void]$reject.Add("CSS empty") }

  foreach ($term in $requiredText) {
    if ($HudText -like ("*" + $term + "*")) { $score += 2 } else { [void]$reject.Add("missing required text marker: $term") }
  }

  foreach ($term in $candidateDesiredMarkers) {
    if ($HudText -like ("*" + $term + "*")) { $score += 4 }
  }

  foreach ($term in $cssVisualMarkers) {
    if ($CssText -like ("*" + $term + "*")) { $score += 3 }
  }

  $badMarkerHits = 0
  foreach ($term in $badCurrentVisualMarkers) {
    if ($HudText -like ("*" + $term + "*")) { $badMarkerHits += 1 }
  }

  if ($badMarkerHits -ge 5) {
    $score -= 90
    [void]$reject.Add("matches rejected current wrong screen markers: $badMarkerHits")
  } elseif ($badMarkerHits -gt 0) {
    $score -= (10 * $badMarkerHits)
    [void]$reject.Add("contains some rejected current screen markers: $badMarkerHits")
  }

  # Strict pass rule: must be styled, must include core doctrine, and must NOT match the rejected current screenshot layout.
  $strictPass = $true
  if (!$HudExists -or !$CssExists) { $strictPass = $false }
  if (!$moduleImport) { $strictPass = $false }
  if ($stylesCount -lt 15) { $strictPass = $false }
  if ($cssBytes -lt 5000) { $strictPass = $false }
  if (!(HasAll $HudText @("KINGSMEN","JARVIS","COMMANDER","V5"))) { $strictPass = $false }
  if ($badMarkerHits -ge 5) { $strictPass = $false }

  [pscustomobject]@{
    SourceType = $SourceType
    SourceRoot = $SourceRoot
    HudPath = $HudPath
    CssPath = $CssPath
    Score = [int]$score
    StrictPass = [bool]$strictPass
    RejectedCurrentScreenMarkerHits = [int]$badMarkerHits
    HudExists = [bool]$HudExists
    CssExists = [bool]$CssExists
    HudBytes = [int]$hudBytes
    CssBytes = [int]$cssBytes
    HudSha256 = [string](Sha256Text $HudText)
    CssSha256 = [string](Sha256Text $CssText)
    StylesUsageCount = [int]$stylesCount
    ClassNameCount = [int]$classCount
    CssModuleImport = [bool]$moduleImport
    Reasons = [string](($reasons.ToArray()) -join "; ")
    RejectReasons = [string](($reject.ToArray()) -join "; ")
  }
}

function RestoreCandidate($Candidate, [string]$Repo, [string]$HudRel, [string]$CssRel, [string]$ReportDir, [string]$DocsDir) {
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $safety = Join-Path $Repo ("backups\jarvis-step-01j-before-restore-" + $stamp)
  EnsureDir $safety

  $liveHud = Join-Path $Repo $HudRel
  $liveCss = Join-Path $Repo $CssRel

  if (Test-Path $liveHud) {
    $d = Join-Path $safety $HudRel
    EnsureDir (Split-Path -Parent $d)
    Copy-Item $liveHud $d -Force
  }
  if (Test-Path $liveCss) {
    $d = Join-Path $safety $CssRel
    EnsureDir (Split-Path -Parent $d)
    Copy-Item $liveCss $d -Force
  }

  Copy-Item $Candidate.HudPath $liveHud -Force
  Copy-Item $Candidate.CssPath $liveCss -Force

  $liveHudSha = Sha256File $liveHud
  $liveCssSha = Sha256File $liveCss

  if ($liveHudSha -ne $Candidate.HudSha256) { throw "HUD restore SHA verification failed." }
  if ($liveCssSha -ne $Candidate.CssSha256) { throw "CSS restore SHA verification failed." }

  $now = (Get-Date).ToUniversalTime().ToString("o")
  $layoutLock = [ordered]@{
    lock_name = "jarvis-layout-lock"
    status = "LOCKED_BY_STEP_01J_STRICT_FINGERPRINT"
    locked_at = $now
    restored_from = $Candidate.SourceRoot
    strict_pass = $Candidate.StrictPass
    rejected_current_screen_marker_hits = $Candidate.RejectedCurrentScreenMarkerHits
    files = @(
      [ordered]@{ path = $HudRel; sha256 = $liveHudSha },
      [ordered]@{ path = $CssRel; sha256 = $liveCssSha }
    )
    rule = "No visual file change without strict fingerprint proof and safety backup."
  }
  WriteNoBom (Join-Path $Repo "manifests\jarvis\jarvis-layout-lock.json") ($layoutLock | ConvertTo-Json -Depth 20)

  $restoreProof = [ordered]@{
    step = "STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE"
    action = "RESTORE_APPLIED"
    status = "COMPLETE"
    created_at = $now
    restored_from = $Candidate.SourceRoot
    safety_backup = $safety
    live_hud_sha256 = $liveHudSha
    live_css_sha256 = $liveCssSha
    next = "Restart Next server if the browser cache still shows the old screen."
  }
  $restoreProofPath = Join-Path $ReportDir "STEP_01J_RESTORE_APPLIED_PROOF.json"
  WriteNoBom $restoreProofPath ($restoreProof | ConvertTo-Json -Depth 30)

  $ledger = @(
    "",
    "## STEP 01J - Strict Visual Fingerprint Restore Gate",
    "",
    "Status: RESTORE APPLIED at $now",
    "",
    "Restored from:",
    "- " + $Candidate.SourceRoot,
    "",
    "Safety backup:",
    "- " + $safety,
    "",
    "Proof:",
    "- " + $restoreProofPath,
    ""
  )
  Add-Content -Path (Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md") -Value $ledger -Encoding UTF8

  return $restoreProof
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01J - VISUAL FINGERPRINT RESTORE GATE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Strict source proof. Restore only if exactly one source passes." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }
if (!(Test-Path (Join-Path $Repo "apps\web"))) { throw "Web app not found inside repo." }

$HudRel = "apps\web\src\app\jarvis\JarvisHudClient.tsx"
$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"
$LiveHud = Join-Path $Repo $HudRel
$LiveCss = Join-Path $Repo $CssRel

$ReportDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
EnsureDir $ReportDir
EnsureDir $DocsDir
EnsureDir $ToolsDir
EnsureDir (Join-Path $Repo "manifests\jarvis")

$JsonProof = Join-Path $ReportDir "STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE_PROOF.json"
$MdReport = Join-Path $ReportDir "STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE_REPORT.md"

$candidates = New-Object System.Collections.Generic.List[object]

$current = CandidateObject "LIVE_CURRENT" $Repo $LiveHud $LiveCss (ReadTextSafe $LiveHud) (ReadTextSafe $LiveCss) (Test-Path $LiveHud) (Test-Path $LiveCss)
$candidates.Add($current)

$BackupRoot = Join-Path $Repo "backups"
if (Test-Path $BackupRoot) {
  $dirs = Get-ChildItem -Path $BackupRoot -Directory -Recurse -ErrorAction SilentlyContinue
  foreach ($dir in $dirs) {
    $h = Join-Path $dir.FullName $HudRel
    $c = Join-Path $dir.FullName $CssRel
    if ((Test-Path $h) -or (Test-Path $c)) {
      $candidates.Add((CandidateObject "BACKUP" $dir.FullName $h $c (ReadTextSafe $h) (ReadTextSafe $c) (Test-Path $h) (Test-Path $c)))
    }
  }
}

# Git history is read-only and used only as evidence. It cannot be restored directly by this script.
try {
  $inside = (& git -C $Repo rev-parse --is-inside-work-tree 2>$null)
  if ($inside -eq "true") {
    $logLines = & git -C $Repo log --all --format="%H|%ci|%s" -- $HudRel 2>$null
    $taken = 0
    foreach ($line in $logLines) {
      if ($taken -ge 80) { break }
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
        $tmpRoot = "GIT:" + $sha + " | " + $date + " | " + $subject
        $candidates.Add((CandidateObject "GIT_READONLY" $tmpRoot "" "" $hudGit $cssGit ($hudGit.Length -gt 0) ($cssGit.Length -gt 0)))
        $taken++
      }
    }
  }
} catch {}

$all = @($candidates.ToArray())
$sorted = $all | Sort-Object -Property Score, CssBytes, HudBytes -Descending
$strictBackupPasses = @($sorted | Where-Object { $_.StrictPass -eq $true -and $_.SourceType -eq "BACKUP" })

$action = "NO_RESTORE"
$status = "NEEDS_COMMANDER_SELECTION"
$restoreResult = $null
$selected = $null

if ($strictBackupPasses.Count -eq 1) {
  $selected = $strictBackupPasses[0]
  $restoreResult = RestoreCandidate $selected $Repo $HudRel $CssRel $ReportDir $DocsDir
  $action = "RESTORE_APPLIED"
  $status = "COMPLETE"
} elseif ($strictBackupPasses.Count -gt 1) {
  $status = "MULTIPLE_STRICT_PASSES_NO_RESTORE"
} else {
  $status = "NO_STRICT_PASS_NO_RESTORE"
}

$now = (Get-Date).ToUniversalTime().ToString("o")

$topObjects = @()
foreach ($cand in ($sorted | Select-Object -First 30)) {
  $topObjects += [ordered]@{
    source_type = $cand.SourceType
    source_root = $cand.SourceRoot
    score = $cand.Score
    strict_pass = $cand.StrictPass
    rejected_current_screen_marker_hits = $cand.RejectedCurrentScreenMarkerHits
    hud_bytes = $cand.HudBytes
    css_bytes = $cand.CssBytes
    styles_usage_count = $cand.StylesUsageCount
    className_count = $cand.ClassNameCount
    css_module_import = $cand.CssModuleImport
    hud_sha256 = $cand.HudSha256
    css_sha256 = $cand.CssSha256
    reasons = $cand.Reasons
    reject_reasons = $cand.RejectReasons
  }
}

$proof = [ordered]@{
  step = "STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE"
  status = $status
  action = $action
  created_at = $now
  repo = $Repo
  live_current = [ordered]@{
    source_type = $current.SourceType
    source_root = $current.SourceRoot
    score = $current.Score
    strict_pass = $current.StrictPass
    rejected_current_screen_marker_hits = $current.RejectedCurrentScreenMarkerHits
    hud_sha256 = $current.HudSha256
    css_sha256 = $current.CssSha256
    reject_reasons = $current.RejectReasons
  }
  strict_backup_pass_count = $strictBackupPasses.Count
  selected_source = if ($null -ne $selected) { $selected.SourceRoot } else { $null }
  restore_result = $restoreResult
  top_candidates = $topObjects
  report = $MdReport
}
WriteNoBom $JsonProof ($proof | ConvertTo-Json -Depth 50)

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# STEP 01J - Visual Fingerprint and Restore Gate")
$md.Add("")
$md.Add("Created: $now")
$md.Add("")
$md.Add("Status: $status")
$md.Add("Action: $action")
$md.Add("")
$md.Add("## Current live screen source")
$md.Add("")
$md.Add("- Score: " + $current.Score)
$md.Add("- Strict pass: " + $current.StrictPass)
$md.Add("- Rejected current screen marker hits: " + $current.RejectedCurrentScreenMarkerHits)
$md.Add("- Reject reasons: " + $current.RejectReasons)
$md.Add("")
$md.Add("## Strict backup passes")
$md.Add("")
$md.Add("Count: " + $strictBackupPasses.Count)
$md.Add("")
foreach ($cand in $strictBackupPasses) {
  $md.Add("### Strict pass")
  $md.Add("- Source: " + $cand.SourceRoot)
  $md.Add("- Score: " + $cand.Score)
  $md.Add("- HUD SHA: " + $cand.HudSha256)
  $md.Add("- CSS SHA: " + $cand.CssSha256)
  $md.Add("- Reasons: " + $cand.Reasons)
  $md.Add("")
}
$md.Add("## Top candidates")
$md.Add("")
$i = 1
foreach ($cand in ($sorted | Select-Object -First 30)) {
  $md.Add("### Candidate $i")
  $md.Add("- Source type: " + $cand.SourceType)
  $md.Add("- Source: " + $cand.SourceRoot)
  $md.Add("- Score: " + $cand.Score)
  $md.Add("- Strict pass: " + $cand.StrictPass)
  $md.Add("- Rejected current screen marker hits: " + $cand.RejectedCurrentScreenMarkerHits)
  $md.Add("- HUD bytes: " + $cand.HudBytes)
  $md.Add("- CSS bytes: " + $cand.CssBytes)
  $md.Add("- Styles usage count: " + $cand.StylesUsageCount)
  $md.Add("- Reasons: " + $cand.Reasons)
  $md.Add("- Reject reasons: " + $cand.RejectReasons)
  $md.Add("")
  $i++
}
WriteNoBom $MdReport (($md.ToArray() -join "`r`n") + "`r`n")

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE.ps1") -Force
}
$cmdPath = "C:\Kingsmen\JARVIS_STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE.cmd"
$cmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 01J VISUAL FINGERPRINT RESTORE GATE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01J_VISUAL_FINGERPRINT_AND_RESTORE_GATE.ps1"""
)
[System.IO.File]::WriteAllLines($cmdPath, $cmdLines, [System.Text.Encoding]::ASCII)

Write-Host "STEP 01J COMPLETE." -ForegroundColor Green
Write-Host ""
Write-Host ("Status: " + $status) -ForegroundColor Cyan
Write-Host ("Action: " + $action) -ForegroundColor Cyan
Write-Host ("Strict backup pass count: " + $strictBackupPasses.Count) -ForegroundColor Cyan
Write-Host ""
if ($action -eq "RESTORE_APPLIED") {
  Write-Host "RESTORED FROM:" -ForegroundColor Green
  Write-Host $selected.SourceRoot -ForegroundColor Green
  Write-Host ""
  Write-Host "Restart server or hard refresh if old screen remains." -ForegroundColor Yellow
} else {
  Write-Host "NO RESTORE APPLIED." -ForegroundColor Yellow
  Write-Host "Send the Status and Strict backup pass count lines." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Proof:" -ForegroundColor Cyan
Write-Host $JsonProof
Write-Host $MdReport
