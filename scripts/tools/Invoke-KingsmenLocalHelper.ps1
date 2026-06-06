param(
  [Parameter(Mandatory=$true)]
  [string]$Prompt,

  [int]$TimeoutSeconds = 300,
  [int]$MaxTokens = 250,
  [string]$Model = "qwen3.5:2b"
)

$ErrorActionPreference = "Continue"

function Quote-Arg {
  param([string]$Arg)

  if ($null -eq $Arg) { return '""' }

  $s = [string]$Arg
  if ($s.Length -eq 0) { return '""' }

  $s = $s -replace '"', '\"'
  return '"' + $s + '"'
}

$task = @"
You are Kingsmen Local Helper.

IMPORTANT:
Kingsmen means the real Kingsmen platform in C:\Kingsmen\kingsmen-platform.
Kingsmen is NOT a movie, NOT fiction, NOT a kingdom, NOT a roleplay setting.

Kingsmen is a South African opportunity, education, application, employment, SETA, TVET, university, bursary, partner, document, proof, founder-control, Jarvis, OpenClaw, GitHub, PowerShell, Oracle Lite project.

Your allowed work:
- summarize proof reports
- explain current tool status
- suggest the next safe command
- review docs, manifests, and reports
- help with Jarvis/OpenClaw/PowerShell/Git proof discipline

Your blocked work:
- no secrets
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
- no production actions

Answer rules:
- no roleplay
- no jokes
- no fiction
- no generic assistant greeting
- answer the founder task directly
- if blocked, say exactly: Blocked by Kingsmen boundary. Founder approval and validator proof required.

Founder task:
$Prompt
"@

$jarvisCmd = Get-Command jarvis -ErrorAction SilentlyContinue

if ($null -eq $jarvisCmd) {
  Write-Host "ERROR: jarvis command not found." -ForegroundColor Red
  exit 127
}

$jarvisPath = $jarvisCmd.Source
if ([string]::IsNullOrWhiteSpace($jarvisPath)) {
  $jarvisPath = $jarvisCmd.Path
}

$argsList = @(
  "ask",
  "--no-stream",
  "--no-context",
  "--agent=",
  "--engine",
  "ollama",
  "--model",
  $Model,
  "--max-tokens",
  [string]$MaxTokens,
  $task
)

$tempOut = [System.IO.Path]::GetTempFileName()
$tempErr = [System.IO.Path]::GetTempFileName()

$argString = (($argsList | ForEach-Object { Quote-Arg ([string]$_) }) -join " ")

$p = Start-Process `
  -FilePath $jarvisPath `
  -ArgumentList $argString `
  -NoNewWindow `
  -PassThru `
  -RedirectStandardOutput $tempOut `
  -RedirectStandardError $tempErr `
  -WorkingDirectory (Resolve-Path ".").Path

$exited = $p.WaitForExit($TimeoutSeconds * 1000)

if (-not $exited) {
  try { $p.Kill() } catch {}
  Write-Host "TIMEOUT: Kingsmen local helper did not respond inside $TimeoutSeconds seconds." -ForegroundColor Red
  exit 124
}

$stdout = Get-Content $tempOut -Raw -ErrorAction SilentlyContinue
$stderr = Get-Content $tempErr -Raw -ErrorAction SilentlyContinue

Remove-Item $tempOut, $tempErr -Force -ErrorAction SilentlyContinue

if (-not [string]::IsNullOrWhiteSpace($stderr)) {
  Write-Host $stderr.Trim() -ForegroundColor DarkYellow
}

Write-Output $stdout.Trim()
exit $p.ExitCode
