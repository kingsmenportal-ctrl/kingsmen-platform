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
    allowForcePushes = $false
    allowDeletions = $false
    requiresPullRequest = $true
    enforceAdmins = $true
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

  gh api `
    --method PUT `
    -H "Accept: application/vnd.github+json" `
    -H "X-GitHub-Api-Version: 2022-11-28" `
    "/repos/$owner/$repo/branches/$Branch/protection" `
    --input $temp.FullName | Out-Null

  $verify = gh api `
    -H "Accept: application/vnd.github+json" `
    -H "X-GitHub-Api-Version: 2022-11-28" `
    "/repos/$owner/$repo/branches/$Branch/protection" | ConvertFrom-Json

  $contexts = @($verify.required_status_checks.contexts)

  $passed = $contexts -contains "source-guard" -and `
    $verify.allow_force_pushes.enabled -eq $false -and `
    $verify.allow_deletions.enabled -eq $false

  $report = [ordered]@{
    schema = "kingsmen.main-branch-protection-apply.v1"
    status = $(if ($passed) { "MAIN_BRANCH_PROTECTION_APPLIED" } else { "MAIN_BRANCH_PROTECTION_APPLY_NEEDS_REVIEW" })
    passed = $passed
    repository = $Repository
    branch = $Branch
    productionReady = $false
    publicLaunchAllowed = $false
    requiredStatusCheckContexts = $contexts
    allowForcePushes = $verify.allow_force_pushes.enabled
    allowDeletions = $verify.allow_deletions.enabled
    enforceAdminsUrlPresent = -not [string]::IsNullOrWhiteSpace($verify.enforce_admins.url)
    requiresPullRequestReviews = $null -ne $verify.required_pull_request_reviews
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
