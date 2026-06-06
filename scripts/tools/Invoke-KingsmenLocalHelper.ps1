param(
  [Parameter(Mandatory=$true)]
  [string]$Prompt,

  [int]$TimeoutSeconds = 120,
  [int]$MaxTokens = 250,
  [string]$Model = "qwen2.5:0.5b"
)

$ErrorActionPreference = "Continue"

$boundary = @"
You are Kingsmen local helper.

Kingsmen is a South African opportunity, education, application, employment, SETA, TVET, university, bursary, partner, and founder-control platform.

Rules:
- no roleplay
- no jokes
- no movie/franchise interpretation
- no secrets
- no logs
- no .env
- no .oci
- no .ssh
- no candidate data
- no payment data
- no WhatsApp automation
- no browser control
- no shell execution
- no repo edits
- no Oracle deployment
- no Supabase service_role
- no PayFast actions
- safe docs, reports, manifests, planning, summaries, and command suggestions only
- PowerShell executes only after founder approval
- GitHub proof and validators decide what is real

When blocked, say exactly:
Blocked by Kingsmen boundary. Founder approval and validator proof required.
"@

$task = "$boundary`n`nFounder task:`n$Prompt"

$job = Start-Job -ScriptBlock {
  param($task, $model, $maxTokens)

  jarvis ask --no-stream --no-context --agent= --engine ollama --model $model --max-tokens $maxTokens $task
} -ArgumentList $task, $Model, $MaxTokens

$done = Wait-Job $job -Timeout $TimeoutSeconds

if ($null -eq $done) {
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  Write-Host "TIMEOUT: Kingsmen local helper did not respond inside $TimeoutSeconds seconds." -ForegroundColor Red
  exit 124
}

$output = Receive-Job $job -ErrorAction SilentlyContinue | Out-String
Remove-Job $job -Force -ErrorAction SilentlyContinue

Write-Output $output.Trim()
