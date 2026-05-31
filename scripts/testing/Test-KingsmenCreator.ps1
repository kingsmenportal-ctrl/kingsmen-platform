#requires -Version 5.1
<#
CREATOR.2 - Test-KingsmenCreator.ps1
PowerShell 5.1-safe self-test for scripts/KINGSMEN_CREATOR.ps1.
Writes reports/creator/creator-validation-report.json.
#>

[CmdletBinding()]
param(
  [string]$Root = ''
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

  return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

$RepoRoot = Resolve-KingsmenRoot -ProvidedRoot $Root
Set-Location $RepoRoot

$Checks = New-Object System.Collections.Generic.List[object]
$CreatorRelativePath = 'scripts/KINGSMEN_CREATOR.ps1'
$CreatorPath = Join-Path $RepoRoot $CreatorRelativePath
$ReportDir = Join-Path $RepoRoot 'reports/creator'
$ReportPath = Join-Path $ReportDir 'creator-validation-report.json'

function Add-KmCheck {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Detail,
    [string]$File = ''
  )

  $script:Checks.Add([pscustomobject]@{
    name = $Name
    passed = $Passed
    detail = $Detail
    file = $File
  })
}

function Add-ContainsCheck {
  param(
    [string]$Content,
    [string]$Token,
    [string]$File
  )

  $present = $Content.IndexOf($Token, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
  Add-KmCheck -Name ('contains:{0}:{1}' -f $File, $Token) -Passed $present -Detail $(if ($present) { 'found' } else { 'missing' }) -File $File
}

function Invoke-CreatorPhaseForTest {
  param([string]$PhaseName)

  $raw = & powershell -NoProfile -ExecutionPolicy Bypass -File $CreatorPath -Phase $PhaseName 2>&1
  $exitCode = $LASTEXITCODE
  $output = ($raw | Out-String).Trim()
  $passed = ($exitCode -eq 0)

  Add-KmCheck -Name ('creator-phase:{0}:exit-code' -f $PhaseName) -Passed $passed -Detail ('exitCode={0}' -f $exitCode) -File $CreatorRelativePath

  if ($output.Length -gt 0) {
    try {
      $json = $output | ConvertFrom-Json
      if ($json.PSObject.Properties.Name -contains 'productionReady') {
        Add-KmCheck -Name ('creator-phase:{0}:productionReadyFalse' -f $PhaseName) -Passed ($json.productionReady -eq $false) -Detail ('productionReady={0}' -f $json.productionReady) -File $CreatorRelativePath
      }
      if ($json.PSObject.Properties.Name -contains 'nextTrackerRow') {
        Add-KmCheck -Name ('creator-phase:{0}:nextTrackerRow' -f $PhaseName) -Passed (-not [string]::IsNullOrWhiteSpace($json.nextTrackerRow)) -Detail $json.nextTrackerRow -File $CreatorRelativePath
      }
    } catch {
      Add-KmCheck -Name ('creator-phase:{0}:json-parse' -f $PhaseName) -Passed $false -Detail $_.Exception.Message -File $CreatorRelativePath
    }
  } else {
    Add-KmCheck -Name ('creator-phase:{0}:output' -f $PhaseName) -Passed $false -Detail 'empty output' -File $CreatorRelativePath
  }
}

try {
  $exists = Test-Path $CreatorPath
  Add-KmCheck -Name ('exists:{0}' -f $CreatorRelativePath) -Passed $exists -Detail $(if ($exists) { 'found' } else { 'missing' }) -File $CreatorRelativePath

  if ($exists) {
    $creator = Get-Content -Path $CreatorPath -Raw

    Add-ContainsCheck -Content $creator -Token "ValidateSet('AuditExisting','Validate','N09.3Complete','Report','Doctor','Help')" -File $CreatorRelativePath
    Add-ContainsCheck -Content $creator -Token 'function Invoke-Doctor' -File $CreatorRelativePath
    Add-ContainsCheck -Content $creator -Token 'function Invoke-AuditExisting' -File $CreatorRelativePath
    Add-ContainsCheck -Content $creator -Token 'function Invoke-N09_3Validation' -File $CreatorRelativePath
    Add-ContainsCheck -Content $creator -Token 'function Invoke-Report' -File $CreatorRelativePath
    Add-ContainsCheck -Content $creator -Token 'productionReady' -File $CreatorRelativePath

    $productionReadyTrue = $creator -match 'productionReady\s*[:=]\s*true'
    Add-KmCheck -Name ('forbidden:{0}:productionReadyTrue' -f $CreatorRelativePath) -Passed (-not $productionReadyTrue) -Detail $(if ($productionReadyTrue) { 'forbidden content found' } else { 'not found' }) -File $CreatorRelativePath

    $secretWords = @('SUPABASE_SERVICE_ROLE','SMTP_PASSWORD','WHATSAPP_TOKEN','PAYMENT_SECRET','AIRTABLE_TOKEN')
    foreach ($word in $secretWords) {
      $hit = $creator.IndexOf($word, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
      Add-KmCheck -Name ('forbidden:{0}:{1}' -f $CreatorRelativePath, $word) -Passed (-not $hit) -Detail $(if ($hit) { 'forbidden content found' } else { 'not found' }) -File $CreatorRelativePath
    }

    Invoke-CreatorPhaseForTest -PhaseName 'Help'
    Invoke-CreatorPhaseForTest -PhaseName 'Doctor'
    Invoke-CreatorPhaseForTest -PhaseName 'AuditExisting'
    Invoke-CreatorPhaseForTest -PhaseName 'N09.3Complete'
    Invoke-CreatorPhaseForTest -PhaseName 'Report'
  }
} catch {
  Add-KmCheck -Name 'creator-test:unhandled-error' -Passed $false -Detail $_.Exception.Message -File 'scripts/testing/Test-KingsmenCreator.ps1'
}

$Failed = @($Checks | Where-Object { $_.passed -ne $true })
$Passed = ($Failed.Count -eq 0)

$Report = [ordered]@{
  module = 'CREATOR'
  submodule = 'CREATOR.2'
  validator = 'Test-KingsmenCreator.ps1'
  productionReady = $false
  generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
  repoRoot = $RepoRoot
  passed = $Passed
  totalChecks = @($Checks).Count
  failedChecks = @($Failed).Count
  failed = @($Failed)
  checks = @($Checks)
  nextTrackerRow = $(if ($Passed) { 'CREATOR.3 - reports/creator/creator-validation-report.json' } else { 'CREATOR.2 repair - fix failed checks in reports/creator/creator-validation-report.json' })
}

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Report | ConvertTo-Json -Depth 12 | Set-Content -Path $ReportPath -Encoding UTF8
$Report | ConvertTo-Json -Depth 12

if ($Passed) { exit 0 }
exit 1
