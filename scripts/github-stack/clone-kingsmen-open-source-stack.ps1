<#
.SYNOPSIS
  Clones the approved Kingsmen external GitHub research stack into external/github-stack.

.DESCRIPTION
  This script does not vendor third-party code into Kingsmen. It creates local research clones only
  unless -Mode submodule is explicitly selected after license/security approval.

  Default output:
    external/github-stack/<group>/<repo-slug>/
    reports/github-stack/clone-report.local.json
    reports/github-stack/clone-report.local.csv

  Kingsmen law:
    - Backend remains source of truth.
    - Jarvis is a commander, not sovereign truth.
    - Browser agents are scouts only.
    - CAPTCHA/OTP/payment/blocked portal => MAP/manual fallback.
    - License review required before production integration.

.EXAMPLE
  pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group all

.EXAMPLE
  pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group voice

.EXAMPLE
  pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group p0 -DryRun
#>

[CmdletBinding()]
param(
  [ValidateSet('clone','submodule')]
  [string]$Mode = 'clone',

  [string]$Group = 'all',

  [string]$Root = 'external/github-stack',

  [switch]$DryRun,

  [switch]$SkipExisting = $true
)

$ErrorActionPreference = 'Stop'

function New-SafeName {
  param([Parameter(Mandatory=$true)][string]$Repo)
  return ($Repo -replace '[^A-Za-z0-9._-]', '__')
}

$stack = @(
  # P0 immediate Kingsmen upgrades
  @{ group='p0'; sub='document'; repo='DS4SD/docling'; url='https://github.com/DS4SD/docling.git'; decision='ADOPT_NOW'; use='Smart CV/document intake extraction'; boundary='Candidate/operator confirmation required' },
  @{ group='p0'; sub='document'; repo='Unstructured-IO/unstructured'; url='https://github.com/Unstructured-IO/unstructured.git'; decision='ADOPT_NEXT'; use='Backup document ETL and comparison'; boundary='Never replaces verified document ledger' },
  @{ group='p0'; sub='browser'; repo='microsoft/playwright'; url='https://github.com/microsoft/playwright.git'; decision='ADOPT_NOW'; use='Portal/source probing and MAP evidence'; boundary='No OTP/CAPTCHA/payment bypass' },
  @{ group='p0'; sub='browser'; repo='microsoft/playwright-mcp'; url='https://github.com/microsoft/playwright-mcp.git'; decision='ADOPT_NEXT'; use='MCP browser scout interface'; boundary='Sandboxed allowlisted domains only' },
  @{ group='p0'; sub='browser'; repo='browserbase/stagehand'; url='https://github.com/browserbase/stagehand.git'; decision='ADOPT_NEXT'; use='Natural-language Playwright reference'; boundary='Route Safety gates required' },
  @{ group='p0'; sub='browser'; repo='browser-use/browser-use'; url='https://github.com/browser-use/browser-use.git'; decision='LAB_ONLY'; use='Browser agent reference patterns'; boundary='Not production submitter' },
  @{ group='p0'; sub='browser'; repo='Skyvern-AI/skyvern'; url='https://github.com/Skyvern-AI/skyvern.git'; decision='LAB_ONLY'; use='Advanced form workflow reference'; boundary='License/security quarantine' },
  @{ group='p0'; sub='voice'; repo='dscripka/openWakeWord'; url='https://github.com/dscripka/openWakeWord.git'; decision='ADOPT_NOW'; use='Hey Jarvis wake word'; boundary='Local microphone boundary only' },
  @{ group='p0'; sub='voice'; repo='ggml-org/whisper.cpp'; url='https://github.com/ggml-org/whisper.cpp.git'; decision='ADOPT_NOW'; use='Local Jarvis speech-to-text'; boundary='Do not store raw candidate recordings by default' },
  @{ group='p0'; sub='voice'; repo='OHF-Voice/piper1-gpl'; url='https://github.com/OHF-Voice/piper1-gpl.git'; decision='ADOPT_NEXT'; use='Local Jarvis text-to-speech'; boundary='License review required' },
  @{ group='p0'; sub='observability'; repo='langfuse/langfuse'; url='https://github.com/langfuse/langfuse.git'; decision='ADOPT_NOW'; use='AI/Jarvis tracing and prompt audit'; boundary='Redact secrets and sensitive docs' },
  @{ group='p0'; sub='workflow'; repo='n8n-io/n8n'; url='https://github.com/n8n-io/n8n.git'; decision='ALREADY_ALLOWED'; use='Thin stateless workers'; boundary='One Airtable write plus one backend result POST' },

  # P1 Jarvis brain and coding/build references
  @{ group='p1'; sub='agent'; repo='openai/openai-agents-python'; url='https://github.com/openai/openai-agents-python.git'; decision='ADOPT_NEXT'; use='Python Jarvis sidecar/tool calling patterns'; boundary='Command envelope required' },
  @{ group='p1'; sub='agent'; repo='langchain-ai/langgraph'; url='https://github.com/langchain-ai/langgraph.git'; decision='ADOPT_NEXT'; use='Stateful human-in-loop agent workflows'; boundary='Not backend state machine replacement' },
  @{ group='p1'; sub='agent'; repo='langchain-ai/langgraphjs'; url='https://github.com/langchain-ai/langgraphjs.git'; decision='ADOPT_NOW'; use='TypeScript Jarvis command graph reference'; boundary='Must call backend command bus' },
  @{ group='p1'; sub='agent'; repo='microsoft/agent-framework'; url='https://github.com/microsoft/agent-framework.git'; decision='WATCH'; use='Enterprise agent governance/checkpointing reference'; boundary='Reference first' },
  @{ group='p1'; sub='agent'; repo='microsoft/semantic-kernel'; url='https://github.com/microsoft/semantic-kernel.git'; decision='WATCH'; use='Agent planning/connectors reference'; boundary='Avoid duplicate orchestration layer' },
  @{ group='p1'; sub='agent'; repo='crewAIInc/crewAI'; url='https://github.com/crewAIInc/crewAI.git'; decision='LAB_ONLY'; use='Multi-agent comparison'; boundary='No swarm core' },
  @{ group='p1'; sub='agent'; repo='microsoft/magentic-ui'; url='https://github.com/microsoft/magentic-ui.git'; decision='LAB_ONLY'; use='Human-supervised web agent research'; boundary='Lab only' },
  @{ group='p1'; sub='builder'; repo='OpenHands/OpenHands-Cloud'; url='https://github.com/OpenHands/OpenHands-Cloud.git'; decision='LAB_ONLY'; use='Repo-building agent workflow reference'; boundary='No autonomous production writes' },
  @{ group='p1'; sub='builder'; repo='paul-gauthier/aider'; url='https://github.com/paul-gauthier/aider.git'; decision='LAB_ONLY'; use='Local pair-programming helper'; boundary='Human-reviewed commits only' },
  @{ group='p1'; sub='builder'; repo='continuedev/continue'; url='https://github.com/continuedev/continue.git'; decision='LAB_ONLY'; use='IDE assistant reference'; boundary='No secrets in context' },

  # P2 knowledge/RAG/source confidence
  @{ group='p2'; sub='rag'; repo='run-llama/llama_index'; url='https://github.com/run-llama/llama_index.git'; decision='ADOPT_NEXT'; use='Source-backed institutional knowledge retrieval'; boundary='Facts require source confidence' },
  @{ group='p2'; sub='rag'; repo='langchain-ai/langchain'; url='https://github.com/langchain-ai/langchain.git'; decision='WATCH'; use='Loaders/tool ecosystem reference'; boundary='Not orchestration core' },
  @{ group='p2'; sub='rag'; repo='deepset-ai/haystack'; url='https://github.com/deepset-ai/haystack.git'; decision='WATCH'; use='Document QA pipelines'; boundary='Use only if simpler' },
  @{ group='p2'; sub='vector'; repo='pgvector/pgvector'; url='https://github.com/pgvector/pgvector.git'; decision='ADOPT_NOW'; use='PostgreSQL-native embeddings'; boundary='Supports Truth Vault, does not replace truth' },
  @{ group='p2'; sub='vector'; repo='qdrant/qdrant'; url='https://github.com/qdrant/qdrant.git'; decision='WATCH'; use='Future vector DB'; boundary='Only when volume requires' },
  @{ group='p2'; sub='vector'; repo='chroma-core/chroma'; url='https://github.com/chroma-core/chroma.git'; decision='LAB_ONLY'; use='Local vector experiments'; boundary='Not production Truth Vault' },
  @{ group='p2'; sub='local-ai'; repo='ollama/ollama'; url='https://github.com/ollama/ollama.git'; decision='ADOPT_NEXT'; use='Local/private model testing'; boundary='Oracle Lite resource test required' },
  @{ group='p2'; sub='local-ai'; repo='ggml-org/llama.cpp'; url='https://github.com/ggml-org/llama.cpp.git'; decision='WATCH'; use='CPU/local model runtime'; boundary='Test before production' },
  @{ group='p2'; sub='local-ai'; repo='open-webui/open-webui'; url='https://github.com/open-webui/open-webui.git'; decision='LAB_ONLY'; use='Private internal AI lab UI'; boundary='Not candidate portal' },
  @{ group='p2'; sub='local-ai'; repo='BerriAI/litellm'; url='https://github.com/BerriAI/litellm.git'; decision='WATCH'; use='LLM routing/cost controls'; boundary='Only after billing guardrails' },

  # P3 platform foundation
  @{ group='p3'; sub='platform'; repo='vercel/next.js'; url='https://github.com/vercel/next.js.git'; decision='CURRENT_CORE'; use='Portal/public/control-plane frontend'; boundary='Backend law separate' },
  @{ group='p3'; sub='ui'; repo='shadcn-ui/ui'; url='https://github.com/shadcn-ui/ui.git'; decision='ADOPT_NOW'; use='Clean UI component reference'; boundary='Do not copy templates blindly' },
  @{ group='p3'; sub='ui'; repo='tailwindlabs/tailwindcss'; url='https://github.com/tailwindlabs/tailwindcss.git'; decision='CURRENT_CORE'; use='Styling'; boundary='Accessible/mobile first' },
  @{ group='p3'; sub='ui'; repo='TanStack/table'; url='https://github.com/TanStack/table.git'; decision='ADOPT_NEXT'; use='Admin queues and ledgers'; boundary='Read models only' },
  @{ group='p3'; sub='ui'; repo='TanStack/query'; url='https://github.com/TanStack/query.git'; decision='ADOPT_NEXT'; use='Data fetching discipline'; boundary='Backend truth only' },
  @{ group='p3'; sub='ui'; repo='recharts/recharts'; url='https://github.com/recharts/recharts.git'; decision='ADOPT_NEXT'; use='Reports/dashboard charts'; boundary='Evidence-led metrics only' },
  @{ group='p3'; sub='auth'; repo='nextauthjs/next-auth'; url='https://github.com/nextauthjs/next-auth.git'; decision='WATCH'; use='Auth/session reference'; boundary='Must align with RLS doctrine' },
  @{ group='p3'; sub='auth'; repo='keycloak/keycloak'; url='https://github.com/keycloak/keycloak.git'; decision='WATCH'; use='Future enterprise auth'; boundary='Heavy for Oracle Lite MVP' },
  @{ group='p3'; sub='storage'; repo='minio/minio'; url='https://github.com/minio/minio.git'; decision='WATCH'; use='S3-compatible object store'; boundary='Use only if current storage insufficient' },

  # P4 ops/security
  @{ group='p4'; sub='ops'; repo='activepieces/activepieces'; url='https://github.com/activepieces/activepieces.git'; decision='WATCH'; use='Automation backup/reference'; boundary='Avoid duplicate workflow layer' },
  @{ group='p4'; sub='ops'; repo='windmill-labs/windmill'; url='https://github.com/windmill-labs/windmill.git'; decision='WATCH'; use='Scheduled scripts/workers reference'; boundary='Only if it reduces complexity' },
  @{ group='p4'; sub='ops'; repo='temporalio/temporal'; url='https://github.com/temporalio/temporal.git'; decision='WATCH'; use='Durable workflow reference'; boundary='Too heavy unless volume requires' },
  @{ group='p4'; sub='observability'; repo='prometheus/prometheus'; url='https://github.com/prometheus/prometheus.git'; decision='ADOPT_NEXT'; use='Metrics'; boundary='Minimal first' },
  @{ group='p4'; sub='observability'; repo='grafana/grafana'; url='https://github.com/grafana/grafana.git'; decision='ADOPT_NEXT'; use='Dashboards'; boundary='No candidate data leakage' },
  @{ group='p4'; sub='observability'; repo='louislam/uptime-kuma'; url='https://github.com/louislam/uptime-kuma.git'; decision='ADOPT_NEXT'; use='Portal/source health checks'; boundary='Oracle Lite resource check' },
  @{ group='p4'; sub='observability'; repo='open-telemetry/opentelemetry-js'; url='https://github.com/open-telemetry/opentelemetry-js.git'; decision='ADOPT_NOW'; use='API/worker tracing'; boundary='PII redaction' },
  @{ group='p4'; sub='security'; repo='gitleaks/gitleaks'; url='https://github.com/gitleaks/gitleaks.git'; decision='ADOPT_NOW'; use='Secret scanning'; boundary='CI gate' },
  @{ group='p4'; sub='security'; repo='aquasecurity/trivy'; url='https://github.com/aquasecurity/trivy.git'; decision='ADOPT_NOW'; use='Container/dependency scanning'; boundary='CI gate' },
  @{ group='p4'; sub='security'; repo='semgrep/semgrep'; url='https://github.com/semgrep/semgrep.git'; decision='ADOPT_NEXT'; use='Static analysis/policy checks'; boundary='CI gate' },

  # P5 opportunities/crawling
  @{ group='p5'; sub='opportunities'; repo='speedyapply/JobSpy'; url='https://github.com/speedyapply/JobSpy.git'; decision='LAB_ONLY'; use='Job discovery reference'; boundary='Respect site terms and rate limits' },
  @{ group='p5'; sub='crawler'; repo='apify/crawlee'; url='https://github.com/apify/crawlee.git'; decision='ADOPT_NEXT'; use='Structured public-source crawling'; boundary='Robots/terms/rate limits' },
  @{ group='p5'; sub='crawler'; repo='scrapy/scrapy'; url='https://github.com/scrapy/scrapy.git'; decision='WATCH'; use='Deep crawler option'; boundary='Only when simpler tools fail' },
  @{ group='p5'; sub='browser'; repo='puppeteer/puppeteer'; url='https://github.com/puppeteer/puppeteer.git'; decision='WATCH'; use='Browser/PDF reference'; boundary='Prefer Playwright first' },
  @{ group='p5'; sub='browser'; repo='browserless/browserless'; url='https://github.com/browserless/browserless.git'; decision='WATCH'; use='Remote browser pool future'; boundary='Not needed at start' },

  # P6 comms/documents/forms/finance
  @{ group='p6'; sub='comms'; repo='nodemailer/nodemailer'; url='https://github.com/nodemailer/nodemailer.git'; decision='ADOPT_NOW'; use='Email-first communication'; boundary='Evidence ledger required' },
  @{ group='p6'; sub='comms'; repo='axllent/mailpit'; url='https://github.com/axllent/mailpit.git'; decision='ADOPT_NOW'; use='Local email testing'; boundary='Dev only' },
  @{ group='p6'; sub='comms'; repo='knadh/listmonk'; url='https://github.com/knadh/listmonk.git'; decision='WATCH'; use='Future campaigns/newsletters'; boundary='Not WhatsApp bulk replacement' },
  @{ group='p6'; sub='comms'; repo='postalserver/postal'; url='https://github.com/postalserver/postal.git'; decision='WATCH'; use='Future mail infra'; boundary='Too heavy at start' },
  @{ group='p6'; sub='pdf'; repo='Hopding/pdf-lib'; url='https://github.com/Hopding/pdf-lib.git'; decision='ADOPT_NEXT'; use='CV/MAP/package PDFs'; boundary='Visual QA required' },
  @{ group='p6'; sub='pdf'; repo='gotenberg/gotenberg'; url='https://github.com/gotenberg/gotenberg.git'; decision='WATCH'; use='HTML-to-PDF service'; boundary='Resource test required' },
  @{ group='p6'; sub='forms'; repo='formbricks/formbricks'; url='https://github.com/formbricks/formbricks.git'; decision='WATCH'; use='Feedback/survey patterns'; boundary='Not candidate portal core' },
  @{ group='p6'; sub='forms'; repo='docusealco/docuseal'; url='https://github.com/docusealco/docuseal.git'; decision='WATCH'; use='Future consent/signatures'; boundary='POPIA/legal review required' },
  @{ group='p6'; sub='finance'; repo='Eckhardt-D/payfastjs'; url='https://github.com/Eckhardt-D/payfastjs.git'; decision='WATCH'; use='PayFast pattern reference'; boundary='Prefer official PayFast docs/API' }
)

$selected = $stack | Where-Object {
  $Group -eq 'all' -or $_.group -eq $Group -or $_.sub -eq $Group -or $_.decision -eq $Group
}

if (-not $selected -or $selected.Count -eq 0) {
  throw "No repositories matched group '$Group'. Try all, p0, p1, p2, p3, p4, p5, p6, voice, browser, document, agent, security, observability."
}

New-Item -ItemType Directory -Force -Path $Root | Out-Null
New-Item -ItemType Directory -Force -Path 'reports/github-stack' | Out-Null

$report = @()

Write-Host "=== KINGSMEN GITHUB STACK CLONE ===" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Cyan
Write-Host "Group: $Group" -ForegroundColor Cyan
Write-Host "Root: $Root" -ForegroundColor Cyan
Write-Host "Count: $($selected.Count)" -ForegroundColor Cyan
Write-Host "Safety: clones are external research copies; do not commit third-party code without approval." -ForegroundColor Yellow

foreach ($item in $selected) {
  $safe = New-SafeName -Repo $item.repo
  $target = Join-Path $Root (Join-Path $item.group (Join-Path $item.sub $safe))
  $exists = Test-Path $target

  $row = [ordered]@{
    timestamp = (Get-Date).ToString('o')
    group = $item.group
    sub = $item.sub
    repo = $item.repo
    url = $item.url
    decision = $item.decision
    use = $item.use
    boundary = $item.boundary
    target = $target
    action = $null
    status = $null
  }

  if ($exists -and $SkipExisting) {
    Write-Host "SKIP existing: $($item.repo) -> $target" -ForegroundColor DarkYellow
    $row.action = 'skip-existing'
    $row.status = 'skipped'
    $report += [pscustomobject]$row
    continue
  }

  $parent = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $parent | Out-Null

  if ($DryRun) {
    Write-Host "DRYRUN $Mode: $($item.repo) -> $target" -ForegroundColor Gray
    $row.action = "dryrun-$Mode"
    $row.status = 'dryrun'
    $report += [pscustomobject]$row
    continue
  }

  try {
    if ($Mode -eq 'clone') {
      if ($exists -and -not $SkipExisting) {
        Remove-Item -Recurse -Force $target
      }
      git clone --depth 1 $item.url $target
      if ($LASTEXITCODE -ne 0) { throw "git clone failed with exit code $LASTEXITCODE" }
      $row.action = 'clone'
      $row.status = 'ok'
      Write-Host "CLONED: $($item.repo)" -ForegroundColor Green
    }
    elseif ($Mode -eq 'submodule') {
      if ($exists) {
        Write-Host "SUBMODULE target exists, skipping: $($item.repo)" -ForegroundColor DarkYellow
        $row.action = 'submodule-skip-existing'
        $row.status = 'skipped'
      } else {
        git submodule add $item.url $target
        if ($LASTEXITCODE -ne 0) { throw "git submodule add failed with exit code $LASTEXITCODE" }
        $row.action = 'submodule-add'
        $row.status = 'ok'
        Write-Host "SUBMODULE ADDED: $($item.repo)" -ForegroundColor Green
      }
    }
  }
  catch {
    $row.action = $Mode
    $row.status = "error: $($_.Exception.Message)"
    Write-Host "ERROR: $($item.repo) :: $($_.Exception.Message)" -ForegroundColor Red
  }

  $report += [pscustomobject]$row
}

$reportJson = 'reports/github-stack/clone-report.local.json'
$reportCsv = 'reports/github-stack/clone-report.local.csv'
$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $reportJson
$report | Export-Csv -NoTypeInformation -Encoding UTF8 $reportCsv

Write-Host "=== COMPLETE ===" -ForegroundColor Cyan
Write-Host "Report JSON: $reportJson" -ForegroundColor Cyan
Write-Host "Report CSV:  $reportCsv" -ForegroundColor Cyan
Write-Host "Next: run license/security review before any adapter or production use." -ForegroundColor Yellow
