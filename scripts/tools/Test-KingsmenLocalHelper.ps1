$ErrorActionPreference = "Continue"

New-Item -ItemType Directory -Force -Path reports\tools | Out-Null

$started = (Get-Date).ToString("s")

$out = powershell -ExecutionPolicy Bypass -File scripts\tools\Invoke-KingsmenLocalHelper.ps1 `
  -Prompt "Reply exactly: Kingsmen helper ready" `
  -TimeoutSeconds 120 `
  -MaxTokens 30 2>&1 | Out-String

$passed = ($out -match "Kingsmen helper ready")

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-05"
  status = if ($passed) { "KINGSMEN_LOCAL_HELPER_READY" } else { "KINGSMEN_LOCAL_HELPER_NOT_READY" }
  generated_at = $started
  proven_route = "jarvis_direct_safe_mode"
  model = "qwen2.5:0.5b"
  passed = $passed
  output = $out.Trim()
  production_authority = $false
  decision = "Use Invoke-KingsmenLocalHelper.ps1 for small safe Kingsmen helper tasks only. It may suggest, summarize, and plan, but must not execute or modify production."
}

$report | ConvertTo-Json -Depth 10 | Set-Content reports\tools\kingsmen-local-helper-proof.json

@"
# TOOLS-JARVIS-CLAW-05 Kingsmen Local Helper Proof

Generated: $started

Passed: $passed
Proven route: jarvis_direct_safe_mode
Model: qwen2.5:0.5b

Boundary:
This helper may summarize, plan, and suggest safe commands only.
It is not production authority.
It may not access secrets, logs, candidate data, payment data, WhatsApp, browser control, shell execution, repo edits, Oracle deployment, Supabase service_role, or PayFast actions.
"@ | Set-Content reports\tools\kingsmen-local-helper-proof.md

Write-Host "Kingsmen helper passed: $passed"
Write-Host "Report: reports\tools\kingsmen-local-helper-proof.json"
