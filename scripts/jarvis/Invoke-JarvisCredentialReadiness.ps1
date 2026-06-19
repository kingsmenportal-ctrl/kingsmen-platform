param(
  [string]$ReportPath = "reports/jarvis/jarvis-credential-readiness-latest.json",
  [switch]$RequireProductionCredentials
)

$ErrorActionPreference = "Stop"

function Test-KingsmenPlaceholder {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return $true }
  $normalized = $Value.Trim().ToLowerInvariant()
  if ($normalized.Length -eq 0) { return $true }
  $bad = @("...", "changeme", "change_me", "todo", "placeholder", "your_value_here")
  if ($bad -contains $normalized) { return $true }
  if ($normalized.StartsWith("your_")) { return $true }
  if ($normalized.StartsWith("replace_")) { return $true }
  if ($normalized.Contains("example.com")) { return $true }
  return $false
}

function Get-KingsmenRedactedPreview {
  param([AllowNull()][string]$Value)
  if (Test-KingsmenPlaceholder $Value) { return "missing_or_placeholder" }
  if ($Value.Length -le 8) { return "present_redacted" }
  return ($Value.Substring(0, 2) + "***" + $Value.Substring($Value.Length - 2))
}

$requirements = @(
  @{ envName = "KINGSMEN_DATABASE_URL"; provider = "postgresql"; moduleRef = "truth_vault"; requiredForBeta = $true; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "DATABASE_URL"; provider = "postgresql"; moduleRef = "truth_vault"; requiredForBeta = $true; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "REDIS_URL"; provider = "redis"; moduleRef = "queue_fabric"; requiredForBeta = $true; requiredForProduction = $true; risk = "high"; secret = $true },
  @{ envName = "KINGSMEN_BACKEND_BASE_URL"; provider = "kingsmen-api"; moduleRef = "web_backend_boundary"; requiredForBeta = $true; requiredForProduction = $true; risk = "medium"; secret = $false },
  @{ envName = "SMTP_HOST"; provider = "email"; moduleRef = "communications"; requiredForBeta = $false; requiredForProduction = $true; risk = "medium"; secret = $false },
  @{ envName = "SMTP_USER"; provider = "email"; moduleRef = "communications"; requiredForBeta = $false; requiredForProduction = $true; risk = "medium"; secret = $true },
  @{ envName = "SMTP_PASSWORD"; provider = "email"; moduleRef = "communications"; requiredForBeta = $false; requiredForProduction = $true; risk = "high"; secret = $true },
  @{ envName = "PAYFAST_MERCHANT_ID"; provider = "payfast"; moduleRef = "payments"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "PAYFAST_MERCHANT_KEY"; provider = "payfast"; moduleRef = "payments"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "PAYFAST_PASSPHRASE"; provider = "payfast"; moduleRef = "payments"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "PAYFAST_NOTIFY_URL"; provider = "payfast"; moduleRef = "payments"; requiredForBeta = $false; requiredForProduction = $true; risk = "high"; secret = $false },
  @{ envName = "PAYMENT_PROVIDER_SECRET"; provider = "payment"; moduleRef = "payments"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "STORAGE_ACCESS_KEY"; provider = "object_storage"; moduleRef = "document_vault"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "STORAGE_SECRET_KEY"; provider = "object_storage"; moduleRef = "document_vault"; requiredForBeta = $false; requiredForProduction = $true; risk = "critical"; secret = $true },
  @{ envName = "STORAGE_BUCKET"; provider = "object_storage"; moduleRef = "document_vault"; requiredForBeta = $false; requiredForProduction = $true; risk = "medium"; secret = $false }
)

$selectedRequirements = if ($RequireProductionCredentials) {
  $requirements | Where-Object { $_.requiredForProduction -eq $true }
} else {
  $requirements | Where-Object { $_.requiredForBeta -eq $true -or $_.moduleRef -in @("communications", "payments", "document_vault") }
}

$checks = @()
foreach ($req in $selectedRequirements) {
  $value = [Environment]::GetEnvironmentVariable($req.envName, "Process")
  $placeholder = Test-KingsmenPlaceholder $value
  $checks += [ordered]@{
    envName = $req.envName
    provider = $req.provider
    moduleRef = $req.moduleRef
    status = if ($placeholder) { "PLACEHOLDER_REJECTED" } else { "PRESENT_REDACTED" }
    requiredForBeta = [bool]$req.requiredForBeta
    requiredForProduction = [bool]$req.requiredForProduction
    risk = $req.risk
    secret = [bool]$req.secret
    valuePrinted = $false
    redactedPreview = Get-KingsmenRedactedPreview $value
  }
}

$modules = @()
foreach ($moduleRef in ($selectedRequirements | ForEach-Object { $_.moduleRef } | Sort-Object -Unique)) {
  $moduleChecks = @($checks | Where-Object { $_.moduleRef -eq $moduleRef })
  $present = @($moduleChecks | Where-Object { $_.status -eq "PRESENT_REDACTED" }).Count
  $placeholder = @($moduleChecks | Where-Object { $_.status -eq "PLACEHOLDER_REJECTED" }).Count
  $modules += [ordered]@{
    moduleRef = $moduleRef
    requiredCount = $moduleChecks.Count
    presentCount = $present
    missingCount = $moduleChecks.Count - $present
    placeholderCount = $placeholder
    readyForStagingProof = ($present -eq $moduleChecks.Count -and $placeholder -eq 0)
    readyForLiveAfterApproval = ($present -eq $moduleChecks.Count -and $placeholder -eq 0)
  }
}

$allReady = @($modules | Where-Object { $_.readyForStagingProof -ne $true }).Count -eq 0

$report = [ordered]@{
  schema = "kingsmen.jarvis-credential-activation-report.v1"
  module = "Jarvis Credential Activation Readiness"
  status = if ($allReady) { "JARVIS_CREDENTIAL_ACTIVATION_READY_FOR_STAGING_PROOF" } else { "JARVIS_CREDENTIAL_ACTIVATION_PENDING_CREDENTIALS" }
  passed = $allReady
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawConnectionStringsPrinted = $false
  jarvisMayStoreSecrets = $false
  credentialsAddedToGit = $false
  placeholderValuesAccepted = $false
  checks = $checks
  modules = $modules
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($allReady) { "Run staging proofs for communications, PayFast, observability, storage, and final evidence before live activation." } else { "Replace placeholders outside Git, rerun Jarvis credential readiness, then run module staging proofs." }
}

$fullReport = Join-Path (Get-Location) $ReportPath
New-Item -ItemType Directory -Force -Path (Split-Path $fullReport) | Out-Null
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $fullReport -Encoding UTF8
$report | ConvertTo-Json -Depth 8

if (-not $allReady) { exit 1 }
