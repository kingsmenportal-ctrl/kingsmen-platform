param(
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Continue"

$repo = (Resolve-Path ".").Path
New-Item -ItemType Directory -Force -Path "reports\tools" | Out-Null

function Invoke-WithTimeout {
  param(
    [string]$Name,
    [scriptblock]$Block,
    [int]$TimeoutSeconds
  )

  $job = Start-Job -ScriptBlock $Block -ArgumentList $repo
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

$jarvis = Invoke-WithTimeout -Name "jarvis-wrapper" -TimeoutSeconds $TimeoutSeconds -Block {
  param($repo)
  Set-Location $repo
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\Invoke-KingsmenJarvis.ps1" -Prompt "Reply exactly: Jarvis boundary ready" -MaxTokens 30
}

$jarvis.passed = ($jarvis.output -match "Jarvis boundary ready")

$ollama = Invoke-WithTimeout -Name "ollama-wrapper" -TimeoutSeconds $TimeoutSeconds -Block {
  param($repo)
  Set-Location $repo
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\Invoke-KingsmenOllama.ps1" -Prompt "Reply exactly: Kingsmen local model ready"
}

$ollama.passed = ($ollama.output -match "Kingsmen local model ready")

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04"
  status = "TIMEOUT_SAFE_TEST_COMPLETED"
  generated_at = $started
  timeout_seconds = $TimeoutSeconds
  jarvis_direct_safe_mode = $jarvis
  ollama_direct_wrapper = $ollama
  all_passed = ($jarvis.passed -and $ollama.passed)
  production_authority = $false
  decision = "Jarvis and Ollama may only be used through controlled wrappers. Timeouts prevent local AI tests from trapping the founder."
}

$report | ConvertTo-Json -Depth 10 | Set-Content "reports\tools\jarvis-claw-local-wrapper-test.json"

@"
# TOOLS-JARVIS-CLAW-04 timeout-safe wrapper test

Generated: $started
Timeout seconds: $TimeoutSeconds

Jarvis passed: $($jarvis.passed)
Jarvis status: $($jarvis.status)

Ollama passed: $($ollama.passed)
Ollama status: $($ollama.status)

All passed: $($report.all_passed)

Boundary:
This does not make Jarvis/OpenClaw production authority.
PowerShell, validators, Git proof, and founder approval remain the authority.
"@ | Set-Content "reports\tools\jarvis-claw-local-wrapper-test.md"

Write-Host "Jarvis passed: $($jarvis.passed)"
Write-Host "Ollama passed: $($ollama.passed)"
Write-Host "All passed: $($report.all_passed)"
Write-Host "Report: reports\tools\jarvis-claw-local-wrapper-test.json"
