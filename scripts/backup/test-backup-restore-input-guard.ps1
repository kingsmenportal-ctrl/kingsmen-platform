#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$restoreScript = Join-Path $PSScriptRoot "Test-KingsmenTruthVaultRestore.ps1"
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("kingsmen-restore-input-guard-" + [guid]::NewGuid().ToString("N"))
$markerPath = Join-Path $tempRoot "database-command-invoked.txt"
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

function global:psql {
  Add-Content -LiteralPath $env:KINGSMEN_BACKUP_INPUT_GUARD_MARKER -Value "psql"
  $global:LASTEXITCODE = 1
  return "mock psql must never be reached for a rejected archive format"
}
function global:pg_restore {
  Add-Content -LiteralPath $env:KINGSMEN_BACKUP_INPUT_GUARD_MARKER -Value "pg_restore"
  $global:LASTEXITCODE = 1
  return "mock pg_restore must never be reached for a rejected archive format"
}

try {
  $env:KINGSMEN_BACKUP_INPUT_GUARD_MARKER = $markerPath
  $extensions = @(".dump", ".sql", ".legacy", ".txt", ".backup", ".DUMP")
  foreach ($extension in $extensions) {
    $archivePath = Join-Path $tempRoot ("plaintext-archive" + $extension)
    Set-Content -LiteralPath $archivePath -Value "not an encrypted Kingsmen archive" -Encoding ascii

    $rejected = $false
    try {
      & $restoreScript -BackupFile $archivePath -SourceDatabaseUrl "postgresql://source.example.invalid:5432/source_db" -RestoreDatabaseUrl "postgresql://restore.example.invalid:5432/restore_db" -DryRun | Out-Null
    } catch {
      if ($_.Exception.Message -notlike "*Unsupported backup format*") {
        throw "Unexpected rejection for $extension; expected the encrypted-archive format guard. Actual: $($_.Exception.Message)"
      }
      $rejected = $true
    }

    if (-not $rejected) {
      throw "Plaintext/unknown archive extension $extension was not rejected."
    }
    if (Test-Path $markerPath) {
      throw "A database command was invoked before rejecting $extension."
    }
    Write-Host "PASS rejected $extension before psql/pg_restore command resolution or database access"
  }

  Write-Host "PASS plaintext and unknown archive formats fail closed before any restore-target connection."
} finally {
  Remove-Item Function:\psql -ErrorAction SilentlyContinue
  Remove-Item Function:\pg_restore -ErrorAction SilentlyContinue
  Remove-Item Env:\KINGSMEN_BACKUP_INPUT_GUARD_MARKER -ErrorAction SilentlyContinue
  if (Test-Path $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
