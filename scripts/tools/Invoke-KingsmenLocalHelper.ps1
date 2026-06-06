param(
  [Parameter(Mandatory=$true)]
  [string]$Prompt,

  [int]$TimeoutSeconds = 180,
  [int]$MaxTokens = 180,
  [string]$Model = "qwen2.5:0.5b"
)

$ErrorActionPreference = "Continue"

function Quote-Arg {
  param([string]$Arg)

  if ($null -eq $Arg) {
    return '""'
  }

  $s = [string]$Arg

  if ($s.Length -eq 0) {
    return '""'
  }

  $s = $s -replace '"', '\"'
  return '"' + $s + '"'
}

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

$task = "$boundary`r`n`r`nFounder task:`r`n$Prompt"

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

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $jarvisPath
$psi.Arguments = (($argsList | ForEach-Object { Quote-Arg ([string]$_) }) -join " ")
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.WorkingDirectory = (Resolve-Path ".").Path

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $psi

$startedOk = $false

try {
  $startedOk = $p.Start()
} catch {
  Write-Host "ERROR: failed to start Jarvis." -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}

if (-not $startedOk) {
  Write-Host "ERROR: Jarvis did not start." -ForegroundColor Red
  exit 1
}

$exited = $p.WaitForExit($TimeoutSeconds * 1000)

if (-not $exited) {
  try { $p.Kill() } catch {}
  Write-Host "TIMEOUT: Kingsmen local helper did not respond inside $TimeoutSeconds seconds." -ForegroundColor Red
  exit 124
}

$stdout = $p.StandardOutput.ReadToEnd()
$stderr = $p.StandardError.ReadToEnd()

if (-not [string]::IsNullOrWhiteSpace($stderr)) {
  Write-Host $stderr.Trim() -ForegroundColor DarkYellow
}

Write-Output $stdout.Trim()
exit $p.ExitCode
