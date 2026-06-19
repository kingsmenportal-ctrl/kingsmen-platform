param(
  [string]$RepoRoot,
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$RedisUrl = "redis://127.0.0.1:6379",
  [int]$Port = 3001,
  [string]$PostgresContainerName = "kingsmen-truth-vault-local",
  [string]$PostgresDatabase = "kingsmen_truth_vault",
  [string]$PostgresUser = "kingsmen",
  [int]$PostgresPort = 55432,
  [switch]$SkipBuild,
  [switch]$KillExistingPort,
  [switch]$NoSyncPostgresPasswordFromContainer,
  [switch]$NoRepairPostgresRolePassword
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

  $script:KingsmenEnvImportedCount = 0
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^\s*$') { return }
    if ($_ -match '^\s*([A-Z0-9_]+)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
      $script:KingsmenEnvImportedCount++
    }
  }

  return $script:KingsmenEnvImportedCount
}

function Test-CommandAvailable {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Read-DockerContainerEnvValue {
  param(
    [string]$ContainerName,
    [string]$EnvName
  )

  if (-not (Test-CommandAvailable "docker")) { return $null }

  $lines = @(& docker inspect $ContainerName --format '{{range .Config.Env}}{{println .}}{{end}}' 2>$null)
  if ($LASTEXITCODE -ne 0 -or -not $lines) { return $null }

  foreach ($line in $lines) {
    if ($line -like "$EnvName=*") {
      return $line.Substring($EnvName.Length + 1)
    }
  }

  return $null
}

function Set-KingsmenEnvFileValue {
  param(
    [string]$Path,
    [string]$Name,
    [string]$Value
  )

  if (-not (Test-Path $Path)) {
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Set-Content -Encoding UTF8 -Path $Path -Value @("# Kingsmen local PostgreSQL Truth Vault runtime env. Do not commit this file.")
  }

  $lines = @(Get-Content -Path $Path)
  $matched = $false
  $updated = foreach ($line in $lines) {
    if ($line -match "^$([regex]::Escape($Name))=") {
      $matched = $true
      "$Name=$Value"
    } else {
      $line
    }
  }

  if (-not $matched) {
    $updated += "$Name=$Value"
  }

  $updated | Set-Content -Encoding UTF8 -Path $Path
}

function New-PostgresConnectionString {
  param(
    [string]$User,
    [string]$Password,
    [string]$HostName,
    [int]$Port,
    [string]$Database
  )

  $encodedUser = [System.Uri]::EscapeDataString($User)
  $encodedPassword = [System.Uri]::EscapeDataString($Password)
  $encodedDatabase = [System.Uri]::EscapeDataString($Database)
  return "postgresql://${encodedUser}:${encodedPassword}@${HostName}:${Port}/${encodedDatabase}"
}

function ConvertTo-PostgresSqlIdentifier {
  param([string]$Value)
  return '"' + ($Value -replace '"', '""') + '"'
}

function ConvertTo-PostgresSqlLiteral {
  param([string]$Value)
  return "'" + ($Value -replace "'", "''") + "'"
}

function Repair-PostgresRolePassword {
  param(
    [string]$ContainerName,
    [string]$Database,
    [string]$User,
    [string]$Password
  )

  if (-not (Test-CommandAvailable "docker")) { return $false }
  if ([string]::IsNullOrWhiteSpace($ContainerName) -or [string]::IsNullOrWhiteSpace($Database) -or [string]::IsNullOrWhiteSpace($User) -or [string]::IsNullOrEmpty($Password)) { return $false }

  $roleIdentifier = ConvertTo-PostgresSqlIdentifier -Value $User
  $passwordLiteral = ConvertTo-PostgresSqlLiteral -Value $Password
  $sql = "ALTER ROLE $roleIdentifier WITH PASSWORD $passwordLiteral;"

  $sql | & docker exec -i $ContainerName psql -U $User -d $Database -v ON_ERROR_STOP=1 *> $null
  if ($LASTEXITCODE -eq 0) { return $true }

  $sql | & docker exec -i $ContainerName psql -U postgres -d $Database -v ON_ERROR_STOP=1 *> $null
  return $LASTEXITCODE -eq 0
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

$postgresContainerStartAttempted = $false
$redisContainerStartAttempted = $false
if (Test-CommandAvailable "docker") {
  docker start $PostgresContainerName *> $null
  $postgresContainerStartAttempted = $true
  docker start kingsmen-redis-local *> $null
  $redisContainerStartAttempted = $true
}

$envImportCount = Import-KingsmenEnvFile -Path $EnvFile

$containerPasswordSynced = $false
$containerPasswordAvailable = $false
$databaseUrlCredentialsUrlEncoded = $false
$postgresRolePasswordRepairAttempted = $false
$postgresRolePasswordRepairSucceeded = $false
if (-not $NoSyncPostgresPasswordFromContainer) {
  $containerPassword = Read-DockerContainerEnvValue -ContainerName $PostgresContainerName -EnvName "POSTGRES_PASSWORD"
  if (-not [string]::IsNullOrWhiteSpace($containerPassword)) {
    $containerPasswordAvailable = $true

    if (-not $NoRepairPostgresRolePassword) {
      $postgresRolePasswordRepairAttempted = $true
      $postgresRolePasswordRepairSucceeded = Repair-PostgresRolePassword -ContainerName $PostgresContainerName -Database $PostgresDatabase -User $PostgresUser -Password $containerPassword
    }

    $databaseUrl = New-PostgresConnectionString -User $PostgresUser -Password $containerPassword -HostName "127.0.0.1" -Port $PostgresPort -Database $PostgresDatabase
    $databaseUrlCredentialsUrlEncoded = $true
    [Environment]::SetEnvironmentVariable("KINGSMEN_POSTGRES_PASSWORD", $containerPassword, 'Process')
    [Environment]::SetEnvironmentVariable("KINGSMEN_DATABASE_URL", $databaseUrl, 'Process')
    [Environment]::SetEnvironmentVariable("DATABASE_URL", $databaseUrl, 'Process')

    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_POSTGRES_PASSWORD" -Value $containerPassword
    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_DATABASE_URL" -Value $databaseUrl
    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_POSTGRES_CONTAINER" -Value $PostgresContainerName
    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_POSTGRES_DATABASE" -Value $PostgresDatabase
    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_POSTGRES_USER" -Value $PostgresUser
    Set-KingsmenEnvFileValue -Path $EnvFile -Name "KINGSMEN_POSTGRES_PORT" -Value ([string]$PostgresPort)
    $containerPasswordSynced = $true
  }
}

if (-not $containerPasswordSynced -and -not [string]::IsNullOrWhiteSpace($env:KINGSMEN_DATABASE_URL)) {
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
  postgresContainerStartAttempted = $postgresContainerStartAttempted
  redisContainerStartAttempted = $redisContainerStartAttempted
  postgresContainerPasswordAvailable = $containerPasswordAvailable
  postgresRolePasswordRepairAttempted = $postgresRolePasswordRepairAttempted
  postgresRolePasswordRepairSucceeded = $postgresRolePasswordRepairSucceeded
  databaseUrlSyncedFromPostgresContainer = $containerPasswordSynced
  databaseUrlCredentialsUrlEncoded = $databaseUrlCredentialsUrlEncoded
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
