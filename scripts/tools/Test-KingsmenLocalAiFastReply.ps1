param(
  [int]$TimeoutSeconds = 25
)

$ErrorActionPreference = "Continue"

$repo = (Resolve-Path ".").Path
New-Item -ItemType Directory -Force -Path "reports\tools" | Out-Null

function Invoke-TimeoutTest {
  param(
    [string]$Name,
    [scriptblock]$Block,
    [object[]]$ArgsList,
    [int]$TimeoutSeconds
  )

  $job = Start-Job -ScriptBlock $Block -ArgumentList $ArgsList
  $done = Wait-Job $job -Timeout $TimeoutSeconds

  if ($null -eq $done) {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue

    return [ordered]@{
      name = $Name
      status = "TIMEOUT"
      passed = $false
      output = "Timed out after $TimeoutSeconds seconds"
    }
  }

  $output = Receive-Job $job -ErrorAction SilentlyContinue | Out-String
  $state = $job.State
  Remove-Job $job -Force -ErrorAction SilentlyContinue

  return [ordered]@{
    name = $Name
    status = $state
    passed = $false
    output = $output.Trim()
  }
}

$started = (Get-Date).ToString("s")

$jarvis = Invoke-TimeoutTest `
  -Name "jarvis-fast-reply" `
  -TimeoutSeconds $TimeoutSeconds `
  -ArgsList @($repo) `
  -Block {
    param($repo)
    Set-Location $repo
    jarvis ask --no-stream --no-context --agent= --engine ollama --model qwen3.5:2b --max-tokens 8 "Reply exactly: READY"
  }

$jarvis.passed = ($jarvis.output -match "\bREADY\b")

$ollama = Invoke-TimeoutTest `
  -Name "ollama-fast-reply" `
  -TimeoutSeconds $TimeoutSeconds `
  -ArgsList @($repo) `
  -Block {
    param($repo)
    Set-Location $repo
    ollama run qwen3.5:2b "Reply exactly: READY"
  }

$ollama.passed = ($ollama.output -match "\bREADY\b")

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04E"
  status = "FAST_REPLY_TEST_COMPLETED"
  generated_at = $started
  timeout_seconds = $TimeoutSeconds
  jarvis_fast_reply = $jarvis
  ollama_fast_reply = $ollama
  all_passed = ($jarvis.passed -and $ollama.passed)
  production_authority = $false
  decision = "This tests fast local AI response only. It does not make Jarvis, Ollama, or OpenClaw a production authority."
  next_action = if ($jarvis.passed -or $ollama.passed) {
    "Create the small Kingsmen task wrapper using the passing local route."
  } else {
    "Use a smaller local model or reduce prompt size further before using local AI heavily."
  }
}

$report | ConvertTo-Json -Depth 10 | Set-Content "reports\tools\jarvis-claw-fast-reply-test.json"

@"
# TOOLS-JARVIS-CLAW-04E Fast Reply Test

Generated: $started
Timeout seconds: $TimeoutSeconds

Jarvis passed: $($jarvis.passed)
Jarvis status: $($jarvis.status)

Ollama passed: $($ollama.passed)
Ollama status: $($ollama.status)

All passed: $($report.all_passed)

Boundary:
This proves fast local AI reply only.
It does not make Jarvis, Ollama, or OpenClaw production authority.

Next action:
$($report.next_action)
"@ | Set-Content "reports\tools\jarvis-claw-fast-reply-test.md"

Write-Host "Jarvis passed: $($jarvis.passed)"
Write-Host "Jarvis status: $($jarvis.status)"
Write-Host "Ollama passed: $($ollama.passed)"
Write-Host "Ollama status: $($ollama.status)"
Write-Host "All passed: $($report.all_passed)"
Write-Host "Report: reports\tools\jarvis-claw-fast-reply-test.json"
