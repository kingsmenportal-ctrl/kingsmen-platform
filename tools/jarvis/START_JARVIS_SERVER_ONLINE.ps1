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