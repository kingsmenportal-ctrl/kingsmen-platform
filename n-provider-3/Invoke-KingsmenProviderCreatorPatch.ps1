# N_PROVIDER.3 — Safe patcher for scripts/KINGSMEN_CREATOR.ps1
# This patcher updates the Creator ValidateSet and adds provider command dispatch.
param(
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$CreatorPath = Join-Path $Root 'scripts/KINGSMEN_CREATOR.ps1'
$ReportDir = Join-Path $Root 'reports/provider'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if (-not (Test-Path $CreatorPath)) { throw "Creator not found: $CreatorPath" }

$Original = Get-Content -Raw -Path $CreatorPath
$Updated = $Original
$Errors = New-Object System.Collections.Generic.List[string]
$Actions = New-Object System.Collections.Generic.List[string]

$ProviderCommands = @('provider:check','provider:doctor','provider:report','provider:install')

# Add provider commands to any ValidateSet containing the known Creator phases.
$ValidateSetPattern = "\[ValidateSet\(([^\)]*)\)\]"
$Updated = [regex]::Replace($Updated, $ValidateSetPattern, {
  param($m)
  $inside = $m.Groups[1].Value
  if ($inside -match "AuditExisting" -and $inside -match "Validate" -and $inside -match "Doctor" -and $inside -notmatch "provider:doctor") {
    $suffix = ", 'provider:check', 'provider:doctor', 'provider:report', 'provider:install'"
    $Actions.Add('validate_set_extended')
    return "[ValidateSet($inside$suffix)]"
  }
  return $m.Value
})

$DispatchBlock = @'

# N_PROVIDER.3 provider command dispatch
if ($Phase -in @('provider:check','provider:doctor','provider:report','provider:install')) {
    $ProviderInvoker = Join-Path $PSScriptRoot '..\n-provider-2\Invoke-KingsmenProvider.ps1'
    if (-not (Test-Path $ProviderInvoker)) {
        throw "Missing provider invoker: $ProviderInvoker"
    }
    powershell -ExecutionPolicy Bypass -File $ProviderInvoker $Phase
    if ($LASTEXITCODE -ne 0) {
        throw "Provider command failed: $Phase exit=$LASTEXITCODE"
    }
    return
}
# END N_PROVIDER.3 provider command dispatch
'@

if ($Updated -notmatch "N_PROVIDER\.3 provider command dispatch") {
  # Insert immediately after param block if possible, otherwise after first line.
  $paramEnd = $Updated.IndexOf(")`r`n")
  if ($paramEnd -lt 0) { $paramEnd = $Updated.IndexOf(")`n") }
  if ($paramEnd -ge 0) {
    $insertAt = $paramEnd + 1
    while ($insertAt -lt $Updated.Length -and ($Updated[$insertAt] -eq "`r" -or $Updated[$insertAt] -eq "`n")) { $insertAt++ }
    $Updated = $Updated.Insert($insertAt, $DispatchBlock + "`r`n")
    $Actions.Add('provider_dispatch_inserted')
  } else {
    $Errors.Add('Could not locate param block end for dispatch insertion.')
  }
} else {
  $Actions.Add('provider_dispatch_already_present')
}

foreach ($cmd in $ProviderCommands) {
  if ($Updated -notmatch [regex]::Escape($cmd)) { $Errors.Add("Creator missing command after patch: $cmd") }
}
if ($Updated -notmatch "Invoke-KingsmenProvider\.ps1") { $Errors.Add('Creator does not reference Invoke-KingsmenProvider.ps1 after patch.') }

$Report = [ordered]@{
  module = 'N_PROVIDER.3'
  generated_at = (Get-Date).ToString('o')
  apply = [bool]$Apply
  passed = ($Errors.Count -eq 0)
  actions = $Actions
  errors = $Errors
  creator_path = $CreatorPath
  safety = [ordered]@{
    no_raw_secrets_printed = $true
    optional_providers_enabled = $false
    dispatch_target = 'n-provider-2/Invoke-KingsmenProvider.ps1'
  }
}

$ReportPath = Join-Path $ReportDir 'provider-creator-direct-patch-report.json'
$Report | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $ReportPath

if ($Errors.Count -gt 0) {
  Write-Host "N_PROVIDER.3 patch validation failed. See $ReportPath" -ForegroundColor Red
  exit 1
}

if ($Apply) {
  Copy-Item $CreatorPath "$CreatorPath.n-provider-3.bak" -Force
  Set-Content -Encoding UTF8 -Path $CreatorPath -Value $Updated
  Write-Host "N_PROVIDER.3 patch applied to $CreatorPath" -ForegroundColor Green
} else {
  Write-Host "N_PROVIDER.3 dry-run passed. Re-run with -Apply to modify Creator." -ForegroundColor Yellow
}
Write-Host "N_PROVIDER.3 patch report written: $ReportPath" -ForegroundColor Green
