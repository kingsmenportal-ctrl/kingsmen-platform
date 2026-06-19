#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$BackendBaseUrl = "http://127.0.0.1:3001",
  [string]$RedisUrl = "redis://127.0.0.1:6379",
  [string]$ReportPath = "reports/jarvis/jarvis-local-observability-activation-wrapper-latest.json"
)

$ErrorActionPreference = "Continue"

function Write-WrapperReport {
  param([object]$Report)
  $fullPath = Join-Path $RepoRoot $ReportPath
  $dir = Split-Path -Parent $fullPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $json = $Report | ConvertTo-Json -Depth 20
  if ($json.Contains("postgres://") -or $json.Contains("postgresql://") -or $json.Contains("redis://") -or $json.Contains("BEGIN PRIVATE KEY") -or $json.Contains("github_pat_") -or $json.Contains("sk-")) {
    throw "Secret-like value detected in Jarvis local observability wrapper report output."
  }
  $json | Set-Content -Encoding UTF8 -Path $fullPath
  Write-Output $json
}

function Get-LastExitCodeSafe {
  if ($null -eq $global:LASTEXITCODE) { return 0 }
  return [int]$global:LASTEXITCODE
}

Set-Location $RepoRoot

$credentialScript = Join-Path $RepoRoot "scripts\jarvis\Invoke-JarvisCredentialReadiness.ps1"
$observabilityScript = Join-Path $RepoRoot "scripts\staging\Invoke-KingsmenObservabilityIncidentStagingProof.ps1"
$finalCollector = Join-Path $RepoRoot "scripts\staging\Collect-KingsmenFinalAssemblyEvidence.ps1"
$matrixScript = Join-Path $RepoRoot "scripts\jarvis\Build-JarvisModuleActivationMatrix.ps1"

& $credentialScript -RepoRoot $RepoRoot -EnvFile $EnvFile -BackendBaseUrl $BackendBaseUrl -RedisUrl $RedisUrl
$credentialScanExitCode = Get-LastExitCodeSafe

& $observabilityScript -RepoRoot $RepoRoot -BackendBaseUrl $BackendBaseUrl -MarkOperatorReviewed
$observabilityProofExitCode = Get-LastExitCodeSafe

& $finalCollector -RepoRoot $RepoRoot
$finalEvidenceExitCode = Get-LastExitCodeSafe

& $matrixScript -RepoRoot $RepoRoot
$activationMatrixExitCode = Get-LastExitCodeSafe

$report = [ordered]@{
  schema = "kingsmen.jarvis-local-observability-activation-wrapper.v1"
  module = "Jarvis Local Observability Activation Wrapper"
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawConnectionStringsPrinted = $false
  credentialScanExitCode = $credentialScanExitCode
  observabilityProofExitCode = $observabilityProofExitCode
  finalEvidenceExitCode = $finalEvidenceExitCode
  activationMatrixExitCode = $activationMatrixExitCode
  credentialReportPath = "reports/jarvis/jarvis-credential-readiness-latest.json"
  observabilityReportPath = "reports/staging/observability-incident-staging-latest.json"
  finalEvidenceBundlePath = "reports/final-assembly/final-assembly-evidence-bundle-latest.json"
  activationMatrixReportPath = "reports/jarvis/jarvis-module-activation-matrix-latest.json"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = $(if ($observabilityProofExitCode -eq 0) { "Observability proof passed. Queue Fabric can move to READY_FOR_LIVE_AFTER_APPROVAL when the activation matrix sees passed evidence." } else { "Start local API/Postgres/Redis, rerun this wrapper, and keep Queue Fabric blocked until observability proof passes." })
}

Write-WrapperReport -Report $report
exit 0
