param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ContainerName = "kingsmen-truth-vault-local",
  [string]$Image = "postgres:16-alpine",
  [int]$Port = 55432,
  [string]$DatabaseName = "kingsmen_truth_vault",
  [string]$DatabaseUser = "kingsmen",
  [string]$Password,
  [switch]$SkipMigrations,
  [switch]$ForceRecreate
)

$ErrorActionPreference = "Stop"

function Write-FailureReport {
  param(
    [string]$Status,
    [string]$Reason,
    [string]$NextAction
  )

  $localReportPath = Join-Path $RepoRoot "reports/staging/local-truth-vault-postgres-latest.json"
  $localReportDir = Split-Path -Parent $localReportPath
  if (-not (Test-Path $localReportDir)) { New-Item -ItemType Directory -Force -Path $localReportDir | Out-Null }

  $failure = [ordered]@{
    schema = "kingsmen.local-truth-vault-postgres.v1"
    module = "Local Truth Vault PostgreSQL"
    status = $Status
    passed = $false
    productionReady = $false
    publicLaunchAllowed = $false
    localOnly = $true
    rawSecretsPrinted = $false
    databaseUrlPrinted = $false
    envFile = ".local/kingsmen.local-postgres.env"
    reason = $Reason
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    nextAction = $NextAction
  }

  $failure | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -Path $localReportPath
  Write-Output ($failure | ConvertTo-Json -Depth 8)
}

function Assert-CommandAvailable {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-FailureReport `
      -Status "DOCKER_CLI_NOT_FOUND" `
      -Reason "$Name is required but was not found in PATH." `
      -NextAction "Install Docker Desktop, reopen PowerShell, then rerun scripts/staging/Start-KingsmenLocalTruthVault.ps1."
    throw "$Name is required but was not found in PATH. Install Docker Desktop, reopen PowerShell, then rerun this script."
  }
}

function Assert-DockerDaemonRunning {
  try {
    & docker info --format "{{.ServerVersion}}" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "docker info exited with code $LASTEXITCODE" }
  } catch {
    Write-FailureReport `
      -Status "DOCKER_DAEMON_NOT_RUNNING" `
      -Reason "Docker CLI exists, but Docker Desktop daemon is not reachable. This usually means Docker Desktop is closed or still starting." `
      -NextAction "Start Docker Desktop. Wait until it says Docker is running. Then rerun scripts/staging/Start-KingsmenLocalTruthVault.ps1."
    throw "Docker Desktop daemon is not running. Start Docker Desktop, wait until it says Docker is running, then rerun this script."
  }
}

function ConvertTo-EnvLine {
  param([string]$Name, [string]$Value)
  return "$Name=$Value"
}

function Read-ExistingEnvValue {
  param([string]$Path, [string]$Name)
  if (-not (Test-Path $Path)) { return $null }
  $line = Get-Content -Path $Path | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -replace "^$Name=", "")
}

function Invoke-ContainerSqlScalar {
  param([string]$Name, [string]$User, [string]$Database, [string]$Sql)
  & docker exec $Name psql -U $User -d $Database -v ON_ERROR_STOP=1 -q -t -c $Sql | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Wait-PostgresReady {
  param([string]$Name, [string]$User, [string]$Database)
  $stableReadyCount = 0
  $lastFailure = "not_checked"

  for ($i = 0; $i -lt 90; $i++) {
    $inspectStatus = (& docker inspect -f "{{.State.Status}} {{.State.Health.Status}} {{.RestartCount}}" $Name 2>$null)
    if ($LASTEXITCODE -ne 0) { $lastFailure = "container_not_inspectable"; Start-Sleep -Seconds 2; continue }

    & docker exec $Name pg_isready -U $User -d $Database | Out-Null
    $pgReady = ($LASTEXITCODE -eq 0)

    $selectReady = $false
    if ($pgReady) {
      $selectReady = Invoke-ContainerSqlScalar -Name $Name -User $User -Database $Database -Sql "select 1"
    }

    if ($pgReady -and $selectReady) {
      $stableReadyCount += 1
      if ($stableReadyCount -ge 3) { return }
    } else {
      $stableReadyCount = 0
      $lastFailure = "pg_isready=$pgReady select_1=$selectReady inspect=$inspectStatus"
    }

    Start-Sleep -Seconds 2
  }

  throw "PostgreSQL container did not become stably ready in time. Last failure: $lastFailure"
}

function Invoke-ContainerPsqlFile {
  param([string]$Name, [string]$User, [string]$Database, [string]$SqlPath)
  $sql = Get-Content -Raw -Path $SqlPath
  $lastError = "not_attempted"

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    Wait-PostgresReady -Name $Name -User $User -Database $Database
    $sql | & docker exec -i $Name psql -U $User -d $Database -v ON_ERROR_STOP=1 | Out-Null
    if ($LASTEXITCODE -eq 0) { return }
    $lastError = "psql_exit_code_$LASTEXITCODE"
    Start-Sleep -Seconds (2 * $attempt)
  }

  throw "Migration failed after retries: $SqlPath ($lastError)"
}

Assert-CommandAvailable -Name "docker"
Assert-DockerDaemonRunning

$localDir = Join-Path $RepoRoot ".local"
if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Force -Path $localDir | Out-Null }
$envPath = Join-Path $localDir "kingsmen.local-postgres.env"
$reportPath = Join-Path $RepoRoot "reports/staging/local-truth-vault-postgres-latest.json"
$reportDir = Split-Path -Parent $reportPath
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Force -Path $reportDir | Out-Null }

if (-not $Password) {
  $existingPassword = Read-ExistingEnvValue -Path $envPath -Name "KINGSMEN_POSTGRES_PASSWORD"
  if ($existingPassword) { $Password = $existingPassword } else { $Password = [Guid]::NewGuid().ToString("N") }
}

$existing = (& docker ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}") -eq $ContainerName
if ($existing -and $ForceRecreate) {
  & docker rm -f $ContainerName | Out-Null
  $existing = $false
}

$volumeName = "kingsmen_truth_vault_local_pgdata"
& docker volume create $volumeName | Out-Null

if (-not $existing) {
  & docker run -d --name $ContainerName `
    -e POSTGRES_USER=$DatabaseUser `
    -e POSTGRES_PASSWORD=$Password `
    -e POSTGRES_DB=$DatabaseName `
    -p "$Port`:5432" `
    -v "$volumeName`:/var/lib/postgresql/data" `
    $Image | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to create PostgreSQL container." }
} else {
  & docker start $ContainerName | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to start PostgreSQL container." }
}

Wait-PostgresReady -Name $ContainerName -User $DatabaseUser -Database $DatabaseName

$migrationResults = @()
if (-not $SkipMigrations) {
  $migrationDir = Join-Path $RepoRoot "db/migrations"
  $migrations = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name
  foreach ($migration in $migrations) {
    try {
      Invoke-ContainerPsqlFile -Name $ContainerName -User $DatabaseUser -Database $DatabaseName -SqlPath $migration.FullName
      $migrationResults += [ordered]@{ name = $migration.Name; applied = $true; reason = "APPLIED" }
    } catch {
      $migrationResults += [ordered]@{ name = $migration.Name; applied = $false; reason = "FAILED_AFTER_RETRIES" }
      Write-FailureReport `
        -Status "LOCAL_TRUTH_VAULT_MIGRATION_FAILED" `
        -Reason "Migration failed after PostgreSQL readiness retries. Migration: $($migration.Name)." `
        -NextAction "Run docker logs $ContainerName --tail 80, then rerun scripts/staging/Start-KingsmenLocalTruthVault.cmd - or force reset with PowerShell: .\scripts\staging\Start-KingsmenLocalTruthVault.ps1 -ForceRecreate."
      throw
    }
  }
}

$databaseUrl = "postgresql://$DatabaseUser`:$Password@127.0.0.1:$Port/$DatabaseName"
$envLines = @(
  "# Kingsmen local PostgreSQL Truth Vault runtime env. Do not commit this file.",
  (ConvertTo-EnvLine -Name "KINGSMEN_TRUTH_VAULT_MODE" -Value "postgres"),
  (ConvertTo-EnvLine -Name "KINGSMEN_DATABASE_URL" -Value $databaseUrl),
  (ConvertTo-EnvLine -Name "KINGSMEN_BACKEND_BASE_URL" -Value "http://127.0.0.1:3001"),
  (ConvertTo-EnvLine -Name "KINGSMEN_API_PORT" -Value "3001"),
  (ConvertTo-EnvLine -Name "KINGSMEN_POSTGRES_CONTAINER" -Value $ContainerName),
  (ConvertTo-EnvLine -Name "KINGSMEN_POSTGRES_DATABASE" -Value $DatabaseName),
  (ConvertTo-EnvLine -Name "KINGSMEN_POSTGRES_USER" -Value $DatabaseUser),
  (ConvertTo-EnvLine -Name "KINGSMEN_POSTGRES_PASSWORD" -Value $Password),
  (ConvertTo-EnvLine -Name "KINGSMEN_POSTGRES_PORT" -Value ([string]$Port))
)
$envLines | Set-Content -Encoding UTF8 -Path $envPath

$selectOk = Invoke-ContainerSqlScalar -Name $ContainerName -User $DatabaseUser -Database $DatabaseName -Sql "select 1"

$report = [ordered]@{
  schema = "kingsmen.local-truth-vault-postgres.v1"
  module = "Local Truth Vault PostgreSQL"
  status = $(if ($selectOk) { "LOCAL_TRUTH_VAULT_POSTGRES_READY" } else { "LOCAL_TRUTH_VAULT_POSTGRES_FAILED" })
  passed = [bool]$selectOk
  productionReady = $false
  publicLaunchAllowed = $false
  localOnly = $true
  rawSecretsPrinted = $false
  databaseUrlPrinted = $false
  envFile = ".local/kingsmen.local-postgres.env"
  containerName = $ContainerName
  port = $Port
  databaseName = $DatabaseName
  databaseUser = $DatabaseUser
  migrationsAttempted = [int]$migrationResults.Count
  migrations = $migrationResults
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = "Load .local/kingsmen.local-postgres.env into your shell, start the API, then run the staging evidence capture with -RunDatabaseProbe."
}
$report | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -Path $reportPath

Write-Output ($report | ConvertTo-Json -Depth 12)
Write-Output "ENV_FILE=$envPath"
