#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$Command
)

$ErrorActionPreference = "Stop"

$safeRead = @("status", "reports", "providers", "next-action")
$safeDraft = @("draft-action-packet", "draft-message")
$approvalRequired = @("deploy", "enable-live-payment", "send-bulk-email", "change-dns", "raise-cap")
$blocked = @("raw-shell", "export-candidate-data", "approve-refund", "mark-payment-paid", "claim-official-submission")

$class = "UNKNOWN"
$allowedToExecute = $false
$requiresFounderApproval = $false
$blockedByPolicy = $false

if ($safeRead -contains $Command) {
  $class = "SAFE_READ"
  $allowedToExecute = $true
} elseif ($safeDraft -contains $Command) {
  $class = "SAFE_DRAFT"
  $allowedToExecute = $true
} elseif ($approvalRequired -contains $Command) {
  $class = "APPROVAL_REQUIRED"
  $requiresFounderApproval = $true
} elseif ($blocked -contains $Command) {
  $class = "BLOCKED"
  $blockedByPolicy = $true
} else {
  $class = "UNKNOWN"
  $blockedByPolicy = $true
}

$report = [ordered]@{
  schema = "kingsmen.founder-command-agent-result.v1"
  module = "AGENTS-01 - Founder Command Agent"
  command = $Command
  commandClass = $class
  allowedToExecute = $allowedToExecute
  requiresFounderApproval = $requiresFounderApproval
  blockedByPolicy = $blockedByPolicy
  productionReady = $false
  executedHighRiskAction = $false
  touchedSecrets = $false
  touchedCandidateData = $false
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  next_action = if ($allowedToExecute) {
    "Command may be handled by a safe read/draft routine."
  } elseif ($requiresFounderApproval) {
    "Create founder approval action packet before execution."
  } else {
    "Command blocked by AGENTS-01 policy."
  }
}

New-Item -ItemType Directory -Force -Path ".\reports\agents" | Out-Null
$report | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 ".\reports\agents\founder-command-agent-last-result.json"

$report | ConvertTo-Json -Depth 10

if ($blockedByPolicy) {
  exit 2
}
