param(
  [string]$RepoRoot,
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$RedisUrl = "redis://127.0.0.1:6379",
  [int]$Port = 3001,
  [switch]$SkipBuild,
  [switch]$KillExistingPort
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  if (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  } else {
    $RepoRoot = (Get-Location).Path
  }
}

Set-Location $RepoRoot

function Import-KingsmenEnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Env file not found: $Path"
  }

  $imported = 0
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^\s*$') { return }
    if ($_ -match '^\s*([A-Z0-9_]+)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
      $script:imported++
    }
  }

  return $imported
}

function Test-CommandAvailable {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

if ($KillExistingPort) {
  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    try {
      Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
    } catch {
      Write-Warning "Could not stop process on port ${Port}: $($_.Exception.Message)"
    }
  }
}

if (Test-CommandAvailable "docker") {
  docker start kingsmen-truth-vault-local *> $null
  docker start kingsmen-redis-local *> $null
}

$envImportCount = Import-KingsmenEnvFile -Path $EnvFile

if (-not [string]::IsNullOrWhiteSpace($env:KINGSMEN_DATABASE_URL)) {
  $env:DATABASE_URL = $env:KINGSMEN_DATABASE_URL
}

$env:REDIS_URL = $RedisUrl
$env:KINGSMEN_API_PORT = [string]$Port
$env:KINGSMEN_API_HOST = "0.0.0.0"

Write-Host (@{
  schema = "kingsmen.local-api-start.v1"
  module = "Kingsmen Local API Starter"
  envFileLoaded = $true
  envFileImportedCount = $envImportCount
  databaseUrlLoaded = -not [string]::IsNullOrWhiteSpace($env:DATABASE_URL)
  redisUrlLoaded = -not [string]::IsNullOrWhiteSpace($env:REDIS_URL)
  rawSecretsPrinted = $false
  rawConnectionStringsPrinted = $false
  port = $Port
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Depth 5)

if (-not $SkipBuild) {
  npm --prefix apps/api run build
}

npm --prefix apps/api start
