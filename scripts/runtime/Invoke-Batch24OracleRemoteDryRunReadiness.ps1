param(
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$reportPath = Join-Path $root "reports\runtime\batch24-oracle-remote-dry-run-readiness-local-check.json"

$required = @(
  "ORACLE_VM_HOST",
  "ORACLE_VM_USER",
  "ORACLE_SSH_KEY_PATH",
  "KINGSMEN_REMOTE_PATH"
)

$checks = @()

foreach ($name in $required) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if (-not $value) { $value = [Environment]::GetEnvironmentVariable($name, "User") }

  $checks += [ordered]@{
    name = "env_name_available_$name"
    passed = [bool]$value
    detail = if ($value) { "present_not_printed" } else { "missing" }
  }
}

$ssh = Get-Command ssh -ErrorAction SilentlyContinue
$git = Get-Command git -ErrorAction SilentlyContinue
$docker = Get-Command docker -ErrorAction SilentlyContinue

$checks += [ordered]@{
  name = "ssh_client_available_locally"
  passed = [bool]$ssh
  detail = if ($ssh) { "ssh client found" } else { "ssh client missing" }
}

$checks += [ordered]@{
  name = "git_available_locally"
  passed = [bool]$git
  detail = if ($git) { "git found" } else { "git missing" }
}

$checks += [ordered]@{
  name = "docker_available_locally"
  passed = [bool]$docker
  detail = if ($docker) { "docker found" } else { "docker missing" }
}

$checks += [ordered]@{
  name = "no_remote_commands_executed"
  passed = $true
  detail = "BATCH 24 only checks local readiness names/tools. It does not execute SSH, SCP, OCI, deploy, migrate, or production commands."
}

$failed = @($checks | Where-Object { -not $_.passed })

$report = [ordered]@{
  schema = "kingsmen.batch24.oracle-remote-dry-run-local-check.v1"
  module = "BATCH 24 - Oracle Remote Dry-Run Readiness"
  status = if ($failed.Count -eq 0) { "REMOTE_DRY_RUN_LOCAL_REQUIREMENTS_PRESENT" } else { "REMOTE_DRY_RUN_LOCAL_REQUIREMENTS_INCOMPLETE" }
  passed = ($failed.Count -eq 0)
  productionReady = $false
  canClaimProduction = $false
  deployedToOracle = $false
  runsOracleCommands = $false
  runsRemoteCommands = $false
  copiesFilesToOracle = $false
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  checks = $checks
  failed = $failed
  next_action = "Use this local readiness report before any later approved remote dry-run execution batch."
}

if ($EnableLocalWrite) {
  New-Item -ItemType Directory -Force -Path (Split-Path $reportPath) | Out-Null
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
}

$report | ConvertTo-Json -Depth 10
