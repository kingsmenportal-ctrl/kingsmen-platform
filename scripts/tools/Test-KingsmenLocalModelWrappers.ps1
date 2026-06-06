$ErrorActionPreference = "Continue"

New-Item -ItemType Directory -Force -Path reports\tools | Out-Null

$started = (Get-Date).ToString("s")

$jarvisOutput = powershell -ExecutionPolicy Bypass -File scripts\tools\Invoke-KingsmenJarvis.ps1 -Prompt "Reply exactly: Jarvis boundary ready" -MaxTokens 30 2>&1 | Out-String

$ollamaOutput = powershell -ExecutionPolicy Bypass -File scripts\tools\Invoke-KingsmenOllama.ps1 -Prompt "Reply exactly: Kingsmen local model ready" 2>&1 | Out-String

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04"
  status = "LOCAL_MODEL_WRAPPERS_TESTED"
  generated_at = $started
  jarvis_direct_safe_mode = [ordered]@{
    command = "scripts/tools/Invoke-KingsmenJarvis.ps1"
    expected = "Jarvis boundary ready"
    passed = ($jarvisOutput -match "Jarvis boundary ready")
  }
  ollama_direct_wrapper = [ordered]@{
    command = "scripts/tools/Invoke-KingsmenOllama.ps1"
    expected = "Kingsmen local model ready"
    passed = ($ollamaOutput -match "Kingsmen local model ready")
  }
  blocked_agents = @(
    "baseline_local until local.model and local.endpoint are configured",
    "normal jarvis ask without safe flags"
  )
  decision = "Use Invoke-KingsmenJarvis.ps1 as the preferred local Jarvis wrapper. Use Invoke-KingsmenOllama.ps1 as backup."
}

$raw = @"
=== JARVIS OUTPUT ===
$jarvisOutput

=== OLLAMA OUTPUT ===
$ollamaOutput
"@

$report | ConvertTo-Json -Depth 10 | Set-Content reports\tools\jarvis-claw-local-wrapper-test.json
$raw | Set-Content reports\tools\jarvis-claw-local-wrapper-test-output.txt

Write-Host "Jarvis wrapper passed: $($report.jarvis_direct_safe_mode.passed)"
Write-Host "Ollama wrapper passed: $($report.ollama_direct_wrapper.passed)"
Write-Host "Report: reports\tools\jarvis-claw-local-wrapper-test.json"
