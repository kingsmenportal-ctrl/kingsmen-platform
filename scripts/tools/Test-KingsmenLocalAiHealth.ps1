$ErrorActionPreference = "Continue"

New-Item -ItemType Directory -Force -Path reports\tools | Out-Null

$started = (Get-Date).ToString("s")

function Cmd-Result {
  param([string]$Name, [scriptblock]$Block)

  try {
    $out = & $Block 2>&1 | Out-String
    return [ordered]@{
      name = $Name
      exit = $LASTEXITCODE
      passed = ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE)
      output = $out.Trim()
    }
  } catch {
    return [ordered]@{
      name = $Name
      exit = -1
      passed = $false
      output = $_.Exception.Message
    }
  }
}

$jarvisPath = "$env:LOCALAPPDATA\OpenJarvis\src\.venv\Scripts\jarvis.exe"
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
$openclawCmd = Get-Command openclaw -ErrorAction SilentlyContinue

$jarvisExists = Test-Path $jarvisPath
$ollamaExists = ($null -ne $ollamaCmd)
$openclawExists = ($null -ne $openclawCmd)

$ollamaList = Cmd-Result "ollama-list" { ollama list }
$openclawValidate = Cmd-Result "openclaw-config-validate" { openclaw config validate }

$modelInstalled = ($ollamaList.output -match "qwen3.5:2b")

$report = [ordered]@{
  module = "TOOLS-JARVIS-CLAW-04D"
  status = "LOCAL_AI_HEALTH_CHECK_COMPLETED"
  generated_at = $started
  jarvis = [ordered]@{
    path = $jarvisPath
    exists = $jarvisExists
  }
  ollama = [ordered]@{
    command_exists = $ollamaExists
    qwen35_2b_installed = $modelInstalled
    list_result = $ollamaList
  }
  openclaw = [ordered]@{
    command_exists = $openclawExists
    config_validate_result = $openclawValidate
  }
  ai_generation_tested = $false
  production_authority = $false
  decision = "This confirms local AI tool availability only. It does not prove Jarvis/OpenClaw reasoning quality or production authority."
}

$report.all_health_passed = (
  $jarvisExists -and
  $ollamaExists -and
  $modelInstalled -and
  $openclawExists -and
  $openclawValidate.passed
)

$report | ConvertTo-Json -Depth 10 | Set-Content reports\tools\jarvis-claw-local-ai-health.json

@"
# TOOLS-JARVIS-CLAW-04D Local AI Health

Generated: $started

Jarvis exists: $jarvisExists
Ollama exists: $ollamaExists
qwen3.5:2b installed: $modelInstalled
OpenClaw exists: $openclawExists
OpenClaw config valid: $($openclawValidate.passed)

All health passed: $($report.all_health_passed)

Boundary:
This proves tool availability only.
It does not make Jarvis/OpenClaw production authority.
"@ | Set-Content reports\tools\jarvis-claw-local-ai-health.md

Write-Host "Jarvis exists: $jarvisExists"
Write-Host "Ollama exists: $ollamaExists"
Write-Host "qwen3.5:2b installed: $modelInstalled"
Write-Host "OpenClaw exists: $openclawExists"
Write-Host "OpenClaw config valid: $($openclawValidate.passed)"
Write-Host "All health passed: $($report.all_health_passed)"
