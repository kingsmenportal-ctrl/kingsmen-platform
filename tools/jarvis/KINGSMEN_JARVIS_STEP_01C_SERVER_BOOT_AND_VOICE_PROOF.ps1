# KINGSMEN JARVIS STEP 01C - SERVER BOOT AND VOICE PROOF
# Purpose:
#   Fix 127.0.0.1 refused to connect by starting the real Kingsmen web server.
#   Start voice capture only after /jarvis or /api/jarvis/status responds.
#   Do not change the Jarvis layout.

$ErrorActionPreference = "Continue"

$Repo = "C:\Kingsmen\kingsmen-platform"
$RuntimeDir = Join-Path $Repo "reports\jarvis\runtime"
$LogPath = Join-Path $RuntimeDir "STEP_01C_SERVER_BOOT_AND_VOICE_PROOF.log"
$StatePath = Join-Path $RuntimeDir "STEP_01C_SERVER_BOOT_AND_VOICE_PROOF_STATE.json"
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
  param([string]$Status, [string]$Detail)
  $State = [ordered]@{
    step = "STEP_01C_SERVER_BOOT_AND_VOICE_PROOF"
    status = $Status
    detail = $Detail
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
    repo = $Repo
    url = $Url
    status_url = $StatusUrl
    log = $LogPath
  }
  $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding UTF8
}

function TestUrl {
  param([string]$TestUrl)
  try {
    $Response = Invoke-WebRequest -Uri $TestUrl -UseBasicParsing -TimeoutSec 3
    return ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function GetPackageManager {
  if (Test-Path (Join-Path $Repo "pnpm-lock.yaml")) { return "pnpm" }
  if (Test-Path (Join-Path $Repo "yarn.lock")) { return "yarn" }
  return "npm"
}

function StartWebServer {
  $PM = GetPackageManager
  Log ("Package manager selected: " + $PM) "Cyan"

  if ($PM -eq "pnpm") {
    $Command = 'cd /d "C:\Kingsmen\kingsmen-platform" && pnpm dev -- -H 127.0.0.1 -p 3000'
  } elseif ($PM -eq "yarn") {
    $Command = 'cd /d "C:\Kingsmen\kingsmen-platform" && yarn dev -H 127.0.0.1 -p 3000'
  } else {
    $Command = 'cd /d "C:\Kingsmen\kingsmen-platform" && npm run dev -- -H 127.0.0.1 -p 3000'
  }

  Log ("Starting web server command: " + $Command) "Yellow"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $Command -WindowStyle Normal
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01C - SERVER BOOT AND VOICE PROOF" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This fixes ERR_CONNECTION_REFUSED by proving the web server is online first." -ForegroundColor White
Write-Host "This does not change the Jarvis layout." -ForegroundColor White
Write-Host ""

SaveState "starting" "Step 01C started."

if (!(Test-Path $Repo)) {
  Log "Repo missing: C:\Kingsmen\kingsmen-platform" "Red"
  SaveState "failed" "Repo missing."
  Read-Host "Press Enter"
  exit 1
}

if (!(Test-Path (Join-Path $Repo "package.json"))) {
  Log "package.json missing in repo. Cannot start Next server." "Red"
  SaveState "failed" "package.json missing."
  Read-Host "Press Enter"
  exit 1
}

try {
  $NodeVersion = node --version
  Log ("Node detected: " + $NodeVersion) "Green"
} catch {
  Log "Node is not available in PATH. Install Node.js or repair PATH before running Jarvis web server." "Red"
  SaveState "failed" "Node missing."
  Read-Host "Press Enter"
  exit 1
}

if (TestUrl $Url -or TestUrl $StatusUrl) {
  Log "Jarvis server already responds on port 3000." "Green"
} else {
  Log "Jarvis server is not responding yet. Starting it now." "Yellow"
  StartWebServer
}

$Online = $false
for ($i = 1; $i -le 60; $i++) {
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
  Log ("Waiting for Jarvis server... " + ($i * 2) + " seconds") "DarkYellow"
}

if (-not $Online) {
  Log "SERVER STILL OFFLINE. Do not test voice yet." "Red"
  Log "Look at the separate Kingsmen web server window. It contains the real npm/pnpm error." "Red"
  SaveState "server-offline" "Server did not respond on port 3000."
  Start-Process notepad.exe $LogPath
  Read-Host "Press Enter"
  exit 1
}

SaveState "server-online" "Jarvis server responds on port 3000."

Start-Process $Url
Log ("Opened Jarvis URL: " + $Url) "Green"

$VoiceCmd = "C:\Kingsmen\JARVIS_STEP_01B_VOICE_CHANNEL_REPAIR.cmd"
if (Test-Path $VoiceCmd) {
  Log "Starting Step 01B voice capture now." "Green"
  Start-Process -FilePath $VoiceCmd
  SaveState "voice-started" "Server online and voice capture started."
} else {
  Log "Step 01B voice launcher missing. Reinstall Step 01B." "Red"
  SaveState "voice-launcher-missing" "Step 01B launcher missing."
}

Write-Host ""
Write-Host "If the voice window opens, say: Jarvis" -ForegroundColor Yellow
Write-Host "Expected: SPEECH DETECTED, RECOGNIZED, WAKE ROUTE ACTIVE" -ForegroundColor Yellow
Write-Host ""
