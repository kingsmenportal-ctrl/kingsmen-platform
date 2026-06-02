#requires -Version 5.1
[CmdletBinding()]
param([string]$Root = "")

$ErrorActionPreference = "Stop"

function Resolve-TestRoot {
  param([string]$ProvidedRoot)

  if (-not [string]::IsNullOrWhiteSpace($ProvidedRoot)) {
    $resolved = Resolve-Path -Path $ProvidedRoot -ErrorAction SilentlyContinue
    if ($resolved) { return $resolved.Path }
  }

  $current = Get-Location

  while ($null -ne $current) {
    if (Test-Path (Join-Path $current.Path ".git") -PathType Container) { return $current.Path }

    $parent = Split-Path -Parent $current.Path

    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current.Path) { break }

    $current = Get-Item $parent
  }

  return (Get-Location).Path
}

function New-Check {
  param([string]$Name, [bool]$Passed, [string]$Detail = "")

  return [pscustomobject]@{
    name = $Name
    passed = $Passed
    detail = $Detail
  }
}

function Invoke-CreatorChild {
  param(
    [string]$Name,
    [string[]]$Args,
    [string]$CreatorPath
  )

  $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CreatorPath @Args 2>&1
  $exit = $LASTEXITCODE
  $outText = $out | Out-String

  return [pscustomobject]@{
    name = $Name
    exitCode = $exit
    passed = ($exit -eq 0)
    outputPreview = $outText.Substring(0, [Math]::Min(1000, $outText.Length))
  }
}

$repoRoot = Resolve-TestRoot -ProvidedRoot $Root
$creator = Join-Path $repoRoot "scripts/KINGSMEN_CREATOR.ps1"
$reportPath = Join-Path $repoRoot "reports/creator/test-kingsmen-creator-report.json"

$checks = New-Object System.Collections.Generic.List[object]
$checks.Add((New-Check -Name "creator:file-exists" -Passed (Test-Path $creator -PathType Leaf) -Detail $creator))

$content = if (Test-Path $creator) { Get-Content $creator -Raw } else { "" }

foreach ($token in @("`$Phase", "Invoke-Doctor", "Invoke-AuditExisting", "Invoke-Report", "productionReady")) {
  $checks.Add((New-Check -Name ("creator:contains:{0}" -f $token) -Passed ($content.Contains($token)) -Detail "static token check"))
}

foreach ($bad in @("productionReady = `$true", "productionReady:true", "SUPABASE_SERVICE_ROLE", "SMTP_PASSWORD", "WHATSAPP_TOKEN", "PAYMENT_SECRET", "AIRTABLE_TOKEN")) {
  $checks.Add((New-Check -Name ("creator:forbidden:{0}" -f $bad) -Passed (-not $content.Contains($bad)) -Detail "forbidden token check"))
}

$commands = @(
  @{ Name = "phase-help"; Args = @("-Phase","Help") },
  @{ Name = "phase-doctor"; Args = @("-Phase","Doctor") },
  @{ Name = "phase-audit-existing"; Args = @("-Phase","AuditExisting") },
  @{ Name = "phase-report"; Args = @("-Phase","Report") }
)

$commandResults = @()

foreach ($cmd in $commands) {
  $result = Invoke-CreatorChild -Name $cmd.Name -Args $cmd.Args -CreatorPath $creator
  $commandResults += $result
  $checks.Add((New-Check -Name ("run:{0}" -f $cmd.Name) -Passed ($result.passed -eq $true) -Detail ("exitCode={0}" -f $result.exitCode)))
}

$failed = @($checks | Where-Object { $_.passed -ne $true })

$report = [pscustomobject]@{
  schema = "kingsmen.creator-test.v1"
  module = "CREATOR"
  submodule = "CREATOR.2"
  generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  repoRoot = $repoRoot
  passed = ($failed.Count -eq 0)
  totalChecks = $checks.Count
  failedChecks = $failed.Count
  failed = $failed
  checks = $checks
  commandResults = $commandResults
  note = "BATCH 02 validates CREATOR.1 phase stability and report proof. Action mode remains CREATOR.2B."
  nextAction = $(if ($failed.Count -eq 0) { "Run node scripts/validators/validate-creator-normalize.mjs" } else { "Repair Creator before continuing." })
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $reportPath) | Out-Null
$report | ConvertTo-Json -Depth 80 | Set-Content -Path $reportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 80

if ($failed.Count -gt 0) { exit 1 }
exit 0
