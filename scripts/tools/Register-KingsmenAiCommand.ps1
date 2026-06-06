function kingsmen-ai {
  param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$PromptParts
  )

  $repo = "C:\Kingsmen\kingsmen-platform"
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\kingsmen-ai.ps1" @PromptParts
}

function kingsmen-ai-fast {
  param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$PromptParts
  )

  $repo = "C:\Kingsmen\kingsmen-platform"
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\kingsmen-ai-fast.ps1" @PromptParts
}

function kingsmen-ai-smart {
  param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$PromptParts
  )

  $repo = "C:\Kingsmen\kingsmen-platform"
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\kingsmen-ai-smart.ps1" @PromptParts
}

function kingsmen-claw-check {
  $repo = "C:\Kingsmen\kingsmen-platform"
  Set-Location $repo

  Write-Host "=== OpenClaw config validate ===" -ForegroundColor Cyan
  openclaw config validate

  Write-Host "`n=== OpenClaw security audit ===" -ForegroundColor Cyan
  openclaw security audit --deep

  Write-Host "`n=== OpenClaw secrets audit ===" -ForegroundColor Cyan
  openclaw secrets audit --check
}

Write-Host "Kingsmen AI commands registered for this PowerShell session." -ForegroundColor Green
Write-Host "Available: kingsmen-ai, kingsmen-ai-fast, kingsmen-ai-smart, kingsmen-claw-check" -ForegroundColor Cyan
