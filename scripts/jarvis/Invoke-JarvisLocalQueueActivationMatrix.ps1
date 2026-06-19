param(
  [string]$EnvFile = ".local/kingsmen.local-postgres.env",
  [string]$BackendBaseUrl = "http://127.0.0.1:3001",
  [string]$RedisUrl = "redis://127.0.0.1:6379"
)

$ErrorActionPreference = "Stop"

$repoRoot = Get-Location
$credentialScript = Join-Path $repoRoot "scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1"
$matrixScript = Join-Path $repoRoot "scripts/jarvis/Build-JarvisModuleActivationMatrix.ps1"

if (-not (Test-Path $credentialScript)) {
  throw "Missing Jarvis credential readiness script: $credentialScript"
}

if (-not (Test-Path $matrixScript)) {
  throw "Missing Jarvis activation matrix script: $matrixScript"
}

# Run the credential scan in a child PowerShell process because the scan may exit 1
# when unrelated provider credentials are still missing. We still want the matrix
# to rebuild from the redacted report it produced.
& powershell -NoProfile -ExecutionPolicy Bypass -File $credentialScript `
  -EnvFile $EnvFile `
  -BackendBaseUrl $BackendBaseUrl `
  -RedisUrl $RedisUrl
$scanExitCode = $LASTEXITCODE

& powershell -NoProfile -ExecutionPolicy Bypass -File $matrixScript
$matrixExitCode = $LASTEXITCODE

$summary = [ordered]@{
  schema = "kingsmen.jarvis-local-queue-activation-wrapper.v1"
  module = "Jarvis Local Queue Activation Wrapper"
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawConnectionStringsPrinted = $false
  credentialScanExitCode = $scanExitCode
  activationMatrixExitCode = $matrixExitCode
  credentialReportPath = "reports/jarvis/jarvis-credential-readiness-latest.json"
  activationMatrixReportPath = "reports/jarvis/jarvis-module-activation-matrix-latest.json"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = "If queue_fabric shows BLOCKED_STAGING_EVIDENCE, run observability staging proof before live queue activation."
}

$summary | ConvertTo-Json -Depth 6

exit $matrixExitCode
