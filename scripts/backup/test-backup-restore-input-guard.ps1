#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$restoreScript = Join-Path $PSScriptRoot "Test-KingsmenTruthVaultRestore.ps1"
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("kingsmen-restore-input-guard-" + [guid]::NewGuid().ToString("N"))
$mockBin = Join-Path $tempRoot "mock-bin"
$markerPath = Join-Path $tempRoot "database-command-invoked.txt"
New-Item -ItemType Directory -Force -Path $mockBin | Out-Null

$psqlMock = @"
@echo off
echo psql>>"%KINGSMEN_BACKUP_INPUT_GUARD_MARKER%"
exit /b 91
"@
$pgRestoreMock = @"
@echo off
echo pg_restore>>"%KINGSMEN_BACKUP_INPUT_GUARD_MARKER%"
exit /b 92
"@
Set-Content -LiteralPath (Join-Path $mockBin "psql.cmd") -Value $psqlMock -Encoding ascii
Set-Content -LiteralPath (Join-Path $mockBin "pg_restore.cmd") -Value $pgRestoreMock -Encoding ascii

$originalPath = $env:PATH
$pwshPath = (Get-Command pwsh -ErrorAction Stop).Source
try {
  $env:PATH = $mockBin + ";" + $originalPath
  $env:KINGSMEN_BACKUP_INPUT_GUARD_MARKER = $markerPath
  $extensions = @(".dump", ".sql", ".legacy", ".txt", ".backup", ".DUMP")
  foreach ($extension in $extensions) {
    $archivePath = Join-Path $tempRoot ("plaintext-archive" + $extension)
    $outputPath = Join-Path $tempRoot ("restore-output" + $extension + ".txt")
    $errorPath = Join-Path $tempRoot ("restore-error" + $extension + ".txt")
    Set-Content -LiteralPath $archivePath -Value "not an encrypted Kingsmen archive" -Encoding ascii
    if (Test-Path $markerPath) { Remove-Item -LiteralPath $markerPath -Force }

    $command = "& '" + $restoreScript.Replace("'", "''") + "' -BackupFile '" + $archivePath.Replace("'", "''") + "' -SourceDatabaseUrl 'postgresql://source.example.invalid:5432/source_db' -RestoreDatabaseUrl 'postgresql://restore.example.invalid:5432/restore_db' -DryRun"
    $process = Start-Process -FilePath $pwshPath -ArgumentList @("-NoProfile", "-Command", $command) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $outputPath -RedirectStandardError $errorPath
    $combinedOutput = ""
    if (Test-Path $outputPath) { $combinedOutput += Get-Content -LiteralPath $outputPath -Raw }
    if (Test-Path $errorPath) { $combinedOutput += Get-Content -LiteralPath $errorPath -Raw }

    if ($process.ExitCode -eq 0) {
      throw "Plaintext/unknown archive extension $extension was not rejected."
    }
    if ($combinedOutput -notmatch "Unsupported backup format") {
      throw "The restore process for $extension did not report the encrypted-archive format guard. Exit=$($process.ExitCode); output=$combinedOutput"
    }
    if (Test-Path $markerPath) {
      throw "A database command was invoked before rejecting $extension."
    }
    Write-Host "PASS rejected $extension before psql/pg_restore invocation or database access"
  }

  Write-Host "PASS plaintext and unknown archive formats fail closed before any restore-target connection."
} finally {
  $env:PATH = $originalPath
  Remove-Item Env:\KINGSMEN_BACKUP_INPUT_GUARD_MARKER -ErrorAction SilentlyContinue
  if (Test-Path $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
