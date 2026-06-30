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
  $out = @(& $Command 2>&1)
  $code = $LASTEXITCODE
  $out | Tee-Object -FilePath (Join-Path $proofDir "$Name.log")
  if ($code -ne 0 -and $null -ne $code) {
    throw "$Name failed with exit code $code"
  }
  return $out
}

function Extract-Urls {
  param([object[]]$Lines)
  $text = ($Lines | Out-String)
  return @([regex]::Matches($text, 'https?://[^\s\]\)\}"'']+') | ForEach-Object { $_.Value.TrimEnd('.', ',', ';') } | Sort-Object -Unique)
}

if (!(Test-Path ".\scripts\validators\validate-jarvis-v5-script-library-01-to-38.mjs")) {
  throw "Missing final Jarvis V5 validator. Restore latest repo files before deployment."
}

$validatorOutput = Save-Step "01-jarvis-v5-01-to-38-validator" { node .\scripts\validators\validate-jarvis-v5-script-library-01-to-38.mjs }
$installOutput = Save-Step "02-web-install" { npm --prefix apps/web install }
$buildOutput = Save-Step "03-web-build" { npm --prefix apps/web run build }
$statusOutput = Save-Step "04-netlify-status" { npx -y netlify status }
$deployOutput = Save-Step "05-netlify-production-deploy" { npx -y netlify deploy --build --prod }

$deployUrls = Extract-Urls $deployOutput
$statusUrls = Extract-Urls $statusOutput
$allUrls = @($statusUrls + $deployUrls | Sort-Object -Unique)

$proof = [ordered]@{
  status = "completed"
  createdAt = (Get-Date).ToString("o")
  repo = (git remote get-url origin)
  branch = (git branch --show-current)
  commit = (git rev-parse HEAD)
  validatorReport = "reports/jarvis/v5-script-library-01-to-38-final-closeout-latest.json"
  proofDir = $proofDir
  logs = [ordered]@{
    validator = "01-jarvis-v5-01-to-38-validator.log"
    webInstall = "02-web-install.log"
    webBuild = "03-web-build.log"
    netlifyStatus = "04-netlify-status.log"
    netlifyProductionDeploy = "05-netlify-production-deploy.log"
  }
  detectedUrls = $allUrls
  productionDeployUrls = $deployUrls
  productionProofStatus = if ($deployUrls.Count -gt 0) { "netlify_deploy_output_contains_url" } else { "deploy_finished_but_no_url_detected_in_output" }
  proofBoundary = "Production is proven only when Netlify reports successful production deployment and a reachable live URL is present in the deploy log."
}

$proofPath = Join-Path $proofDir "jarvis-v5-live-deploy-proof.json"
$proof | ConvertTo-Json -Depth 10 | Set-Content -Path $proofPath -Encoding UTF8
Write-Host "=== PROOF WRITTEN ===" -ForegroundColor Green
Write-Host $proofPath -ForegroundColor Green
if ($deployUrls.Count -gt 0) {
  Write-Host "=== DETECTED PRODUCTION URLS ===" -ForegroundColor Green
  $deployUrls | ForEach-Object { Write-Host $_ -ForegroundColor Green }
} else {
  Write-Host "=== NO DEPLOY URL DETECTED IN OUTPUT; REVIEW NETLIFY LOG ===" -ForegroundColor Yellow
}
