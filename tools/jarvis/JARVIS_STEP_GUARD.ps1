# KINGSMEN JARVIS STEP GUARD
# ASCII-safe version for Windows PowerShell 5.1.

$ErrorActionPreference = "Stop"

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { $Repo = (Get-Location).Path }

$LockPath = Join-Path $Repo "manifests\jarvis\jarvis-layout-lock.json"
if (!(Test-Path $LockPath)) {
  Write-Host "Layout lock missing. Run Step 00 first." -ForegroundColor Red
  exit 1
}

$Lock = Get-Content $LockPath -Raw | ConvertFrom-Json
$Failed = $false

foreach ($file in $Lock.locked_files) {
  if (-not $file.locked) { continue }

  $Path = Join-Path $Repo $file.path
  if (!(Test-Path $Path)) {
    Write-Host ("MISSING: " + $file.path) -ForegroundColor Red
    $Failed = $true
    continue
  }

  $Bytes = [System.IO.File]::ReadAllBytes($Path)
  $Sha = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($Bytes)).Replace("-","").ToLowerInvariant()

  if ($Sha -ne $file.sha256) {
    Write-Host ("CHANGED: " + $file.path) -ForegroundColor Red
    Write-Host ("Expected: " + $file.sha256) -ForegroundColor DarkYellow
    Write-Host ("Actual:   " + $Sha) -ForegroundColor DarkYellow
    $Failed = $true
  } else {
    Write-Host ("LOCKED OK: " + $file.path) -ForegroundColor Green
  }
}

if ($Failed) {
  Write-Host ""
  Write-Host "JARVIS STEP GUARD FAILED. Layout changed without approval." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "JARVIS STEP GUARD PASSED. Layout preserved." -ForegroundColor Green
exit 0