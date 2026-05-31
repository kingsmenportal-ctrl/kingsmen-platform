#requires -Version 5.1
<#
ORACLE.5 - Test-OracleFreePrerequisites.ps1
Tests local prerequisites before Kingsmen proceeds toward Oracle Free / Oracle Lite VM bootstrap.
This script does not create cloud resources, does not store credentials, and does not deploy production.
Writes reports/oracle/oracle-free-prerequisites-report.json.
#>
[CmdletBinding()]
param(
  [string]$Root = '',
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-KingsmenRoot {
  param([string]$ProvidedRoot)
  if (-not [string]::IsNullOrWhiteSpace($ProvidedRoot)) {
    $resolved = Resolve-Path -Path $ProvidedRoot -ErrorAction SilentlyContinue
    if ($resolved) { return $resolved.Path }
  }
  $current = Get-Location
  while ($null -ne $current) {
    if (Test-Path (Join-Path $current.Path '.git') -PathType Container) { return $current.Path }
    if (Test-Path (Join-Path $current.Path 'package.json')) { return $current.Path }
    $parent = Split-Path -Parent $current.Path
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current.Path) { break }
    $current = Get-Item $parent
  }
  return (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
}

$script:RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
Set-Location $script:RepoRoot
$script:Checks = @()
$script:Warnings = @()
$script:Facts = @()
$script:GeneratedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$script:ReportDir = Join-Path $script:RepoRoot 'reports/oracle'
$script:ReportPath = Join-Path $script:ReportDir 'oracle-free-prerequisites-report.json'

function Add-KmCheck {
  param([string]$Name, [object]$Passed, [string]$Detail = '', [string]$Path = '', [string]$Severity = 'hard')
  $safePassed = $false
  try { $safePassed = [System.Convert]::ToBoolean($Passed) } catch { $safePassed = $false }
  $entry = [pscustomobject]@{ name = $Name; passed = $safePassed; detail = $Detail; path = $Path; severity = $Severity }
  $script:Checks += $entry
  if (($safePassed -ne $true) -and ($Severity -ne 'hard')) { $script:Warnings += $entry }
}

function Add-KmFact {
  param([string]$Name, [string]$Detail = '', [string]$Path = '')
  $script:Facts += [pscustomobject]@{ name = $Name; detail = $Detail; path = $Path }
}

function Test-KmRequiredFile {
  param([string]$RelativePath, [string]$Label)
  $full = Join-Path $script:RepoRoot $RelativePath
  $ok = Test-Path $full -PathType Leaf
  Add-KmCheck -Name ('required-file:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { 'found' } else { 'missing' }) -Path $RelativePath -Severity 'hard'
}

function Read-KmJson {
  param([string]$RelativePath)
  $full = Join-Path $script:RepoRoot $RelativePath
  if (-not (Test-Path $full -PathType Leaf)) { return $null }
  try {
    $raw = Get-Content -Path $full -Raw
    $raw = $raw.TrimStart([char]0xFEFF)
    return ($raw | ConvertFrom-Json)
  } catch { return $null }
}

function Test-KmReportPassed {
  param([string]$RelativePath, [string]$Label)
  $json = Read-KmJson -RelativePath $RelativePath
  $parsed = $null -ne $json
  Add-KmCheck -Name ('report:{0}:json' -f $Label) -Passed $parsed -Detail $(if ($parsed) { 'parsed' } else { 'missing or invalid json' }) -Path $RelativePath -Severity 'hard'
  if (-not $parsed) { return }
  Add-KmCheck -Name ('report:{0}:passed' -f $Label) -Passed ($json.passed -eq $true) -Detail ('passed={0}' -f $json.passed) -Path $RelativePath -Severity 'hard'
  Add-KmCheck -Name ('report:{0}:failedChecksZero' -f $Label) -Passed ([int]$json.failedChecks -eq 0) -Detail ('failedChecks={0}' -f $json.failedChecks) -Path $RelativePath -Severity 'hard'
  Add-KmCheck -Name ('report:{0}:productionReadyFalse' -f $Label) -Passed ($json.productionReady -eq $false) -Detail ('productionReady={0}' -f $json.productionReady) -Path $RelativePath -Severity 'hard'
}

function Test-KmCommandAvailable {
  param([string]$Command, [string]$Label, [string]$Severity = 'hard')
  $cmd = Get-Command $Command -ErrorAction SilentlyContinue
  $ok = $null -ne $cmd
  Add-KmCheck -Name ('command:{0}' -f $Label) -Passed $ok -Detail $(if ($ok) { $cmd.Source } else { 'not found' }) -Path $Command -Severity $Severity
  return $ok
}

function Invoke-KmVersionCommand {
  param([string]$Label, [string]$Executable, [string[]]$Arguments, [string]$Severity = 'warning')
  $available = Test-KmCommandAvailable -Command $Executable -Label $Label -Severity $Severity
  if (-not $available) { return }
  try {
    $raw = & $Executable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output = ($raw | Out-String).Trim()
    $ok = ($exitCode -eq 0) -or [string]::IsNullOrWhiteSpace([string]$exitCode)
    Add-KmCheck -Name ('version:{0}' -f $Label) -Passed $ok -Detail $output.Substring(0, [Math]::Min(500, $output.Length)) -Path $Executable -Severity $Severity
  } catch {
    Add-KmCheck -Name ('version:{0}' -f $Label) -Passed $false -Detail $_.Exception.Message -Path $Executable -Severity $Severity
  }
}

function Test-KmEnvTemplateSafe {
  $relative = 'config/environment/.env.template'
  $full = Join-Path $script:RepoRoot $relative
  if (-not (Test-Path $full -PathType Leaf)) { return }
  $content = Get-Content -Path $full -Raw
  $required = @(
    'KINGSMEN_PRODUCTION_READY=false',
    'KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite',
    'KINGSMEN_ORACLE_LITE_MODE=true',
    'KINGSMEN_LOW_CONCURRENCY_MODE=true',
    'KINGSMEN_ACTIVE_CANDIDATE_CAP=500',
    'KINGSMEN_READY_CAP_TARGET=1000',
    'KINGSMEN_PREPARE_CAP_TARGET=5000',
    'PLAYWRIGHT_MAX_CONCURRENCY=1',
    'EMAIL_PROVIDER=no_send',
    'PAYMENT_PROVIDER=manual_eft_proof'
  )
  foreach ($token in $required) {
    Add-KmCheck -Name ('env-template:{0}' -f $token) -Passed ($content.Contains($token)) -Detail $(if ($content.Contains($token)) { 'present' } else { 'missing' }) -Path $relative -Severity 'hard'
  }
  $forbiddenValues = @('KINGSMEN_PRODUCTION_READY=true', 'SECRETS_IN_GIT_ALLOWED=true', 'SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=true')
  foreach ($token in $forbiddenValues) {
    Add-KmCheck -Name ('env-template:not:{0}' -f $token) -Passed (-not $content.Contains($token)) -Detail $(if ($content.Contains($token)) { 'forbidden value present' } else { 'not present' }) -Path $relative -Severity 'hard'
  }
}

function Test-KmGitCleanEnough {
  $gitAvailable = Get-Command git -ErrorAction SilentlyContinue
  if (-not $gitAvailable) { return }
  try {
    $status = (& git status --short 2>$null | Out-String).Trim()
    Add-KmFact -Name 'git:status-short' -Detail $(if ([string]::IsNullOrWhiteSpace($status)) { 'clean' } else { $status })
    Add-KmCheck -Name 'git:repository-readable' -Passed $true -Detail 'git status completed' -Severity 'hard'
  } catch {
    Add-KmCheck -Name 'git:repository-readable' -Passed $false -Detail $_.Exception.Message -Severity 'hard'
  }
  try {
    $hash = (& git rev-parse --short HEAD 2>$null | Out-String).Trim()
    Add-KmCheck -Name 'git:head-hash' -Passed (-not [string]::IsNullOrWhiteSpace($hash)) -Detail $hash -Severity 'hard'
  } catch {
    Add-KmCheck -Name 'git:head-hash' -Passed $false -Detail $_.Exception.Message -Severity 'hard'
  }
}

try {
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/oracle-free-bootstrap-plan.json' -Label 'oracle-plan'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-bootstrap-report.json' -Label 'oracle-bootstrap-report'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-free-workspace-report.json' -Label 'oracle-workspace-report'
  Test-KmRequiredFile -RelativePath 'reports/oracle/oracle-workspace-validation-report.json' -Label 'oracle-workspace-validation-report'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/workspace/oracle-workspace-config.json' -Label 'oracle-workspace-config'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/checklists/founder-oracle-free-checklist.json' -Label 'founder-checklist'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/cost-guard/oracle-cost-guard.json' -Label 'cost-guard'
  Test-KmRequiredFile -RelativePath 'kingsmen/oracle/security/oracle-security-checklist.json' -Label 'security-checklist'
  Test-KmRequiredFile -RelativePath 'reports/openclaw/openclaw-safety-report.json' -Label 'openclaw-safety-report'
  Test-KmRequiredFile -RelativePath 'config/environment/.env.template' -Label 'env-template'
  Test-KmRequiredFile -RelativePath 'config/providers/provider-registry.json' -Label 'provider-registry'

  Test-KmReportPassed -RelativePath 'reports/oracle/oracle-free-bootstrap-report.json' -Label 'oracle-bootstrap'
  Test-KmReportPassed -RelativePath 'reports/oracle/oracle-free-workspace-report.json' -Label 'oracle-workspace'
  Test-KmReportPassed -RelativePath 'reports/oracle/oracle-workspace-validation-report.json' -Label 'oracle-workspace-validation'
  Test-KmReportPassed -RelativePath 'reports/openclaw/openclaw-safety-report.json' -Label 'openclaw-safety'

  Test-KmEnvTemplateSafe

  Invoke-KmVersionCommand -Label 'git' -Executable 'git' -Arguments @('--version') -Severity 'hard'
  Invoke-KmVersionCommand -Label 'node' -Executable 'node' -Arguments @('--version') -Severity 'hard'
  Invoke-KmVersionCommand -Label 'npm' -Executable 'npm' -Arguments @('--version') -Severity 'warning'
  Invoke-KmVersionCommand -Label 'docker' -Executable 'docker' -Arguments @('--version') -Severity 'warning'
  Invoke-KmVersionCommand -Label 'oci' -Executable 'oci' -Arguments @('--version') -Severity 'warning'
  Invoke-KmVersionCommand -Label 'ssh' -Executable 'ssh' -Arguments @('-V') -Severity 'warning'

  Add-KmCheck -Name 'powershell:version-5-1-plus' -Passed ($PSVersionTable.PSVersion.Major -ge 5) -Detail ($PSVersionTable.PSVersion.ToString()) -Severity 'hard'
  Add-KmCheck -Name 'oracle:cloud-resources-created' -Passed $true -Detail 'none created by this script' -Severity 'hard'
  Add-KmCheck -Name 'oracle:credentials-stored' -Passed $true -Detail 'none stored by this script' -Severity 'hard'
  Add-KmCheck -Name 'oracle:production-deployed' -Passed $true -Detail 'not deployed by this script' -Severity 'hard'
  Add-KmCheck -Name 'oracle:paid-resource-change' -Passed $true -Detail 'no paid resource change by this script' -Severity 'hard'

  Test-KmGitCleanEnough

  $hardFailures = @($script:Checks | Where-Object { ($_.passed -ne $true) -and ($_.severity -eq 'hard') })
  $allFailures = @($script:Checks | Where-Object { $_.passed -ne $true })
  $passed = ($hardFailures.Count -eq 0)

  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.5'
    script = 'scripts/oracle/Test-OracleFreePrerequisites.ps1'
    productionReady = $false
    generatedAt = $script:GeneratedAt
    repoRoot = $script:RepoRoot
    dryRun = [bool]$DryRun
    passed = $passed
    totalChecks = @($script:Checks).Count
    failedChecks = @($hardFailures).Count
    warningChecks = @($script:Warnings).Count
    allFailedOrWarnings = @($allFailures)
    failed = @($hardFailures)
    warnings = @($script:Warnings)
    facts = @($script:Facts)
    checks = @($script:Checks)
    nextTrackerRow = $(if ($passed) { 'ORACLE.6 - scripts/validators/validate-oracle-prerequisites.mjs' } else { 'ORACLE.5 repair - fix hard failures in reports/oracle/oracle-free-prerequisites-report.json' })
  }

  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report | ConvertTo-Json -Depth 24 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 24
  if ($passed) { exit 0 }
  exit 1
} catch {
  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null
  $report = [ordered]@{
    module = 'ORACLE'
    submodule = 'ORACLE.5'
    script = 'scripts/oracle/Test-OracleFreePrerequisites.ps1'
    productionReady = $false
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    passed = $false
    totalChecks = 1
    failedChecks = 1
    failed = @([pscustomobject]@{ name = 'oracle-prerequisites:unhandled-error'; passed = $false; detail = $_.Exception.Message; path = 'scripts/oracle/Test-OracleFreePrerequisites.ps1'; severity = 'hard' })
    nextTrackerRow = 'ORACLE.5 repair - script crashed'
  }
  $report | ConvertTo-Json -Depth 12 | Set-Content -Path $script:ReportPath -Encoding UTF8
  $report | ConvertTo-Json -Depth 12
  exit 1
}
