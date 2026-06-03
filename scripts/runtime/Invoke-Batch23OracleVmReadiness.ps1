param(
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$reportPath = Join-Path $root "reports\runtime\batch23-oracle-vm-readiness-check-latest.json"

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
    name = "env_present_$name"
    passed = [bool]$value
    detail = if ($value) { "present_not_printed" } else { "missing" }
  }
}

$ssh = Get-Command ssh -ErrorAction SilentlyContinue
$checks += [ordered]@{
  name = "ssh_command_available"
  passed = [bool]$ssh
  detail = if ($ssh) { "ssh available" } else { "ssh missing" }
}

$checks += [ordered]@{
  name = "no_remote_commands_executed"
  passed = $true
  detail = "BATCH 23 readiness runner does not SSH, SCP, OCI launch, deploy, migrate, or start production."
}

$failed = @($checks | Where-Object { -not $_.passed })

$report = [ordered]@{
  schema = "kingsmen.batch23.oracle-vm-readiness-check.v1"
  module = "BATCH 23 - Oracle VM Environment Checklist / Remote Handoff Runner"
  status = if ($failed.Count -eq 0) { "ORACLE_VM_ENVIRONMENT_READY_LOCALLY" } else { "ORACLE_VM_ENVIRONMENT_INCOMPLETE" }
  passed = ($failed.Count -eq 0)
  productionReady = $false
  canClaimProduction = $false
  deployedToOracle = $false
  runsOracleCommands = $false
  runsRemoteCommands = $false
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  checks = $checks
  failed = $failed
  next_action = "Use this readiness report for a later approved remote dry-run batch."
}

if ($EnableLocalWrite) {
  New-Item -ItemType Directory -Force -Path (Split-Path $reportPath) | Out-Null
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
}

$report | ConvertTo-Json -Depth 10
