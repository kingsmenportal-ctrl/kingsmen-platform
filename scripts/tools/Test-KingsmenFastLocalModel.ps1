param(
  [int]$TimeoutSeconds = 45,
  [string]$Model = "qwen2.5:0.5b"
)

$ErrorActionPreference = "Continue"

New-Item -ItemType Directory -Force -Path "reports\tools" | Out-Null

function Invoke-ProcessTimeout {
  param(
    [string]$Name,
    [string]$FileName,
    [string[]]$Arguments,
    [int]$TimeoutSeconds
  )

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FileName

  foreach ($arg in $Arguments) {
    [void]$psi.ArgumentList.Add($arg)
  }

  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi

  $startedOk = $p.Start()

  if (-not $startedOk) {
    return [ordered]@{
      name = $Name
      status = "FAILED_TO_START"
      passed = $false
      seconds = 0
      output = ""
      error = "Process did not start."
    }
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $exited = $p.WaitForExit($TimeoutSeconds * 1000)
  $sw.Stop()

  if (-not $exited) {
    try { $p.Kill() } catch {}
    return [ordered]@{
      name = $Name
      status = "TIMEOUT"
      passed = $false
      seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
      output = "Timed out after $TimeoutSeconds seconds"
      error = ""
    }
  }

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()

  return [ordered]@{
    name = $Name
    status = "EXITED"
    exit_code = $p.ExitCode
    passed = ($stdout -match "\bREADY\b")
    seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
    output = $stdout.Trim()
    error = $stderr.Trim()
  }
}

$started = (Get-Date).ToString("s")

$ollama = Invoke-ProcessTimeout `
  -Name "ollama-fast-reply" `
  -FileName "ollama" `
  -Arguments @("run", $Model, "Reply exactly: READY") `
  -TimeoutSeconds $TimeoutSeconds

$jarvis = Invoke-ProcessTimeout `
  -Name "jarvis-fast-reply" `
  -FileName "jarvis" `
  -Arguments @("ask", "--no-stream", "--no-context", "--agent=", "--engine", "ollama", "--model", $Model, "--max-tokens", "8", "Reply exactly: READY") `
  -TimeoutSeconds $TimeoutSeconds

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04F"
  status = "FAST_LOCAL_MODEL_TEST_COMPLETED"
  generated_at = $started
  timeout_seconds = $TimeoutSeconds
  selected_model = $Model
  ollama_fast_reply = $ollama
  jarvis_fast_reply = $jarvis
  usable_fast_local_route = if ($ollama.passed) { "ollama_direct" } elseif ($jarvis.passed) { "jarvis_direct_safe_mode" } else { "none" }
  all_passed = ($ollama.passed -and $jarvis.passed)
  production_authority = $false
  decision = if ($ollama.passed) {
    "Use qwen2.5:0.5b through controlled wrappers for small Kingsmen local helper tasks. Keep larger reasoning in ChatGPT/Codex until a better local model is proven."
  } else {
    "Local fast model is still not proven. Do not rely on Jarvis or OpenClaw for Kingsmen reasoning yet."
  }
}

$report | ConvertTo-Json -Depth 10 | Set-Content "reports\tools\jarvis-claw-fast-local-model-test.json"

@"
# TOOLS-JARVIS-CLAW-04F Fast Local Model Test

Generated: $started

Selected model: $Model
Timeout seconds: $TimeoutSeconds

Ollama passed: $($ollama.passed)
Ollama status: $($ollama.status)
Ollama seconds: $($ollama.seconds)

Jarvis passed: $($jarvis.passed)
Jarvis status: $($jarvis.status)
Jarvis seconds: $($jarvis.seconds)

Usable fast local route: $($report.usable_fast_local_route)

Boundary:
This proves only small local helper response capability.
It does not make Jarvis, Ollama, or OpenClaw production authority.
"@ | Set-Content "reports\tools\jarvis-claw-fast-local-model-test.md"

Write-Host "Ollama passed: $($ollama.passed)"
Write-Host "Ollama status: $($ollama.status)"
Write-Host "Ollama seconds: $($ollama.seconds)"
Write-Host "Jarvis passed: $($jarvis.passed)"
Write-Host "Jarvis status: $($jarvis.status)"
Write-Host "Jarvis seconds: $($jarvis.seconds)"
Write-Host "Usable route: $($report.usable_fast_local_route)"
Write-Host "Report: reports\tools\jarvis-claw-fast-local-model-test.json"
