function kingsmen-ai {
  param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$PromptParts
  )

  $repo = "C:\Kingsmen\kingsmen-platform"
  powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\kingsmen-ai.ps1" @PromptParts
}

Write-Host "Kingsmen AI command registered for this PowerShell session." -ForegroundColor Green
Write-Host "Try: kingsmen-ai `"reply exactly: Kingsmen helper ready`"" -ForegroundColor Cyan
