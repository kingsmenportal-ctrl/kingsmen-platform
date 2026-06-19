param(
  [string]$CredentialReportPath = "reports/jarvis/jarvis-credential-readiness-latest.json",
  [string]$FinalEvidenceBundlePath = "reports/final-assembly/final-assembly-evidence-bundle-latest.json",
  [string]$OutputPath = "reports/jarvis/jarvis-module-activation-matrix-latest.json"
)

$ErrorActionPreference = "Stop"

function Read-JsonFileOrNull {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $null }
  $raw = Get-Content $Path -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
  return $raw | ConvertFrom-Json
}

function Get-ModuleCredentialReady {
  param($CredentialReport, [string]$ModuleRef)
  if ($null -eq $CredentialReport -or $null -eq $CredentialReport.modules) { return $false }
  $module = $CredentialReport.modules | Where-Object { $_.moduleRef -eq $ModuleRef } | Select-Object -First 1
  if ($null -eq $module) { return $false }
  return [bool]$module.readyForStagingProof
}

function Get-EvidenceReport {
  param($FinalEvidenceBundle, [string]$Path)
  if ($null -ne $FinalEvidenceBundle -and $null -ne $FinalEvidenceBundle.reports) {
    $fromBundle = $FinalEvidenceBundle.reports | Where-Object { $_.path -eq $Path } | Select-Object -First 1
    if ($null -ne $fromBundle) { return $fromBundle }
  }

  if (Test-Path $Path) {
    $direct = Read-JsonFileOrNull -Path $Path
    if ($null -ne $direct) {
      return [ordered]@{
        path = $Path
        exists = $true
        passed = [bool]$direct.passed
        reviewed = [bool]$direct.reviewed
        redacted = [bool]$direct.redacted
        status = [string]$direct.status
        generatedAt = $direct.generatedAt
      }
    }
  }

  return $null
}

function New-ActivationModule {
  param(
    [string]$ModuleRef,
    [string]$DisplayName,
    [string]$CredentialModuleRef,
    [string]$EvidencePath,
    [bool]$CredentialRequired = $true,
    [bool]$EvidenceRequired = $true
  )

  $credentialReady = $true
  if ($CredentialRequired) {
    $credentialReady = Get-ModuleCredentialReady -CredentialReport $credentialReport -ModuleRef $CredentialModuleRef
  }

  $evidence = $null
  $evidencePassed = $true
  $evidenceReviewed = $true
  $evidenceRedacted = $true
  $evidenceStatus = "NOT_REQUIRED"

  if ($EvidenceRequired) {
    $evidence = Get-EvidenceReport -FinalEvidenceBundle $finalEvidenceBundle -Path $EvidencePath
    $evidencePassed = ($null -ne $evidence -and [bool]$evidence.passed)
    $evidenceReviewed = ($null -ne $evidence -and [bool]$evidence.reviewed)
    $evidenceRedacted = ($null -ne $evidence -and [bool]$evidence.redacted)
    $evidenceStatus = if ($null -eq $evidence) { "MISSING_EVIDENCE_REPORT" } else { [string]$evidence.status }
  }

  $readyForStaging = $credentialReady
  $readyForLive = $credentialReady -and $evidencePassed -and $evidenceReviewed -and $evidenceRedacted

  $status = if (-not $credentialReady) {
    "BLOCKED_CREDENTIALS"
  } elseif (-not $evidencePassed) {
    "BLOCKED_STAGING_EVIDENCE"
  } elseif (-not $evidenceReviewed) {
    "BLOCKED_FOUNDER_REVIEW"
  } elseif (-not $evidenceRedacted) {
    "BLOCKED_REDACTION"
  } else {
    "READY_FOR_LIVE_AFTER_APPROVAL"
  }

  return [ordered]@{
    moduleRef = $ModuleRef
    displayName = $DisplayName
    credentialModuleRef = if ($CredentialRequired) { $CredentialModuleRef } else { "NOT_REQUIRED" }
    evidencePath = if ($EvidenceRequired) { $EvidencePath } else { "NOT_REQUIRED" }
    credentialReady = $credentialReady
    evidencePassed = $evidencePassed
    evidenceReviewed = $evidenceReviewed
    evidenceRedacted = $evidenceRedacted
    evidenceStatus = $evidenceStatus
    readyForStagingProof = $readyForStaging
    readyForLiveAfterApproval = $readyForLive
    status = $status
  }
}

$credentialReport = Read-JsonFileOrNull -Path $CredentialReportPath
$finalEvidenceBundle = Read-JsonFileOrNull -Path $FinalEvidenceBundlePath

$modules = @(
  New-ActivationModule -ModuleRef "truth_vault" -DisplayName "PostgreSQL Truth Vault" -CredentialModuleRef "truth_vault" -EvidencePath "reports/staging/truth-vault-persistence-staging-latest.json"
  New-ActivationModule -ModuleRef "web_backend_boundary" -DisplayName "Web to Backend Boundary" -CredentialModuleRef "web_backend_boundary" -EvidencePath "reports/staging/web-backend-boundary-staging-latest.json"
  New-ActivationModule -ModuleRef "queue_fabric" -DisplayName "Redis Queue Fabric" -CredentialModuleRef "queue_fabric" -EvidencePath "reports/staging/observability-incident-staging-latest.json"
  New-ActivationModule -ModuleRef "payments" -DisplayName "PayFast Payments" -CredentialModuleRef "payments" -EvidencePath "reports/staging/payfast-provider-sandbox-staging-latest.json"
  New-ActivationModule -ModuleRef "communications" -DisplayName "Email / WhatsApp / SMS Communications" -CredentialModuleRef "communications" -EvidencePath "reports/staging/communications-provider-staging-latest.json"
  New-ActivationModule -ModuleRef "document_vault" -DisplayName "Document Vault Storage" -CredentialModuleRef "document_vault" -EvidencePath "reports/staging/document-vault-storage-staging-latest.json"
  New-ActivationModule -ModuleRef "legal_privacy" -DisplayName "Legal Privacy Publication" -CredentialModuleRef "NOT_REQUIRED" -CredentialRequired $false -EvidencePath "reports/staging/legal-privacy-publication-staging-latest.json"
  New-ActivationModule -ModuleRef "branch_protection" -DisplayName "GitHub Main Branch Protection" -CredentialModuleRef "NOT_REQUIRED" -CredentialRequired $false -EvidencePath "reports/repo/main-branch-protection-apply-latest.json"
)

$blocked = @($modules | Where-Object { $_.readyForLiveAfterApproval -ne $true })
$ready = @($modules | Where-Object { $_.readyForLiveAfterApproval -eq $true })

$status = if ($blocked.Count -eq 0) { "JARVIS_MODULE_ACTIVATION_MATRIX_READY_FOR_FOUNDER_APPROVAL" } else { "JARVIS_MODULE_ACTIVATION_MATRIX_BLOCKED" }

$report = [ordered]@{
  schema = "kingsmen.jarvis-module-activation-matrix.v1"
  module = "Jarvis Module Activation Matrix"
  status = $status
  passed = ($blocked.Count -eq 0)
  productionReady = $false
  publicLaunchAllowed = $false
  rawSecretsPrinted = $false
  rawConnectionStringsPrinted = $false
  jarvisMayStoreSecrets = $false
  credentialReportPath = $CredentialReportPath
  finalEvidenceBundlePath = $FinalEvidenceBundlePath
  moduleCount = $modules.Count
  readyForLiveCount = $ready.Count
  blockedCount = $blocked.Count
  modules = $modules
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  nextAction = if ($blocked.Count -eq 0) { "Founder may review live activation approvals. Do not enable production writes without explicit founder approval." } else { "Resolve blocked credentials and staging evidence, then rebuild the Jarvis module activation matrix." }
}

$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $OutputPath -Encoding UTF8
$report | ConvertTo-Json -Depth 12
