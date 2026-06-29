$ErrorActionPreference = "Stop"

Write-Host "=== KINGSMEN JARVIS V5 LIVE DEPLOY PROOF ===" -ForegroundColor Cyan

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$proofDir = Join-Path $repoRoot "reports\jarvis\live-deploy-$stamp"
New-Item -ItemType Directory -Force -Path $proofDir | Out-Null

function Save-Step {
  param([string]$Name, [scriptblock]$Command)
  Write-Host "=== $Name ===" -ForegroundColor Cyan
  $out = & $Command 2>&1
  $code = $LASTEXITCODE
  $out | Tee-Object -FilePath (Join-Path $proofDir "$Name.log")
  if ($code -ne 0 -and $null -ne $code) {
    throw "$Name failed with exit code $code"
  }
}

if (!(Test-Path ".\scripts\validators\validate-jarvis-v5-script-library-01-to-38.mjs")) {
  throw "Missing final Jarvis V5 validator. Restore latest repo files before deployment."
}

Save-Step "01-jarvis-v5-01-to-38-validator" { node .\scripts\validators\validate-jarvis-v5-script-library-01-to-38.mjs }
Save-Step "02-web-install" { npm --prefix apps/web install }
Save-Step "03-web-build" { npm --prefix apps/web run build }
Save-Step "04-netlify-status" { npx netlify status }
Save-Step "05-netlify-production-deploy" { npx netlify deploy --build --prod }

$proof = [ordered]@{
  status = "completed"
  createdAt = (Get-Date).ToString("o")
  repo = (git remote get-url origin)
  branch = (git branch --show-current)
  commit = (git rev-parse HEAD)
  validator = "reports/jarvis/v5-script-library-01-to-38-final-closeout-latest.json"
  proofDir = $proofDir
  steps = @(
    "01-jarvis-v5-01-to-38-validator",
    "02-web-install",
    "03-web-build",
    "04-netlify-status",
    "05-netlify-production-deploy"
  )
  productionProofBoundary = "Production is proven only if the Netlify deploy log contains a live production URL and successful deploy completion."
}

$proof | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $proofDir "jarvis-v5-live-deploy-proof.json") -Encoding UTF8
Write-Host "=== PROOF WRITTEN ===" -ForegroundColor Green
Write-Host (Join-Path $proofDir "jarvis-v5-live-deploy-proof.json") -ForegroundColor Green
