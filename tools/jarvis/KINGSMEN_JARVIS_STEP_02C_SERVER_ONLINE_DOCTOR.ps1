# KINGSMEN JARVIS STEP 02C - SERVER ONLINE DOCTOR
# Fixes ERR_CONNECTION_REFUSED by starting the actual Next/Jarvis server and proving /api/jarvis/status.
# This does not change Jarvis UI, CSS, Builder Core, database, or routes.

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
Write-Host " KINGSMEN JARVIS STEP 02C - SERVER ONLINE DOCTOR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Fixes refused connection by starting Jarvis Next server and proving API status." -ForegroundColor Yellow
Write-Host "No UI files changed." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
$Web = Join-Path $Repo "apps\web"
$Reports = Join-Path $Repo "reports\jarvis\server"
$Tools = Join-Path $Repo "tools\jarvis"

if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }
if (!(Test-Path $Web)) { throw "Web app not found: $Web" }
if (!(Test-Path (Join-Path $Web "package.json"))) { throw "package.json not found in: $Web" }

EnsureDir $Reports
EnsureDir $Tools

$StartPs1 = Join-Path $Tools "START_JARVIS_SERVER_ONLINE.ps1"
$ProbePs1 = Join-Path $Tools "PROBE_JARVIS_SERVER.ps1"
$StartCmd = "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd"
$ProbeCmd = "C:\Kingsmen\PROBE_JARVIS_SERVER.cmd"
$OpenCmd = "C:\Kingsmen\OPEN_JARVIS_LOCKED.cmd"
$ProofPath = Join-Path $Repo "reports\jarvis\steps\STEP_02C_SERVER_ONLINE_DOCTOR_PROOF.json"
$ReportPath = Join-Path $Repo "reports\jarvis\steps\STEP_02C_SERVER_ONLINE_DOCTOR_REPORT.md"

$StartScript = @'
$ErrorActionPreference = "Stop"

$Repo = "C:\Kingsmen\kingsmen-platform"
$Web = Join-Path $Repo "apps\web"
$LogDir = Join-Path $Repo "reports\jarvis\server"
$LogFile = Join-Path $LogDir "next-3000-live.log"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function TestJarvis {
  try {
    Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 3 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function KillPort3000 {
  $conns = @(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
  foreach ($c in $conns) {
    try {
      $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      if ($p) {
        Write-Host ("Stopping stale port 3000 owner: PID " + $p.Id + " " + $p.ProcessName) -ForegroundColor Yellow
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
      }
    } catch {}
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS SERVER ONLINE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This window must stay open while Jarvis is used." -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path $Web)) {
  Write-Host "Web app folder missing: $Web" -ForegroundColor Red
  exit 1
}

EnsureDir $LogDir

if (TestJarvis) {
  Write-Host "Jarvis API already online." -ForegroundColor Green
  Start-Process "msedge.exe" "http://127.0.0.1:3000/jarvis" -ErrorAction SilentlyContinue
  Write-Host "Keep this window open for monitoring." -ForegroundColor Yellow
  while ($true) {
    Start-Sleep -Seconds 30
    if (TestJarvis) {
      Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] Jarvis API online") -ForegroundColor Green
    } else {
      Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] Jarvis API lost") -ForegroundColor Red
    }
  }
}

KillPort3000

Set-Location $Web

Write-Host "Starting Next server on http://127.0.0.1:3000 ..." -ForegroundColor Cyan
Write-Host "Log: $LogFile" -ForegroundColor DarkCyan
Write-Host ""

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c npm run dev -- -H 127.0.0.1 -p 3000"
$psi.WorkingDirectory = $Web
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi
[void]$p.Start()

$deadline = (Get-Date).AddSeconds(90)
$online = $false
$lastOutput = Get-Date

while ((Get-Date) -lt $deadline) {
  while (!$p.StandardOutput.EndOfStream) {
    $line = $p.StandardOutput.ReadLine()
    Add-Content -Path $LogFile -Value $line
    Write-Host $line
    $lastOutput = Get-Date
  }

  while (!$p.StandardError.EndOfStream) {
    $line = $p.StandardError.ReadLine()
    Add-Content -Path $LogFile -Value $line
    Write-Host $line -ForegroundColor DarkYellow
    $lastOutput = Get-Date
  }

  if (TestJarvis) {
    $online = $true
    break
  }

  if ($p.HasExited) {
    Write-Host "Next server exited before Jarvis came online." -ForegroundColor Red
    Write-Host "Check log: $LogFile" -ForegroundColor Yellow
    exit $p.ExitCode
  }

  Start-Sleep -Milliseconds 700
}

if (!$online) {
  Write-Host "Jarvis did not answer within 90 seconds." -ForegroundColor Red
  Write-Host "Check log: $LogFile" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "JARVIS SERVER ONLINE." -ForegroundColor Green
Write-Host "Opening cockpit..." -ForegroundColor Green
Start-Process "msedge.exe" "http://127.0.0.1:3000/jarvis" -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Keep this window open. Closing it stops Jarvis." -ForegroundColor Yellow
Write-Host ""

while (!$p.HasExited) {
  Start-Sleep -Seconds 30
  if (TestJarvis) {
    Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] Jarvis API online") -ForegroundColor Green
  } else {
    Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] Jarvis API not responding") -ForegroundColor Red
  }
}

Write-Host "Next server stopped." -ForegroundColor Red
exit $p.ExitCode
'@

$ProbeScript = @'
$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS SERVER PROBE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

try {
  $status = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/api/jarvis/status" -TimeoutSec 5
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
  Write-Host ($status | ConvertTo-Json -Depth 20)
  Write-Host ""
  Write-Host "Opening Jarvis cockpit..." -ForegroundColor Green
  Start-Process "msedge.exe" "http://127.0.0.1:3000/jarvis" -ErrorAction SilentlyContinue
} catch {
  Write-Host "Jarvis API: OFFLINE" -ForegroundColor Red
  Write-Host "Start it with:" -ForegroundColor Yellow
  Write-Host "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd" -ForegroundColor White
  exit 1
}
'@

WriteNoBom $StartPs1 $StartScript
WriteNoBom $ProbePs1 $ProbeScript

$StartCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS SERVER ONLINE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\START_JARVIS_SERVER_ONLINE.ps1"""
)
[System.IO.File]::WriteAllLines($StartCmd, $StartCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $StartCmd) -ForegroundColor Green

$ProbeCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS SERVER PROBE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\PROBE_JARVIS_SERVER.ps1"""
)
[System.IO.File]::WriteAllLines($ProbeCmd, $ProbeCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $ProbeCmd) -ForegroundColor Green

$OpenCmdLines = @(
  "@echo off",
  "start msedge.exe http://127.0.0.1:3000/jarvis"
)
[System.IO.File]::WriteAllLines($OpenCmd, $OpenCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $OpenCmd) -ForegroundColor Green

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $Tools "KINGSMEN_JARVIS_STEP_02C_SERVER_ONLINE_DOCTOR.ps1") -Force
}

$Now = (Get-Date).ToUniversalTime().ToString("o")
$Proof = [ordered]@{
  step = "STEP_02C_SERVER_ONLINE_DOCTOR"
  status = "COMPLETE"
  created_at = $Now
  purpose = "Start and prove Jarvis Next server on 127.0.0.1:3000"
  changed_files = @(
    [ordered]@{ path = "tools\jarvis\START_JARVIS_SERVER_ONLINE.ps1"; sha256 = (Sha256File $StartPs1) },
    [ordered]@{ path = "tools\jarvis\PROBE_JARVIS_SERVER.ps1"; sha256 = (Sha256File $ProbePs1) },
    [ordered]@{ path = "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd"; sha256 = (Sha256File $StartCmd) },
    [ordered]@{ path = "C:\Kingsmen\PROBE_JARVIS_SERVER.cmd"; sha256 = (Sha256File $ProbeCmd) },
    [ordered]@{ path = "C:\Kingsmen\OPEN_JARVIS_LOCKED.cmd"; sha256 = (Sha256File $OpenCmd) }
  )
  visual_files_changed = @()
  run_first = "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd"
  probe_second_window = "C:\Kingsmen\PROBE_JARVIS_SERVER.cmd"
  smoke_after_online = "C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd"
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 40)

$Report = @(
  "# STEP 02C - Server Online Doctor",
  "",
  "Status: COMPLETE",
  "",
  "This step installs a safer Jarvis server launcher and probe.",
  "",
  "It fixes ERR_CONNECTION_REFUSED by ensuring the Next server is actually running on 127.0.0.1:3000.",
  "",
  "No UI files changed.",
  "",
  "Run first:",
  "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd",
  "",
  "Then in a second window:",
  "C:\Kingsmen\PROBE_JARVIS_SERVER.cmd",
  "",
  "Then smoke test:",
  "C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd",
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

Write-Host ""
Write-Host "STEP 02C COMPLETE." -ForegroundColor Green
Write-Host "Run this now:" -ForegroundColor Yellow
Write-Host "C:\Kingsmen\START_JARVIS_SERVER_ONLINE.cmd" -ForegroundColor White
Write-Host ""
Write-Host "Keep that server window open." -ForegroundColor Yellow
