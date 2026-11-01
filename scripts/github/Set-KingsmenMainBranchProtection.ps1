#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$Repository = "kingsmenportal-ctrl/kingsmen-platform",
  [string]$Branch = "main",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$gh = Get-Command "gh" -ErrorAction SilentlyContinue
if (-not $gh) {
  throw "GitHub CLI (gh) is required. Install gh and authenticate with repo admin permissions."
}

$owner, $repo = $Repository.Split("/", 2)
if ([string]::IsNullOrWhiteSpace($owner) -or [string]::IsNullOrWhiteSpace($repo)) {
  throw "Repository must be in owner/name form."
}

$payload = [ordered]@{
  required_status_checks = [ordered]@{
    strict = $true
    contexts = @("source-guard")
  }
  enforce_admins = $true
  required_pull_request_reviews = [ordered]@{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = 1
  }
  restrictions = $null
  required_conversation_resolution = $true
  required_linear_history = $true
  allow_force_pushes = $false
  allow_deletions = $false
}

$payloadJson = $payload | ConvertTo-Json -Depth 20

if ($DryRun) {
  $report = [ordered]@{
    schema = "kingsmen.main-branch-protection-apply.v1"
    status = "DRY_RUN"
    repository = $Repository
    branch = $Branch
    productionReady = $false
    protectionWouldBeApplied = $true
    requiredStatusCheckContexts = @("source-guard")
    strictStatusChecksRequired = $true
    requiredApprovingReviewCount = 1
    staleReviewsMustBeDismissed = $true
    conversationResolutionRequired = $true
    linearHistoryRequired = $true
    enforceAdmins = $true
    allowForcePushes = $false
    allowDeletions = $false
    requiresPullRequest = $true
    payloadPreview = ($payloadJson | ConvertFrom-Json)
  }

  New-Item -ItemType Directory -Force -Path "reports/repo" | Out-Null
  $report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 "reports/repo/main-branch-protection-apply-latest.json"
  $report | ConvertTo-Json -Depth 20
  exit 0
}

$temp = New-TemporaryFile
try {
  $payloadJson | Set-Content -Encoding utf8 $temp.FullName
  gh api --method PUT -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "/repos/$owner/$repo/branches/$Branch/protection" --input $temp.FullName | Out-Null
  $verify = gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "/repos/$owner/$repo/branches/$Branch/protection" | ConvertFrom-Json

  $contexts = @($verify.required_status_checks.contexts)
  $reviewPolicy = $verify.required_pull_request_reviews
  $reviewCount = if ($null -ne $reviewPolicy -and $null -ne $reviewPolicy.required_approving_review_count) {
    [int]$reviewPolicy.required_approving_review_count
  } else {
    0
  }
  $strictStatusChecksEnabled = $verify.required_status_checks.strict -eq $true
  $sourceGuardRequired = $contexts -contains "source-guard"
  $pullRequestReviewRequired = $reviewCount -ge 1
  $staleReviewsDismissed = $reviewPolicy.dismiss_stale_reviews -eq $true
  $conversationResolutionRequired = $verify.required_conversation_resolution.enabled -eq $true
  $linearHistoryRequired = $verify.required_linear_history.enabled -eq $true
  $adminEnforcementEnabled = $verify.enforce_admins.enabled -eq $true
  $forcePushDisabled = $verify.allow_force_pushes.enabled -eq $false
  $branchDeletionDisabled = $verify.allow_deletions.enabled -eq $false

  $passed = (
    $strictStatusChecksEnabled -and
    $sourceGuardRequired -and
    $pullRequestReviewRequired -and
    $staleReviewsDismissed -and
    $conversationResolutionRequired -and
    $linearHistoryRequired -and
    $adminEnforcementEnabled -and
    $forcePushDisabled -and
    $branchDeletionDisabled
  )

  $report = [ordered]@{
    schema = "kingsmen.main-branch-protection-apply.v1"
    status = $(if ($passed) { "MAIN_BRANCH_PROTECTION_APPLIED" } else { "MAIN_BRANCH_PROTECTION_APPLY_NEEDS_REVIEW" })
    passed = $passed
    repository = $Repository
    branch = $Branch
    productionReady = $false
    publicLaunchAllowed = $false
    requiredStatusCheckContexts = $contexts
    strictStatusChecksEnabled = $strictStatusChecksEnabled
    requiredApprovingReviewCount = $reviewCount
    staleReviewsDismissed = $staleReviewsDismissed
    conversationResolutionRequired = $conversationResolutionRequired
    linearHistoryRequired = $linearHistoryRequired
    adminEnforcementEnabled = $adminEnforcementEnabled
    forcePushDisabled = $forcePushDisabled
    branchDeletionDisabled = $branchDeletionDisabled
    generatedAtIso = (Get-Date).ToUniversalTime().ToString("o")
  }

  New-Item -ItemType Directory -Force -Path "reports/repo" | Out-Null
  $report | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 "reports/repo/main-branch-protection-apply-latest.json"
  $report | ConvertTo-Json -Depth 20

  if (-not $passed) {
    exit 1
  }
}
finally {
  Remove-Item $temp.FullName -Force -ErrorAction SilentlyContinue
}
