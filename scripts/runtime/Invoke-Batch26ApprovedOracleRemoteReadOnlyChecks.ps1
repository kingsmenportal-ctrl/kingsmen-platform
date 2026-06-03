param(
  [switch]$ApprovedReadOnly,
  [switch]$EnableLocalWrite
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$reportPath = Join-Path $root "reports\runtime\batch26-approved-oracle-remote-read-only-checks-report.json"

function Get-KingsmenEnvValue {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (-not $value) { $value = [Environment]::GetEnvironmentVariable($Name, "User") }
  return $value
}

$hostName = Get-KingsmenEnvValue "ORACLE_VM_HOST"
$userName = Get-KingsmenEnvValue "ORACLE_VM_USER"
$keyPath = Get-KingsmenEnvValue "ORACLE_SSH_KEY_PATH"
$remotePath = Get-KingsmenEnvValue "KINGSMEN_REMOTE_PATH"

$checks = @()

foreach ($name in @("ORACLE_VM_HOST","ORACLE_VM_USER","ORACLE_SSH_KEY_PATH","KINGSMEN_REMOTE_PATH")) {
  $value = Get-KingsmenEnvValue $name
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

if ($keyPath) {
  $checks += [ordered]@{
    name = "ssh_key_file_exists"
    passed = (Test-Path $keyPath)
    detail = if (Test-Path $keyPath) { "key path exists; value not printed" } else { "key path missing" }
  }
}

$checks += [ordered]@{
  name = "approved_read_only_flag_present"
  passed = [bool]$ApprovedReadOnly
  detail = if ($ApprovedReadOnly) { "ApprovedReadOnly flag present" } else { "ApprovedReadOnly flag missing; no SSH will run" }
}

$remoteResults = @()
$canRunRemote = $ApprovedReadOnly -and $hostName -and $userName -and $keyPath -and (Test-Path $keyPath) -and $remotePath -and $ssh

$readOnlyCommands = @(
  @{ name = "remote_hostname"; command = "hostname" },
  @{ name = "remote_docker_version"; command = "docker --version" },
  @{ name = "remote_docker_compose_version"; command = "docker compose version" },
  @{ name = "remote_git_version"; command = "git --version" },
  @{ name = "remote_disk_space"; command = "df -h ." },
  @{ name = "remote_memory"; command = "free -m" },
  @{ name = "remote_target_path_exists"; command = "test -d '$remotePath' && echo TARGET_PATH_EXISTS || echo TARGET_PATH_MISSING" }
)

if ($canRunRemote) {
  foreach ($item in $readOnlyCommands) {
    $sshArgs = @(
      "-i", $keyPath,
      "-o", "BatchMode=yes",
      "-o", "ConnectTimeout=10",
      "-o", "StrictHostKeyChecking=accept-new",
      "$userName@$hostName",
      $item.command
    )

    $output = & ssh @sshArgs 2>&1
    $exitCode = $LASTEXITCODE

    $remoteResults += [ordered]@{
      name = $item.name
      passed = ($exitCode -eq 0)
      exitCode = $exitCode
      output_tail = (($output | Out-String).Trim() -split "`r?`n")[-8..-1] | Where-Object { $_ }
    }
  }
} else {
  $remoteResults += [ordered]@{
    name = "remote_checks_not_executed"
    passed = $true
    exitCode = 0
    output_tail = @("Remote checks skipped because approval/env/ssh readiness is incomplete.")
  }
}

$checks += [ordered]@{
  name = "no_write_or_deploy_commands_executed"
  passed = $true
  detail = "BATCH 26 runner permits only read-only SSH checks when approved. It does not SCP, deploy, migrate, start containers, or run OCI."
}

$failed = @($checks | Where-Object { -not $_.passed })
$remoteFailed = @($remoteResults | Where-Object { -not $_.passed })

$status = if ($canRunRemote -and $failed.Count -eq 0 -and $remoteFailed.Count -eq 0) {
  "APPROVED_REMOTE_READ_ONLY_CHECKS_PASSED"
} elseif (-not $ApprovedReadOnly) {
  "APPROVED_READ_ONLY_FLAG_REQUIRED"
} elseif ($failed.Count -gt 0 -or $remoteFailed.Count -gt 0) {
  "APPROVED_REMOTE_READ_ONLY_CHECKS_INCOMPLETE"
} else {
  "REMOTE_READ_ONLY_CHECKS_SKIPPED"
}

$report = [ordered]@{
  schema = "kingsmen.batch26.approved-oracle-remote-read-only-checks-report.v1"
  module = "BATCH 26 - Approved Oracle Remote Read-Only Checks"
  status = $status
  passed = ($status -eq "APPROVED_REMOTE_READ_ONLY_CHECKS_PASSED")
  productionReady = $false
  canClaimProduction = $false
  deployedToOracle = $false
  runsOracleCommands = $false
  runsRemoteCommands = [bool]$canRunRemote
  copiesFilesToOracle = $false
  startsContainers = $false
  approvedReadOnly = [bool]$ApprovedReadOnly
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  checks = $checks
  remoteResults = $remoteResults
  failed = $failed + $remoteFailed
  next_action = "Use this read-only report before any later approved remote copy or Docker dry-run batch."
}

if ($EnableLocalWrite) {
  New-Item -ItemType Directory -Force -Path (Split-Path $reportPath) | Out-Null
  $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
}

$report | ConvertTo-Json -Depth 10
