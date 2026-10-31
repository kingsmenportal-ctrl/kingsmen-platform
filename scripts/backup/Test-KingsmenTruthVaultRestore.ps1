#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [Parameter(Mandatory=$true)][string]$RestoreDatabaseUrl,
  [Parameter(Mandatory=$true)][string]$SourceDatabaseUrl,
  [Parameter(Mandatory=$true)][string]$ConfirmRestoreDatabaseName,
  [string]$AgeIdentityFile = $env:KINGSMEN_BACKUP_AGE_IDENTITY_FILE,
  [string]$ReportPath = "reports/ops/backup-restore-staging-drill-latest.json",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Get-PostgresConfig {
  param([Parameter(Mandatory=$true)][string]$ConnectionString)
  try { $uri = [System.Uri]::new($ConnectionString) } catch { throw "DATABASE_URL_MUST_BE_A_VALID_POSTGRES_URI" }
  if (-not $uri.IsAbsoluteUri -or $uri.Scheme -notin @("postgres", "postgresql") -or [string]::IsNullOrWhiteSpace($uri.Host)) {
    throw "DATABASE_URL_MUST_BE_A_VALID_POSTGRES_URI"
  }
  $databaseName = [System.Uri]::UnescapeDataString($uri.AbsolutePath.Trim("/").Split("/")[0])
  if ([string]::IsNullOrWhiteSpace($databaseName)) { throw "DATABASE_NAME_MISSING_FROM_CONNECTION_URI" }
  $userInfo = [System.Uri]::UnescapeDataString($uri.UserInfo)
  $separator = $userInfo.IndexOf(":")
  if ($separator -lt 1) { throw "DATABASE_CREDENTIALS_MISSING_FROM_CONNECTION_URI" }
  $username = $userInfo.Substring(0, $separator)
  $password = $userInfo.Substring($separator + 1)
  $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
  $sslMode = "require"
  if ($uri.Query -match "(?:^|[?&])sslmode=([^&]+)") { $sslMode = [System.Uri]::UnescapeDataString($Matches[1]) }
  return [pscustomobject]@{
    Host = $uri.DnsSafeHost
    Port = $port
    Database = $databaseName
    Username = $username
    Password = $password
    SslMode = $sslMode
    Identity = "$($uri.DnsSafeHost.ToLowerInvariant())|$port|$($databaseName.ToLowerInvariant())"
  }
}

function Invoke-Psql {
  param([Parameter(Mandatory=$true)]$Config, [Parameter(Mandatory=$true)][string]$Query)
  $oldPassword = $env:PGPASSWORD
  $oldSslMode = $env:PGSSLMODE
  try {
    $env:PGPASSWORD = $Config.Password
    $env:PGSSLMODE = $Config.SslMode
    $output = & $script:PsqlPath "--no-psqlrc" "--set=ON_ERROR_STOP=1" "--host=$($Config.Host)" "--port=$($Config.Port)" "--username=$($Config.Username)" "--dbname=$($Config.Database)" "--tuples-only" "--no-align" "--command=$Query" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "PSQL_QUERY_FAILED" }
    return $output
  } finally {
    $env:PGPASSWORD = $oldPassword
    $env:PGSSLMODE = $oldSslMode
  }
}

function Invoke-PgRestore {
  param([Parameter(Mandatory=$true)]$Config, [Parameter(Mandatory=$true)][string]$Archive)
  $oldPassword = $env:PGPASSWORD
  $oldSslMode = $env:PGSSLMODE
  try {
    $env:PGPASSWORD = $Config.Password
    $env:PGSSLMODE = $Config.SslMode
    & $script:PgRestorePath "--exit-on-error" "--single-transaction" "--no-owner" "--no-privileges" "--host=$($Config.Host)" "--port=$($Config.Port)" "--username=$($Config.Username)" "--dbname=$($Config.Database)" $Archive 2>$null
    if ($LASTEXITCODE -ne 0) { throw "PG_RESTORE_FAILED" }
  } finally {
    $env:PGPASSWORD = $oldPassword
    $env:PGSSLMODE = $oldSslMode
  }
}

function Get-TableCount {
  param([Parameter(Mandatory=$true)]$Config, [Parameter(Mandatory=$true)][string]$Table)
  if ($Table -notmatch "^[a-z_][a-z0-9_]*$") { throw "INVALID_COUNT_TABLE_NAME" }
  $query = "SELECT count(*)::bigint FROM public.$Table;"
  $value = Invoke-Psql -Config $Config -Query $query
  $text = ([string]($value | Select-Object -First 1)).Trim()
  if ($text -notmatch "^\d+$") { throw "COUNT_RESULT_INVALID:$Table" }
  return [Int64]$text
}

if (-not (Test-Path $BackupFile) -or [IO.Path]::GetExtension($BackupFile) -ne ".age") {
  throw "An existing age-encrypted .age backup archive is required."
}
if ([string]::IsNullOrWhiteSpace($AgeIdentityFile) -or -not (Test-Path $AgeIdentityFile)) {
  throw "KINGSMEN_BACKUP_AGE_IDENTITY_FILE must point to the private age identity stored outside Git."
}

$sourceConfig = Get-PostgresConfig -ConnectionString $SourceDatabaseUrl
$restoreConfig = Get-PostgresConfig -ConnectionString $RestoreDatabaseUrl
if ($sourceConfig.Identity -eq $restoreConfig.Identity) {
  throw "Restore target matches source database. Restore drill blocked."
}
if (-not [string]::Equals($ConfirmRestoreDatabaseName, $restoreConfig.Database, [StringComparison]::OrdinalIgnoreCase)) {
  throw "ConfirmRestoreDatabaseName must exactly match the isolated target database name."
}

$age = Get-Command "age" -ErrorAction SilentlyContinue
$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue
$psql = Get-Command "psql" -ErrorAction SilentlyContinue
if (-not $age) { throw "age is required to decrypt the backup." }
if (-not $pgRestore) { throw "pg_restore is required for the restore drill." }
if (-not $psql) { throw "psql is required for count-only parity checks." }

$script:PsqlPath = $psql.Source
$script:PgRestorePath = $pgRestore.Source
$coreTables = @(
  "candidates", "candidate_applications", "candidate_application_events",
  "candidate_identity_review_requests", "candidate_private_documents",
  "finance_orders", "finance_payments", "opportunity_source_authorities",
  "opportunity_providers", "opportunity_programmes"
)

$startedAt = Get-Date
$plainDump = Join-Path ([IO.Path]::GetTempPath()) ("kingsmen-restore-" + [Guid]::NewGuid().ToString("N") + ".dump")
$sourceCounts = @{}
$restoreCounts = @{}
$tableChecks = @()
$exceptionCode = ""
$targetWasEmpty = $false
$sha256 = (Get-FileHash -Algorithm SHA256 -Path $BackupFile).Hash

try {
  if (-not $DryRun) {
    $existingObjects = Invoke-Psql -Config $restoreConfig -Query "SELECT count(*)::bigint FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f');"
    $existingCountText = ([string]($existingObjects | Select-Object -First 1)).Trim()
    if ($existingCountText -notmatch "^\d+$" -or [Int64]$existingCountText -gt 0) {
      throw "RESTORE_TARGET_MUST_BE_AN_EMPTY_ISOLATED_DATABASE"
    }
    $targetWasEmpty = $true
    foreach ($table in $coreTables) {
      $sourceCounts[$table] = Get-TableCount -Config $sourceConfig -Table $table
    }
    & $age.Source "-d" "-i" $AgeIdentityFile "-o" $plainDump $BackupFile 2>$null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $plainDump) -or (Get-Item $plainDump).Length -le 0) {
      throw "AGE_DECRYPTION_FAILED"
    }
    Invoke-PgRestore -Config $restoreConfig -Archive $plainDump
    foreach ($table in $coreTables) {
      try {
        $restoreCounts[$table] = Get-TableCount -Config $restoreConfig -Table $table
        $matches = $sourceCounts[$table] -eq $restoreCounts[$table]
        $tableChecks += [ordered]@{ table = $table; countOnly = $true; sourceCount = $sourceCounts[$table]; restoreCount = $restoreCounts[$table]; passed = [bool]$matches }
      } catch {
        $restoreCounts[$table] = $null
        $tableChecks += [ordered]@{ table = $table; countOnly = $true; sourceCount = $sourceCounts[$table]; restoreCount = "QUERY_FAILED"; passed = $false }
      }
    }
  }
} catch {
  $exceptionCode = ([string]$_.Exception.Message)
  if ($exceptionCode.Length -gt 120) { $exceptionCode = $exceptionCode.Substring(0, 120) }
} finally {
  if (Test-Path $plainDump) { Remove-Item -Force -ErrorAction SilentlyContinue $plainDump }
}

$endedAt = Get-Date
$rtoSeconds = [int]($endedAt - $startedAt).TotalSeconds
$decryptedTemporaryRemoved = -not (Test-Path $plainDump)
$allPassed = (-not $DryRun) -and [string]::IsNullOrWhiteSpace($exceptionCode) -and
  $targetWasEmpty -and ($tableChecks.Count -eq $coreTables.Count) -and
  (-not ($tableChecks | Where-Object { $_.passed -ne $true })) -and $decryptedTemporaryRemoved

$report = [ordered]@{
  schema = "kingsmen.backup-restore-staging-drill.v2"
  module = "Kingsmen Encrypted Database Restore Drill"
  status = $(if ($DryRun) { "DRY_RUN" } elseif ($allPassed) { "DATABASE_RESTORE_PARITY_PASSED" } else { "DATABASE_RESTORE_PARITY_FAILED" })
  passed = [bool]$allPassed
  productionReady = $false
  publicLaunchAllowed = $false
  productionDataAllowed = $false
  generatedAtIso = $endedAt.ToUniversalTime().ToString("o")
  backupFile = Split-Path -Leaf $BackupFile
  backupSha256 = $sha256
  encryption = "age"
  encryptedAtRest = $true
  decryptedTemporaryRemoved = [bool]$decryptedTemporaryRemoved
  databaseUrlRedacted = $true
  sourceAndRestoreTargetsDiffer = $true
  restoreTargetWasEmpty = [bool]$targetWasEmpty
  rawCandidateRowsReturned = $false
  serviceRoleReturned = $false
  privateStorageObjectsIncluded = $false
  storageObjectParityVerified = $false
  storageParityRequired = $true
  rpoMinutes = "manual_capture_required"
  rtoSeconds = $rtoSeconds
  tableChecks = $tableChecks
  founderReviewRequired = $true
  exceptionCode = $exceptionCode
  nextAction = $(if ($allPassed) { "Database-only restore parity passed. Complete private Storage object backup/restore parity, record RPO/RTO, and obtain independent sign-off." } else { "Resolve the failed precheck, decrypt, restore or table-count parity check. Database restore proof remains incomplete." })
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $ReportPath
Write-Host "Encrypted database restore drill report written. Database URLs and identity material redacted."
Write-Host $ReportPath
$report | ConvertTo-Json -Depth 20
if (-not $allPassed) { exit 1 }
