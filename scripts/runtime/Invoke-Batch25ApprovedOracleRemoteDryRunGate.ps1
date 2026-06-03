param(
  [switch]$ApprovedDryRun,
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$reportPath = Join-Path $root "reports\runtime\batch25-approved-oracle-remote-dry-run-report.json"

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
  name = "ssh_client_available_locally"
  passed = [bool]$ssh
  detail = if ($ssh) { "ssh client found" } else { "ssh client missing" }
}

$checks += [ordered]@{
  name = "approved_dry_run_flag_present"
  passed = [bool]$ApprovedDryRun
  detail = if ($ApprovedDryRun) { "ApprovedDryRun flag present" } else { "ApprovedDryRun flag missing; no remote command allowed" }
}

$checks += [ordered]@{
  name = "no_remote_commands_executed_in_batch25"
  passed = $true
  detail = "BATCH 25 creates/validates the approval gate only. It does not execute SSH, SCP, OCI, deploy, migrate, or production commands."
}

$failed = @($checks | Where-Object { -not $_.passed })

$status = if ($ApprovedDryRun -and $failed.Count -eq 0) {
  "APPROVED_REMOTE_DRY_RUN_GATE_READY"
} elseif (-not $ApprovedDryRun) {
  "APPROVAL_FLAG_REQUIRED"
} else {
  "REMOTE_DRY_RUN_GATE_INCOMPLETE"
}

$report = [ordered]@{
  schema = "kingsmen.batch25.approved-oracle-remote-dry-run-report.v1"
  module = "BATCH 25 - Approved Oracle Remote Dry-Run Execution Gate"
  status = $status
  passed = ($ApprovedDryRun -and $failed.Count -eq 0)
  productionReady = $false
  canClaimProduction = $false
  deployedToOracle = $false
  runsOracleCommands = $false
  runsRemoteCommands = $false
  copiesFilesToOracle = $false
  approvedDryRun = [bool]$ApprovedDryRun
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  checks = $checks
  failed = $failed
  next_action = "Use this gate before BATCH 26 approved remote read-only checks."
}

if ($EnableLocalWrite) {
  New-Item -ItemType Directory -Force -Path (Split-Path $reportPath) | Out-Null
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
}

$report | ConvertTo-Json -Depth 10
