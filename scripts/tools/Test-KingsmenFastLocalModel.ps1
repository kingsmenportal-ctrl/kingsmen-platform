param(
  [int]$TimeoutSeconds = 90,
  [string]$Model = "qwen2.5:0.5b"
)

$ErrorActionPreference = "Continue"

New-Item -ItemType Directory -Force -Path "reports\tools" | Out-Null

function Quote-Arg {
  param([string]$Arg)

  if ($null -eq $Arg) { return '""' }

  if ($Arg -notmatch '[\s"]') {
    return $Arg
  }

  return '"' + ($Arg -replace '\\(?=")', '\\' -replace '"', '\"') + '"'
}

function Resolve-CommandPath {
  param([string]$CommandName)

  $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue

  if ($null -eq $cmd) {
    return $null
  }

  if ($cmd.Source) {
    return $cmd.Source
  }

  if ($cmd.Path) {
    return $cmd.Path
  }

  return $null
}

function Invoke-ProcessTimeout {
  param(
    [string]$Name,
    [string]$CommandName,
    [string[]]$Arguments,
    [int]$TimeoutSeconds
  )

  $resolvedPath = Resolve-CommandPath $CommandName

  if (-not $resolvedPath) {
    return [ordered]@{
      name = $Name
      command = $CommandName
      resolved_path = $null
      status = "COMMAND_NOT_FOUND"
      passed = $false
      seconds = 0
      output = ""
      error = "Command was not found on PATH."
    }
  }

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $resolvedPath
  $psi.Arguments = (($Arguments | ForEach-Object { Quote-Arg $_ }) -join " ")
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.WorkingDirectory = (Resolve-Path ".").Path

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi

  $sw = [System.Diagnostics.Stopwatch]::StartNew()

  try {
    $startedOk = $p.Start()
  } catch {
    $sw.Stop()
    return [ordered]@{
      name = $Name
      command = $CommandName
      resolved_path = $resolvedPath
      status = "FAILED_TO_START"
      passed = $false
      seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
      output = ""
      error = $_.Exception.Message
    }
  }

  if (-not $startedOk) {
    $sw.Stop()
    return [ordered]@{
      name = $Name
      command = $CommandName
      resolved_path = $resolvedPath
      status = "FAILED_TO_START"
      passed = $false
      seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
      output = ""
      error = "Process did not start."
    }
  }

  $exited = $p.WaitForExit($TimeoutSeconds * 1000)
  $sw.Stop()

  if (-not $exited) {
    try { $p.Kill() } catch {}

    return [ordered]@{
      name = $Name
      command = $CommandName
      resolved_path = $resolvedPath
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
    command = $CommandName
    resolved_path = $resolvedPath
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
  -CommandName "ollama" `
  -Arguments @("run", $Model, "Reply exactly: READY") `
  -TimeoutSeconds $TimeoutSeconds

$jarvis = Invoke-ProcessTimeout `
  -Name "jarvis-fast-reply" `
  -CommandName "jarvis" `
  -Arguments @("ask", "--no-stream", "--no-context", "--agent=", "--engine", "ollama", "--model", $Model, "--max-tokens", "8", "Reply exactly: READY") `
  -TimeoutSeconds $TimeoutSeconds

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04G"
  status = "FAST_LOCAL_MODEL_TEST_COMPLETED_WITH_FIXED_PROCESS_RUNNER"
  generated_at = $started
  timeout_seconds = $TimeoutSeconds
  selected_model = $Model
  previous_04f_result = "FAILED_SCRIPT_BUG_NOT_MODEL_PROOF"
  ollama_fast_reply = $ollama
  jarvis_fast_reply = $jarvis
  usable_fast_local_route = if ($ollama.passed) { "ollama_direct" } elseif ($jarvis.passed) { "jarvis_direct_safe_mode" } else { "none" }
  all_passed = ($ollama.passed -and $jarvis.passed)
  production_authority = $false
  decision = if ($ollama.passed) {
    "Use qwen2.5:0.5b through controlled Ollama wrapper for small Kingsmen helper tasks. Jarvis/OpenClaw remain helper tools only."
  } else {
    "Fast local route is still not proven. Keep Jarvis/OpenClaw experimental."
  }
}

$report | ConvertTo-Json -Depth 10 | Set-Content "reports\tools\jarvis-claw-fast-local-model-test-04g.json"

@"
# TOOLS-JARVIS-CLAW-04G Fast Local Model Test

Generated: $started

Selected model: $Model
Timeout seconds: $TimeoutSeconds

Previous 04F result:
Failed because the process runner was broken, not because qwen2.5:0.5b was disproven.

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
"@ | Set-Content "reports\tools\jarvis-claw-fast-local-model-test-04g.md"

Write-Host "Ollama passed: $($ollama.passed)"
Write-Host "Ollama status: $($ollama.status)"
Write-Host "Ollama seconds: $($ollama.seconds)"
Write-Host "Jarvis passed: $($jarvis.passed)"
Write-Host "Jarvis status: $($jarvis.status)"
Write-Host "Jarvis seconds: $($jarvis.seconds)"
Write-Host "Usable route: $($report.usable_fast_local_route)"
Write-Host "Report: reports\tools\jarvis-claw-fast-local-model-test-04g.json"
