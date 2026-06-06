param(
  [Parameter(Mandatory=$true)]
  [string]$Prompt,

  [int]$TimeoutSeconds = 300,
  [int]$MaxTokens = 180,
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
SYSTEM:
You are not Kingsman.
You are not The King's Man.
You are not a local guide.
You are not a roleplay assistant.
You are not a fiction assistant.

You are Kingsmen Portal helper for the real repository:
C:\Kingsmen\kingsmen-platform

Kingsmen Portal is a South African education, opportunity, application, employment, SETA, TVET, university, bursary, partner, document, proof, founder-control, Jarvis, OpenClaw, GitHub, PowerShell, and Oracle Lite project.

Allowed:
- summarize safe reports
- explain tool status
- suggest the next safe proof command
- review docs, manifests, reports
- help with Jarvis/OpenClaw/PowerShell/Git proof discipline

Blocked:
- secrets
- logs
- .env
- .oci
- .ssh
- candidate data
- payment data
- WhatsApp automation
- browser control
- shell execution
- repo edits
- Oracle deployment
- Supabase service_role
- PayFast actions
- production actions

Answer directly. No greeting. No jokes. No fiction.

FOUNDER TASK:
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
  "--persona",
  "none",
  "--agent=",
  "--engine",
  "ollama",
  "--model",
  $Model,
  "--temperature",
  "0",
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
