# KINGSMEN JARVIS STEP 01D - SERVER SCRIPT DISCOVERY REPAIR
# Fixes: npm error Missing script: "dev"
# This script finds the correct package.json that owns the Jarvis web app,
# then starts the server from the correct folder.
# It does not change JarvisHudClient.tsx or the locked layout.

$ErrorActionPreference = "Continue"

$Repo = "C:\Kingsmen\kingsmen-platform"
$RuntimeDir = Join-Path $Repo "reports\jarvis\runtime"
$LogPath = Join-Path $RuntimeDir "STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR.log"
$StatePath = Join-Path $RuntimeDir "STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR_STATE.json"
$ReportPath = Join-Path $RuntimeDir "STEP_01D_PACKAGE_SCRIPT_SCAN.json"
$Url = "http://127.0.0.1:3000/jarvis"
$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Log {
  param([string]$Message, [string]$Color = "Cyan")
  $Line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Message
  Add-Content -Path $LogPath -Value $Line -Encoding UTF8
  Write-Host $Line -ForegroundColor $Color
}

function SaveState {
  param([string]$Status, [string]$Detail, [string]$TargetDir, [string]$Command)
  $State = [ordered]@{
    step = "STEP_01D_SERVER_SCRIPT_DISCOVERY_REPAIR"
    status = $Status
    detail = $Detail
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
    repo = $Repo
    target_dir = $TargetDir
    command = $Command
    url = $Url
    status_url = $StatusUrl
    log = $LogPath
    scan_report = $ReportPath
  }
  $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding UTF8
}

function TestUrl {
  param([string]$TestUrl)
  try {
    $Response = Invoke-WebRequest -Uri $TestUrl -UseBasicParsing -TimeoutSec 2
    return ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Get-ScriptValue {
  param($PackageObject, [string]$Name)
  try {
    if ($PackageObject.scripts -and $PackageObject.scripts.PSObject.Properties.Name -contains $Name) {
      return [string]$PackageObject.scripts.$Name
    }
  } catch {}
  return $null
}

function Get-PackageManagerForDir {
  param([string]$Dir)
  if (Test-Path (Join-Path $Dir "pnpm-lock.yaml")) { return "pnpm" }
  if (Test-Path (Join-Path $Dir "yarn.lock")) { return "yarn" }
  if (Test-Path (Join-Path $Dir "package-lock.json")) { return "npm" }

  $Parent = Split-Path -Parent $Dir
  while ($Parent -and $Parent.Length -gt 3) {
    if (Test-Path (Join-Path $Parent "pnpm-lock.yaml")) { return "pnpm" }
    if (Test-Path (Join-Path $Parent "yarn.lock")) { return "yarn" }
    if (Test-Path (Join-Path $Parent "package-lock.json")) { return "npm" }
    $Next = Split-Path -Parent $Parent
    if ($Next -eq $Parent) { break }
    $Parent = $Next
  }

  return "npm"
}

function Build-RunCommand {
  param([string]$Dir, [string]$Mode)

  $PM = Get-PackageManagerForDir $Dir

  if ($Mode -eq "npm-dev") {
    if ($PM -eq "pnpm") { return 'cd /d "' + $Dir + '" && pnpm dev -- -H 127.0.0.1 -p 3000' }
    if ($PM -eq "yarn") { return 'cd /d "' + $Dir + '" && yarn dev -H 127.0.0.1 -p 3000' }
    return 'cd /d "' + $Dir + '" && npm run dev -- -H 127.0.0.1 -p 3000'
  }

  if ($Mode -eq "npm-start") {
    if ($PM -eq "pnpm") { return 'cd /d "' + $Dir + '" && pnpm start -- -H 127.0.0.1 -p 3000' }
    if ($PM -eq "yarn") { return 'cd /d "' + $Dir + '" && yarn start -H 127.0.0.1 -p 3000' }
    return 'cd /d "' + $Dir + '" && npm run start -- -H 127.0.0.1 -p 3000'
  }

  if ($Mode -eq "npx-next") {
    return 'cd /d "' + $Dir + '" && npx next dev -H 127.0.0.1 -p 3000'
  }

  return ""
}

function Find-JarvisServerTarget {
  $PackageFiles = @(Get-ChildItem -Path $Repo -Filter "package.json" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "\\node_modules\\" })

  $Rows = @()

  foreach ($File in $PackageFiles) {
    try {
      $Raw = Get-Content $File.FullName -Raw
      $Pkg = $Raw | ConvertFrom-Json
      $Dir = Split-Path -Parent $File.FullName
      $Rel = $Dir.Replace($Repo, "").TrimStart("\")
      if ([string]::IsNullOrWhiteSpace($Rel)) { $Rel = "." }

      $Dev = Get-ScriptValue $Pkg "dev"
      $Start = Get-ScriptValue $Pkg "start"
      $Build = Get-ScriptValue $Pkg "build"

      $HasJarvisRoute = (Test-Path (Join-Path $Dir "src\app\jarvis")) -or (Test-Path (Join-Path $Dir "app\jarvis"))
      $HasNextConfig = (Test-Path (Join-Path $Dir "next.config.js")) -or (Test-Path (Join-Path $Dir "next.config.mjs")) -or (Test-Path (Join-Path $Dir "next.config.ts"))
      $HasViteConfig = (Test-Path (Join-Path $Dir "vite.config.ts")) -or (Test-Path (Join-Path $Dir "vite.config.js"))
      $PackageText = $Raw.ToLowerInvariant()
      $HasNextDep = $PackageText.Contains('"next"')
      $HasViteDep = $PackageText.Contains('"vite"')

      $Score = 0
      if ($Rel -eq "apps\web") { $Score += 100 }
      if ($Rel -like "*apps\web*") { $Score += 80 }
      if ($HasJarvisRoute) { $Score += 70 }
      if ($Dev) { $Score += 50 }
      if ($HasNextConfig -or $HasNextDep) { $Score += 30 }
      if ($Start) { $Score += 15 }
      if ($HasViteConfig -or $HasViteDep) { $Score += 10 }

      $Mode = ""
      if ($Dev) { $Mode = "npm-dev" }
      elseif ($Start) { $Mode = "npm-start" }
      elseif ($HasNextConfig -or $HasNextDep) { $Mode = "npx-next" }

      $Rows += [pscustomobject]@{
        path = $Rel
        full_path = $Dir
        name = [string]$Pkg.name
        dev = $Dev
        start = $Start
        build = $Build
        has_jarvis_route = $HasJarvisRoute
        has_next = ($HasNextConfig -or $HasNextDep)
        has_vite = ($HasViteConfig -or $HasViteDep)
        mode = $Mode
        score = $Score
      }
    } catch {
      $Rows += [pscustomobject]@{
        path = $File.FullName.Replace($Repo, "").TrimStart("\")
        full_path = Split-Path -Parent $File.FullName
        name = "UNREADABLE"
        dev = $null
        start = $null
        build = $null
        has_jarvis_route = $false
        has_next = $false
        has_vite = $false
        mode = ""
        score = 0
        error = $_.Exception.Message
      }
    }
  }

  $Rows | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8

  foreach ($R in ($Rows | Sort-Object score -Descending)) {
    Log ("PACKAGE: " + $R.path + " | score=" + $R.score + " | dev=" + $R.dev + " | start=" + $R.start + " | mode=" + $R.mode) "DarkCyan"
  }

  $Best = $Rows | Where-Object { $_.mode -ne "" } | Sort-Object score -Descending | Select-Object -First 1
  return $Best
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01D - SERVER SCRIPT DISCOVERY REPAIR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Fixing: npm error Missing script: dev" -ForegroundColor White
Write-Host "This does not change the Jarvis layout." -ForegroundColor White
Write-Host ""

SaveState "starting" "Step 01D started." "" ""

if (!(Test-Path $Repo)) {
  Log "Repo missing: C:\Kingsmen\kingsmen-platform" "Red"
  SaveState "failed" "Repo missing." "" ""
  Read-Host "Press Enter"
  exit 1
}

try {
  $NodeVersion = node --version
  Log ("Node detected: " + $NodeVersion) "Green"
} catch {
  Log "Node is not available in PATH. Node is required before Jarvis can run." "Red"
  SaveState "failed" "Node missing." "" ""
  Read-Host "Press Enter"
  exit 1
}

if (TestUrl $Url -or TestUrl $StatusUrl) {
  Log "Jarvis server already responds on port 3000." "Green"
  SaveState "server-online" "Already online." "" ""
  Start-Process $Url
  exit 0
}

$Target = Find-JarvisServerTarget

if ($null -eq $Target) {
  Log "No runnable web package found. No package.json has dev/start/Next fallback." "Red"
  Log ("Scan report: " + $ReportPath) "Red"
  SaveState "failed" "No runnable package found." "" ""
  Start-Process notepad.exe $ReportPath
  Read-Host "Press Enter"
  exit 1
}

$Command = Build-RunCommand -Dir $Target.full_path -Mode $Target.mode

if ([string]::IsNullOrWhiteSpace($Command)) {
  Log "Could not build a start command from discovered package." "Red"
  SaveState "failed" "Could not build command." $Target.full_path ""
  Read-Host "Press Enter"
  exit 1
}

Log ("SELECTED SERVER PACKAGE: " + $Target.path) "Green"
Log ("SELECTED MODE: " + $Target.mode) "Green"
Log ("COMMAND: " + $Command) "Yellow"

SaveState "starting-server" "Starting selected server package." $Target.full_path $Command

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $Command -WindowStyle Normal

$Online = $false
for ($i = 1; $i -le 90; $i++) {
  Start-Sleep -Seconds 2
  if (TestUrl $StatusUrl) {
    Log ("Jarvis API ONLINE after " + ($i * 2) + " seconds: " + $StatusUrl) "Green"
    $Online = $true
    break
  }
  if (TestUrl $Url) {
    Log ("Jarvis page ONLINE after " + ($i * 2) + " seconds: " + $Url) "Green"
    $Online = $true
    break
  }
  Log ("Waiting for selected server package... " + ($i * 2) + " seconds") "DarkYellow"
}

if (-not $Online) {
  Log "SERVER STILL OFFLINE after selected package launch." "Red"
  Log "Look at the separate server window. That window contains the real build/runtime error." "Red"
  Log ("Package scan report: " + $ReportPath) "Red"
  SaveState "server-offline" "Selected package did not respond." $Target.full_path $Command
  Start-Process notepad.exe $LogPath
  Read-Host "Press Enter"
  exit 1
}

SaveState "server-online" "Jarvis server responds on port 3000." $Target.full_path $Command

Start-Process $Url
Log ("Opened Jarvis URL: " + $Url) "Green"

$VoiceCmd = "C:\Kingsmen\JARVIS_STEP_01B_VOICE_CHANNEL_REPAIR.cmd"
if (Test-Path $VoiceCmd) {
  Log "Starting Step 01B voice capture now." "Green"
  Start-Process -FilePath $VoiceCmd
  SaveState "voice-started" "Server online and voice capture started." $Target.full_path $Command
} else {
  Log "Step 01B voice launcher missing. Reinstall Step 01B." "Red"
  SaveState "voice-launcher-missing" "Step 01B launcher missing." $Target.full_path $Command
}

Write-Host ""
Write-Host "If the voice window opens, say: Jarvis" -ForegroundColor Yellow
Write-Host "Expected: SPEECH DETECTED, RECOGNIZED, WAKE ROUTE ACTIVE" -ForegroundColor Yellow
Write-Host ""
