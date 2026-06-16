# KINGSMEN JARVIS STEP 01N - SERVER DOCTOR AND OPEN
# Purpose:
# - Does NOT touch the Jarvis visual layout.
# - Starts the real Next.js Jarvis web server if it is not running.
# - Opens Jarvis only after http://127.0.0.1:3000/api/jarvis/status responds.
# - Prevents confusion with OpenClaw logs. OpenClaw is not the Next server.

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

function Test-JarvisStatus {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 3
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
    return $false
  } catch {
    return $false
  }
}

function Get-PortOwner {
  try {
    $c = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (!$c) { return $null }
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if (!$p) { return [ordered]@{ pid = $c.OwningProcess; process = "unknown" } }
    return [ordered]@{ pid = $p.Id; process = $p.ProcessName; path = $p.Path }
  } catch {
    return $null
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01N - SERVER DOCTOR AND OPEN" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "No visual files changed. This starts/opens the real Jarvis web server." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
$Web = Join-Path $Repo "apps\web"
$Url = "http://127.0.0.1:3000/jarvis"
$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
$Reports = Join-Path $Repo "reports\jarvis\steps"
$Runtime = Join-Path $Repo "reports\jarvis\runtime"
$Tools = Join-Path $Repo "tools\jarvis"
EnsureDir $Reports
EnsureDir $Runtime
EnsureDir $Tools
EnsureDir "C:\Kingsmen"

if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }
if (!(Test-Path $Web)) { throw "Web app not found: $Web" }
if (!(Test-Path (Join-Path $Web "package.json"))) { throw "package.json not found inside $Web" }

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ServerCmd = Join-Path $Runtime ("START_NEXT_JARVIS_SERVER_" + $Stamp + ".cmd")

$serverCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS NEXT SERVER - DO NOT CLOSE",
  "cd /d ""C:\Kingsmen\kingsmen-platform\apps\web""",
  "echo ===============================================================",
  "echo KINGSMEN JARVIS NEXT SERVER - DO NOT CLOSE THIS WINDOW",
  "echo ===============================================================",
  "echo URL: http://127.0.0.1:3000/jarvis",
  "echo.",
  "npm run dev -- -H 127.0.0.1 -p 3000"
)
[System.IO.File]::WriteAllLines($ServerCmd, $serverCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $ServerCmd) -ForegroundColor Green

$beforeOwner = Get-PortOwner
$startedNewServer = $false
$alreadyOnline = Test-JarvisStatus

if ($alreadyOnline) {
  Write-Host "Jarvis API already online on port 3000." -ForegroundColor Green
} else {
  if ($beforeOwner) {
    Write-Host ("Port 3000 is occupied by PID " + $beforeOwner.pid + " (" + $beforeOwner.process + "), but Jarvis API is not responding.") -ForegroundColor Yellow
    Write-Host "Stopping the broken port 3000 process before restart..." -ForegroundColor Yellow
    try { Stop-Process -Id $beforeOwner.pid -Force -ErrorAction SilentlyContinue } catch {}
    Start-Sleep -Seconds 2
  } else {
    Write-Host "Port 3000 is not listening. Starting Next server..." -ForegroundColor Cyan
  }

  Start-Process "cmd.exe" -ArgumentList "/k `"$ServerCmd`""
  $startedNewServer = $true

  Write-Host "Waiting for Jarvis API..." -ForegroundColor Cyan
  $ok = $false
  for ($i = 1; $i -le 45; $i++) {
    Start-Sleep -Seconds 1
    if (Test-JarvisStatus) {
      $ok = $true
      break
    }
    Write-Host ("wait " + $i + "/45") -ForegroundColor DarkGray
  }

  if (!$ok) {
    $owner = Get-PortOwner
    $proofFail = [ordered]@{
      step = "STEP_01N_SERVER_DOCTOR_AND_OPEN"
      status = "SERVER_NOT_READY"
      created_at = (Get-Date).ToUniversalTime().ToString("o")
      port_owner = $owner
      server_cmd = $ServerCmd
      status_url = $StatusUrl
      message = "Next server did not answer within 45 seconds. Read the separate KINGSMEN JARVIS NEXT SERVER window error."
    }
    $FailPath = Join-Path $Reports "STEP_01N_SERVER_DOCTOR_AND_OPEN_FAILED_PROOF.json"
    WriteNoBom $FailPath ($proofFail | ConvertTo-Json -Depth 20)
    Write-Host ""
    Write-Host "SERVER NOT READY." -ForegroundColor Red
    Write-Host "Look at the separate window titled: KINGSMEN JARVIS NEXT SERVER - DO NOT CLOSE" -ForegroundColor Yellow
    Write-Host "Send me the error from that window only." -ForegroundColor Yellow
    exit 1
  }
}

Start-Process "msedge.exe" "--app=$Url"

$ProofPath = Join-Path $Reports "STEP_01N_SERVER_DOCTOR_AND_OPEN_PROOF.json"
$ReportPath = Join-Path $Reports "STEP_01N_SERVER_DOCTOR_AND_OPEN_REPORT.md"
$ownerAfter = Get-PortOwner
$Proof = [ordered]@{
  step = "STEP_01N_SERVER_DOCTOR_AND_OPEN"
  status = "COMPLETE"
  created_at = (Get-Date).ToUniversalTime().ToString("o")
  visual_files_changed = @()
  server_started_new = $startedNewServer
  jarvis_status_url = $StatusUrl
  jarvis_url = $Url
  port_owner_after = $ownerAfter
  server_cmd = $ServerCmd
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 20)

$Report = @(
  "# STEP 01N - Server Doctor and Open",
  "",
  "Status: COMPLETE",
  "",
  "No visual files were changed.",
  "",
  "What happened:",
  "- Jarvis was opened only after the local Next API answered.",
  "- If port 3000 was occupied by a broken process, it was stopped and restarted.",
  "- OpenClaw logs are separate and are not the Jarvis Next server.",
  "",
  "Jarvis URL:",
  "- http://127.0.0.1:3000/jarvis",
  "",
  "Proof:",
  "- $ProofPath",
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $Tools "KINGSMEN_JARVIS_STEP_01N_SERVER_DOCTOR_AND_OPEN.ps1") -Force
}

$MainCmd = "C:\Kingsmen\START_JARVIS_NOW.cmd"
$mainCmdLines = @(
  "@echo off",
  "title KINGSMEN START JARVIS NOW",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01N_SERVER_DOCTOR_AND_OPEN.ps1"""
)
[System.IO.File]::WriteAllLines($MainCmd, $mainCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $MainCmd) -ForegroundColor Green

Write-Host ""
Write-Host "STEP 01N COMPLETE." -ForegroundColor Green
Write-Host "Jarvis opened only after the API answered." -ForegroundColor Green
Write-Host "Keep the separate KINGSMEN JARVIS NEXT SERVER window open." -ForegroundColor Yellow
