param(
  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$PromptParts
)

$repo = "C:\Kingsmen\kingsmen-platform"
$prompt = ($PromptParts -join " ").Trim()

if ([string]::IsNullOrWhiteSpace($prompt)) {
  Write-Host "Usage: kingsmen-ai-smart `"your safe Kingsmen task`"" -ForegroundColor Yellow
  exit 1
}

powershell -NoProfile -ExecutionPolicy Bypass -File "$repo\scripts\tools\Invoke-KingsmenLocalHelper.ps1" `
  -Prompt $prompt `
  -TimeoutSeconds 300 `
  -MaxTokens 350 `
  -Model "qwen3.5:2b"
