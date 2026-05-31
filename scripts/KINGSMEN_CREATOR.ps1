#requires -Version 5.1
<#
.SYNOPSIS
  Kingsmen CREATOR.1 — Phase-based audit, validation, and reporting framework.
.DESCRIPTION
  Supports: AuditExisting, Validate, N09.3Complete, Report, Doctor, Help.
  Generates structured JSON reports under reports/creator/ and reports/n09/.
.PARAMETER Phase
  Execution phase.
.PARAMETER Root
  Optional repo root override.
.PARAMETER FailOnMissingOptional
  Treat all missing optional files as blocking failures.
#>
param(
  [ValidateSet("AuditExisting","Validate","N09.3Complete","Report","Doctor","Help")]
  [string]$Phase = "Help",
  [string]$Root = "",
  [switch]$FailOnMissingOptional
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CreatorVersion = "0.1.1"
$ProductionReady = $false

function Resolve-KingsmenRoot {
  param([string]$ProvidedRoot)

  if (-not [string]::IsNullOrWhiteSpace($ProvidedRoot)) {
    $resolved = Resolve-Path -Path $ProvidedRoot -ErrorAction SilentlyContinue
    if ($resolved) { return $resolved.Path }
  }

  $current = Get-Location
  while ($null -ne $current) {
    $git = Join-Path $current.Path ".git"
    $pkg = Join-Path $current.Path "package.json"

    if (Test-Path $git -PathType Container) { return $current.Path }
    if (Test-Path $pkg) { return $current.Path }

    $parent = Split-Path -Parent $current.Path
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current.Path) { break }
    $current = Get-Item $parent
  }

  return (Get-Location).Path
}

$RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
if (-not (Test-Path (Join-Path $RepoRoot ".git") -PathType Container)) {
  Write-Warning "WARN: .git not found at resolved root: $RepoRoot"
}

$ReportsRoot = Join-Path $RepoRoot "reports"
$CreatorReportRoot = Join-Path $ReportsRoot "creator"
$N09ReportRoot = Join-Path $ReportsRoot "n09"

function New-KingsmenDirectory {
  param([Parameter(Mandatory)][string]$Path)
  if (-not (Test-Path $Path -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Get-KingsmenTimestamp {
  return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

function Get-KingsmenRelativePath {
  param([Parameter(Mandatory)][string]$Path)

  $full = [System.IO.Path]::GetFullPath($Path)
  $root = [System.IO.Path]::GetFullPath($RepoRoot)

  if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $full.Substring($root.Length).TrimStart('\', '/')
  }

  return $Path
}

function Get-KingsmenSha256 {
  param([Parameter(Mandatory)][string]$Path)
  if (-not (Test-Path $Path)) { return "" }
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
}

function Read-KingsmenText {
  param([Parameter(Mandatory)][string]$Path)
  if (-not (Test-Path $Path)) { return "" }
  return [System.IO.File]::ReadAllText($Path)
}

function Write-KingsmenJson {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][object]$Data
  )

  $dir = Split-Path -Parent $Path
  New-KingsmenDirectory -Path $dir
  $json = $Data | ConvertTo-Json -Depth 40
  [System.IO.File]::WriteAllText($Path, $json, [System.Text.Encoding]::UTF8)
}

function New-Check {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][bool]$Passed,
    [string]$Detail = "",
    [string]$Path = "",
    [string]$Severity = "required"
  )

  return [pscustomobject]@{
    name = $Name
    passed = $Passed
    detail = $Detail
    path = $Path
    severity = $Severity
  }
}

function Test-FileExists {
  param([Parameter(Mandatory)][string]$RelativePath)

  $full = Join-Path $RepoRoot $RelativePath
  $ok = Test-Path $full

  return New-Check `
    -Name "exists:$RelativePath" `
    -Passed $ok `
    -Detail $(if ($ok) { "found" } else { "missing" }) `
    -Path $RelativePath
}

function Test-FileContains {
  param(
    [Parameter(Mandatory)][string]$RelativePath,
    [Parameter(Mandatory)][string]$Token
  )

  $full = Join-Path $RepoRoot $RelativePath
  if (-not (Test-Path $full)) {
    return New-Check `
      -Name "contains:$RelativePath:$Token" `
      -Passed $false `
      -Detail "file missing" `
      -Path $RelativePath
  }

  $content = Read-KingsmenText -Path $full
  $passed = $content.IndexOf($Token, [System.StringComparison]::OrdinalIgnoreCase) -ge 0

  return New-Check `
    -Name "contains:$RelativePath:$Token" `
    -Passed $passed `
    -Detail $(if ($passed) { "found" } else { "missing" }) `
    -Path $RelativePath
}

function Test-ForbiddenContent {
  param([Parameter(Mandatory)][string]$RelativePath)

  $full = Join-Path $RepoRoot $RelativePath
  $checks = New-Object System.Collections.Generic.List[object]

  if (-not (Test-Path $full)) {
    $checks.Add((New-Check -Name "forbidden-scan:$RelativePath" -Passed $false -Detail "file missing" -Path $RelativePath))
    return $checks
  }

  $content = Read-KingsmenText -Path $full

  $rules = @(
    @{ Name = "productionReadyTrue"; Pattern = "productionReady\s*[:=]\s*true" },
    @{ Name = "productionReadyJsonTrue"; Pattern = '"productionReady"\s*:\s*true' },
    @{ Name = "productionReadySqlTrue"; Pattern = "production_ready\s*[:=]\s*true" },
    @{ Name = "todo"; Pattern = "\bTODO\b" },
    @{ Name = "fixme"; Pattern = "\bFIXME\b" },
    @{ Name = "hardcodedPasswordAssignment"; Pattern = "password\s*[:=]\s*['\""][^'\""]+" },
    @{ Name = "hardcodedTokenAssignment"; Pattern = "token\s*[:=]\s*['\""][^'\""]+" },
    @{ Name = "hardcodedApiKeyAssignment"; Pattern = "api[_-]?key\s*[:=]\s*['\""][^'\""]+" },
    @{ Name = "hardcodedSecretAssignment"; Pattern = "secret\s*[:=]\s*['\""][^'\""]+" },
    @{ Name = "serviceRoleLiteral"; Pattern = "service_role\s*[:=]\s*['\""][^'\""]+" }
  )

  foreach ($rule in $rules) {
    $matched = [regex]::IsMatch(
      $content,
      $rule.Pattern,
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $checks.Add((
      New-Check `
        -Name "forbidden:$RelativePath:$($rule.Name)" `
        -Passed (-not $matched) `
        -Detail $(if ($matched) { "forbidden content found" } else { "not found" }) `
        -Path $RelativePath
    ))
  }

  return $checks
}

function Get-TrackedN09_3Files {
  return @(
    "packages/db/src/n09-action-packet-bridge-policy.ts",
    "scripts/validators/validate-n09-3.mjs",
    "manifests/modules/N09.3-communications-contracts.json"
  )
}

function Get-N09_3Dependencies {
  return @(
    "packages/contracts/src/n09-index.ts",
    "packages/db/src/n09-channel-policy.ts",
    "packages/db/src/n09-message-safety-policy.ts"
  )
}

function Invoke-N09_3Validation {
  $checks = New-Object System.Collections.Generic.List[object]

  foreach ($file in Get-TrackedN09_3Files) {
    $checks.Add((Test-FileExists -RelativePath $file))
    foreach ($check in (Test-ForbiddenContent -RelativePath $file)) {
      $checks.Add($check)
    }
  }

  foreach ($dependency in Get-N09_3Dependencies) {
    $checks.Add((Test-FileExists -RelativePath $dependency))
  }

  $nodeAvailable = $false
  try {
    $nodeVersion = (& node --version 2>$null)
    $nodeAvailable = -not [string]::IsNullOrWhiteSpace($nodeVersion)
    $checks.Add((New-Check -Name "node:available" -Passed $nodeAvailable -Detail $nodeVersion))
  }
  catch {
    $checks.Add((New-Check -Name "node:available" -Passed $false -Detail $_.Exception.Message))
  }

  $validatorPath = Join-Path $RepoRoot "scripts/validators/validate-n09-3.mjs"
  $validatorExitCode = $null
  $validatorOutput = ""

  if ((Test-Path $validatorPath) -and $nodeAvailable) {
    Push-Location $RepoRoot
    try {
      $raw = & node "scripts/validators/validate-n09-3.mjs" 2>&1
      $validatorExitCode = $LASTEXITCODE
      $validatorOutput = $raw | Out-String

      $checks.Add((
        New-Check `
          -Name "validator:n09.3:exit-code" `
          -Passed ($validatorExitCode -eq 0) `
          -Detail "exitCode=$validatorExitCode"
      ))
    }
    finally {
      Pop-Location
    }
  }
  else {
    $checks.Add((
      New-Check `
        -Name "validator:n09.3:run" `
        -Passed $false `
        -Detail "validator missing or node unavailable"
    ))
  }

  $reportFile = Join-Path $RepoRoot "reports/n09/n09-3-validation-report.json"
  $reportExists = Test-Path $reportFile

  $checks.Add((
    New-Check `
      -Name "report:n09.3:exists" `
      -Passed $reportExists `
      -Detail $(if ($reportExists) { "found" } else { "missing" }) `
      -Path "reports/n09/n09-3-validation-report.json"
  ))

  if ($reportExists) {
    try {
      $reportJson = Get-Content $reportFile -Raw | ConvertFrom-Json
      $checks.Add((
        New-Check `
          -Name "report:n09.3:passed-true" `
          -Passed ($reportJson.passed -eq $true) `
          -Detail "passed=$($reportJson.passed)" `
          -Path "reports/n09/n09-3-validation-report.json"
      ))
    }
    catch {
      $checks.Add((
        New-Check `
          -Name "report:n09.3:json-parse" `
          -Passed $false `
          -Detail $_.Exception.Message `
          -Path "reports/n09/n09-3-validation-report.json"
      ))
    }
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })
  $passed = ($failed.Count -eq 0)

  $report = [pscustomobject]@{
    module = "CREATOR"
    submodule = "CREATOR.1"
    phase = "N09.3Complete"
    creatorVersion = $CreatorVersion
    productionReady = $ProductionReady
    generatedAt = Get-KingsmenTimestamp
    repoRoot = $RepoRoot
    passed = $passed
    validatorExitCode = $validatorExitCode
    validatorOutputPreview = $validatorOutput.Substring(0, [Math]::Min(2000, $validatorOutput.Length))
    totalChecks = $checks.Count
    failedChecks = $failed.Count
    failed = $failed
    checks = $checks
    nextTrackerRow = $(if ($passed) { "CREATOR.2 — scripts/testing/Test-KingsmenCreator.ps1" } else { "N09.3 repair — resolve failed report checks" })
  }

  $creatorReport = Join-Path $CreatorReportRoot "creator-n09-3-validation-bridge-report.json"
  Write-KingsmenJson -Path $creatorReport -Data $report

  return $report
}

function Invoke-AuditExisting {
  New-KingsmenDirectory -Path $CreatorReportRoot

  $trackedFiles = @(
    "scripts/KINGSMEN_CREATOR.ps1",
    "package.json",
    "supabase/migrations",
    "packages/contracts/src",
    "packages/db/src",
    "apps/api/src",
    "apps/web/src",
    "scripts/validators",
    "scripts/testing",
    "manifests/modules",
    "reports"
  )

  $checks = New-Object System.Collections.Generic.List[object]

  foreach ($pathItem in $trackedFiles) {
    $checks.Add((Test-FileExists -RelativePath $pathItem))
  }

  foreach ($file in Get-TrackedN09_3Files) {
    $checks.Add((Test-FileExists -RelativePath $file))
  }

  foreach ($dependency in Get-N09_3Dependencies) {
    $checks.Add((Test-FileExists -RelativePath $dependency))
  }

  $gitAvailable = $false
  $gitHash = ""

  try {
    $gitVersion = (& git --version 2>$null)
    $gitAvailable = -not [string]::IsNullOrWhiteSpace($gitVersion)
    $checks.Add((New-Check -Name "git:available" -Passed $gitAvailable -Detail $gitVersion))

    if ($gitAvailable) {
      Push-Location $RepoRoot
      try {
        $gitHash = (& git rev-parse --short HEAD 2>$null)
      }
      finally {
        Pop-Location
      }
    }
  }
  catch {
    $checks.Add((New-Check -Name "git:available" -Passed $false -Detail $_.Exception.Message))
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })
  $blockingFailed = @(
    $failed | Where-Object {
      $FailOnMissingOptional -or
      ($_.path -in @(
        "scripts/KINGSMEN_CREATOR.ps1",
        "packages/db/src/n09-action-packet-bridge-policy.ts",
        "scripts/validators/validate-n09-3.mjs",
        "manifests/modules/N09.3-communications-contracts.json"
      ))
    }
  )

  $report = [pscustomobject]@{
    module = "CREATOR"
    submodule = "CREATOR.1"
    phase = "AuditExisting"
    creatorVersion = $CreatorVersion
    productionReady = $ProductionReady
    generatedAt = Get-KingsmenTimestamp
    repoRoot = $RepoRoot
    gitHash = $gitHash
    passed = ($blockingFailed.Count -eq 0)
    totalChecks = $checks.Count
    failedChecks = $failed.Count
    blockingFailedChecks = $blockingFailed.Count
    failed = $failed
    blockingFailed = $blockingFailed
    checks = $checks
    nextTrackerRow = "CREATOR.2 — scripts/testing/Test-KingsmenCreator.ps1"
  }

  $reportPath = Join-Path $CreatorReportRoot "creator-audit-existing-report.json"
  Write-KingsmenJson -Path $reportPath -Data $report

  return $report
}

function Invoke-Doctor {
  New-KingsmenDirectory -Path $CreatorReportRoot
  New-KingsmenDirectory -Path $N09ReportRoot

  $checks = New-Object System.Collections.Generic.List[object]

  $requiredDirs = @(
    "scripts",
    "scripts/validators",
    "scripts/testing",
    "reports",
    "reports/creator",
    "reports/n09",
    "manifests/modules",
    "packages/contracts/src",
    "packages/db/src"
  )

  foreach ($dir in $requiredDirs) {
    $full = Join-Path $RepoRoot $dir
    New-KingsmenDirectory -Path $full
    $ok = Test-Path $full -PathType Container
    $checks.Add((
      New-Check `
        -Name "doctor:dir:$dir" `
        -Passed $ok `
        -Detail $(if ($ok) { "directory exists" } else { "directory missing" }) `
        -Path $dir
    ))
  }

  try {
    $nodeVersion = (& node --version 2>$null)
    $nodePassed = -not [string]::IsNullOrWhiteSpace($nodeVersion)
    $checks.Add((New-Check -Name "doctor:node" -Passed $nodePassed -Detail $nodeVersion))
  }
  catch {
    $checks.Add((New-Check -Name "doctor:node" -Passed $false -Detail $_.Exception.Message))
  }

  try {
    $gitVersion = (& git --version 2>$null)
    $gitPassed = -not [string]::IsNullOrWhiteSpace($gitVersion)
    $checks.Add((New-Check -Name "doctor:git" -Passed $gitPassed -Detail $gitVersion))
  }
  catch {
    $checks.Add((New-Check -Name "doctor:git" -Passed $false -Detail $_.Exception.Message))
  }

  $failed = @($checks | Where-Object { $_.passed -ne $true })

  $report = [pscustomobject]@{
    module = "CREATOR"
    submodule = "CREATOR.1"
    phase = "Doctor"
    creatorVersion = $CreatorVersion
    productionReady = $ProductionReady
    generatedAt = Get-KingsmenTimestamp
    repoRoot = $RepoRoot
    passed = ($failed.Count -eq 0)
    totalChecks = $checks.Count
    failedChecks = $failed.Count
    failed = $failed
    checks = $checks
    nextTrackerRow = "CREATOR.2 — scripts/testing/Test-KingsmenCreator.ps1"
  }

  $reportPath = Join-Path $CreatorReportRoot "creator-doctor-report.json"
  Write-KingsmenJson -Path $reportPath -Data $report

  return $report
}

function Invoke-Report {
  New-KingsmenDirectory -Path $CreatorReportRoot

  $files = Get-ChildItem -Path $ReportsRoot -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object FullName, Length, LastWriteTimeUtc |
    ForEach-Object {
      [pscustomobject]@{
        path = Get-KingsmenRelativePath -Path $_.FullName
        bytes = $_.Length
        lastWriteTimeUtc = $_.LastWriteTimeUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        sha256 = Get-KingsmenSha256 -Path $_.FullName
      }
    }

  $report = [pscustomobject]@{
    module = "CREATOR"
    submodule = "CREATOR.1"
    phase = "Report"
    creatorVersion = $CreatorVersion
    productionReady = $ProductionReady
    generatedAt = Get-KingsmenTimestamp
    repoRoot = $RepoRoot
    passed = $true
    reports = $files
    nextTrackerRow = "CREATOR.2 — scripts/testing/Test-KingsmenCreator.ps1"
  }

  $reportPath = Join-Path $CreatorReportRoot "creator-report-index.json"
  Write-KingsmenJson -Path $reportPath -Data $report

  return $report
}

function Show-KingsmenHelp {
  $help = [pscustomobject]@{
    module = "CREATOR"
    submodule = "CREATOR.1"
    path = "scripts/KINGSMEN_CREATOR.ps1"
    creatorVersion = $CreatorVersion
    productionReady = $ProductionReady
    commands = @(
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase Help",
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase Doctor",
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase AuditExisting",
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase N09.3Complete",
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase Validate",
      ".\scripts\KINGSMEN_CREATOR.ps1 -Phase Report"
    )
    reports = @(
      "reports/creator/creator-doctor-report.json",
      "reports/creator/creator-audit-existing-report.json",
      "reports/creator/creator-n09-3-validation-bridge-report.json",
      "reports/creator/creator-report-index.json"
    )
    nextTrackerRow = "CREATOR.2 — scripts/testing/Test-KingsmenCreator.ps1"
  }

  return $help
}

New-KingsmenDirectory -Path $CreatorReportRoot
New-KingsmenDirectory -Path $N09ReportRoot

$result = switch ($Phase) {
  "AuditExisting" { Invoke-AuditExisting }
  "Validate" { Invoke-N09_3Validation }
  "N09.3Complete" { Invoke-N09_3Validation }
  "Report" { Invoke-Report }
  "Doctor" { Invoke-Doctor }
  "Help" { Show-KingsmenHelp }
}

$result | ConvertTo-Json -Depth 50

if ($result.PSObject.Properties.Name -contains "passed") {
  if ($result.passed -ne $true) { exit 1 }
}

exit 0
