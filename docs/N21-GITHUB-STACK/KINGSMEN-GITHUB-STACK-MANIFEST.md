# N21 — Kingsmen GitHub Stack Manifest

Status: proposed integration register  
Branch: `github-stack-kingsmen-jarvis`  
Purpose: identify, clone, test, and selectively integrate open-source GitHub projects that can materially advance Kingsmen and Kingsmen Jarvis without adding useless layers.

## Non-negotiable Kingsmen rule

Do **not** dump third-party code directly into Kingsmen production. This stack is registered as external tooling first. Every project must pass:

1. license review,
2. security scan,
3. Oracle Lite resource test,
4. Kingsmen doctrine check,
5. backend-state-machine boundary check,
6. POPIA/privacy check,
7. human approval gate before production use.

Kingsmen remains backend-controlled. Jarvis is a commander/operator shell, not the sovereign source of truth. Playwright/browser agents remain probes/scouts. If CAPTCHA, OTP, payment, blocked portal, unclear form, or risk appears, the route becomes MAP/manual fallback.

## Integration rule: clone for research, integrate by adapter

The repository includes `scripts/github-stack/clone-kingsmen-open-source-stack.ps1`. It clones selected projects into `external/github-stack/`, which is ignored by Git. This gives Kingsmen full local access to inspect, test, and borrow patterns without vendoring unreviewed code.

Allowed modes:

- `clone`: local research copy only; safest default.
- `submodule`: allowed only after license and security approval.
- `adapter`: Kingsmen writes its own interface around the tool.
- `service`: run separately behind Kingsmen API boundary.
- `lab-only`: experiment, never production core.

## Priority groups

### P0 — Must assist Kingsmen immediately

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Document intelligence | `DS4SD/docling` | ADOPT_NOW | CV, ID, certificate, statement, PDF, DOCX, spreadsheet extraction into candidate smart-form drafts | Candidate/operator confirmation required before profile truth update |
| Document ETL fallback | `Unstructured-IO/unstructured` | ADOPT_NEXT | Backup extraction pipeline and comparison engine | Never replace verified document ledger |
| Portal scout | `microsoft/playwright` | ADOPT_NOW | Controlled portal tests, public page checks, screenshots, MAP evidence | No payment/OTP/CAPTCHA bypass |
| Portal scout MCP | `microsoft/playwright-mcp` | ADOPT_NEXT | AI-readable browser actions for scout tasks | Sandboxed, allowlisted domains only |
| Browser agent reference | `browserbase/stagehand` | ADOPT_NEXT | Natural-language Playwright reference for difficult portals | Use only behind Route Safety gates |
| Browser agent reference | `browser-use/browser-use` | LAB_ONLY | Learn from browser automation patterns | Not a production submitter |
| AI browser workflow | `Skyvern-AI/skyvern` | LAB_ONLY | Form workflow reference and extraction ideas | AGPL/license caution; never core without review |
| Jarvis wake word | `dscripka/openWakeWord` | ADOPT_NOW | “Hey Jarvis” local wake-word activation | Local microphone boundary only |
| Jarvis speech-to-text | `ggml-org/whisper.cpp` | ADOPT_NOW | Local voice transcription for Jarvis | No raw candidate recordings stored by default |
| Jarvis text-to-speech | `OHF-Voice/piper1-gpl` | ADOPT_NEXT | Local voice replies | License review required |
| LLM tracing | `langfuse/langfuse` | ADOPT_NOW | Audit, prompts, traces, tool calls, evidence | No secrets or raw sensitive docs in traces |
| Workflow worker | `n8n-io/n8n` | ALREADY_ALLOWED | Thin stateless workers only | Exactly one Airtable write + one backend result POST |

### P1 — Jarvis command brain and agent workflow

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Agent SDK | `openai/openai-agents-python` | ADOPT_NEXT | Python Jarvis sidecar, tool calls, guardrails, voice agent prototypes | Jarvis obeys Kingsmen command envelope |
| Stateful workflow | `langchain-ai/langgraph` | ADOPT_NEXT | Durable agent state and human-in-loop patterns | Not a replacement for backend state machine |
| TypeScript stateful workflow | `langchain-ai/langgraphjs` | ADOPT_NOW | TypeScript-friendly command graph for repo/runtime | Must call backend command bus |
| Enterprise agent reference | `microsoft/agent-framework` | WATCH | Governance/checkpointing/reference patterns | Reference first; do not overbuild |
| Agent patterns | `microsoft/semantic-kernel` | WATCH | Planning/reference and connectors | Avoid duplicate orchestration layer |
| Multi-agent experiments | `crewAIInc/crewAI` | LAB_ONLY | Compare task delegation ideas | Not core; avoid agent swarm complexity |
| Computer-use UI | `microsoft/magentic-ui` | LAB_ONLY | Research human-supervised web agents | Lab only |
| Coding/build agent | `All-Hands-AI/OpenHands` or active upstream | LAB_ONLY | Learn repo-building workflow patterns | Never autonomous production write without PR review |
| Pair programming | `paul-gauthier/aider` | LAB_ONLY | Local coding helper for founder/dev tasks | Human-reviewed commits only |
| IDE assistant | `continuedev/continue` | LAB_ONLY | Local IDE coding assistant | No direct production secrets |

### P2 — Knowledge, RAG, search, and source confidence

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| RAG framework | `run-llama/llama_index` | ADOPT_NEXT | Source-backed institutional knowledge retrieval | All facts carry source confidence |
| RAG framework | `langchain-ai/langchain` | WATCH | Tool ecosystem and loaders | Avoid becoming orchestration core |
| Retrieval engine | `deepset-ai/haystack` | WATCH | Document QA and pipelines | Use only if simpler than current stack |
| Vector DB | `pgvector/pgvector` | ADOPT_NOW | PostgreSQL-native embeddings | Fits Truth Vault better than extra DB at start |
| Vector DB | `qdrant/qdrant` | WATCH | Future dedicated vector search | Not needed before volume requires it |
| Vector DB | `chroma-core/chroma` | LAB_ONLY | Local experiments | Not production Truth Vault |
| Local LLM server | `ollama/ollama` | ADOPT_NEXT | Local/private model testing on founder machine | Not assumed on Oracle Lite unless resources allow |
| Local LLM runtime | `ggml-org/llama.cpp` | WATCH | CPU/local model runtime | Test before production |
| Internal AI UI | `open-webui/open-webui` | LAB_ONLY | Private AI lab interface | Not candidate portal |
| LLM router | `BerriAI/litellm` | WATCH | Multi-provider routing/cost controls | Only after billing/guardrail design |

### P3 — Kingsmen platform foundation

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Web framework | `vercel/next.js` | CURRENT_CORE | Candidate portal, founder control, public website | Keep backend law separate |
| UI components | `shadcn-ui/ui` | ADOPT_NOW | Clean portal/admin UI components | Do not copy templates blindly |
| Styling | `tailwindlabs/tailwindcss` | CURRENT_CORE | UI styling | Keep accessible/mobile-first |
| Data tables | `TanStack/table` | ADOPT_NEXT | Admin queues, ledgers, workbench | Read models only |
| Async/query state | `TanStack/query` | ADOPT_NEXT | Client/server data fetching discipline | Backend remains source of truth |
| Charts | `recharts/recharts` | ADOPT_NEXT | Reports, dashboards | Evidence-led metrics only |
| Auth reference | `nextauthjs/next-auth` | WATCH | Auth patterns | Must align with RLS/session doctrine |
| Auth service | `keycloak/keycloak` | WATCH | Future enterprise auth | Heavy for Oracle Lite MVP |
| Storage | `minio/minio` | WATCH | S3-compatible object store | Use only if Supabase/storage path insufficient |

### P4 — Workflow, operations, observability, and security

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Automation | `n8n-io/n8n` | ALREADY_ALLOWED | Stateless thin workflows | No orchestration logic inside workflows |
| Automation alternative | `activepieces/activepieces` | WATCH | Backup/reference | Avoid duplicate workflow layer |
| Worker engine | `windmill-labs/windmill` | WATCH | Scheduled scripts/workers | Only if it replaces complexity, not adds it |
| Durable workflows | `temporalio/temporal` | WATCH | Future durable process engine | Too heavy unless volume requires |
| Metrics | `prometheus/prometheus` | ADOPT_NEXT | Runtime metrics | Minimal first |
| Dashboards | `grafana/grafana` | ADOPT_NEXT | Founder/system dashboards | No public candidate data leakage |
| Uptime | `louislam/uptime-kuma` | ADOPT_NEXT | Portal/source health monitoring | Good Oracle Lite candidate |
| Tracing | `open-telemetry/opentelemetry-js` | ADOPT_NOW | API/worker traces | Redact PII |
| Secret scanning | `gitleaks/gitleaks` | ADOPT_NOW | Prevent committed secrets | CI gate |
| Container scanning | `aquasecurity/trivy` | ADOPT_NOW | Docker/dependency scans | CI gate |
| Static analysis | `semgrep/semgrep` | ADOPT_NEXT | Security and policy checks | CI gate |

### P5 — Opportunity, jobs, crawling, and public-source registry

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Job discovery | `speedyapply/JobSpy` | LAB_ONLY | Learn multi-source job discovery patterns | Check website terms; no illegal scraping |
| Crawling | `apify/crawlee` | ADOPT_NEXT | Structured public-source crawling | Respect robots/terms/rate limits |
| Crawling | `scrapy/scrapy` | WATCH | Deep crawler option | Use only when Crawlee/Playwright not enough |
| Headless browser | `puppeteer/puppeteer` | WATCH | PDF/screenshot/browser reference | Prefer Playwright first |
| Public snapshots | `browserless/browserless` | WATCH | Remote browser pool future | Not needed on Oracle Lite start |

### P6 — Communication, PDF, forms, and finance

| Area | Repository | Decision | Kingsmen use | Boundary |
|---|---|---:|---|---|
| Email sending | `nodemailer/nodemailer` | ADOPT_NOW | Email-first communication | Evidence ledger required |
| Email testing | `axllent/mailpit` | ADOPT_NOW | Local email tests | Dev only |
| Newsletter/campaigns | `knadh/listmonk` | WATCH | Future campaigns | Not bulk WhatsApp replacement |
| Self-hosted mail | `postalserver/postal` | WATCH | Future mail infra | Too heavy at start |
| PDF generation | `Hopding/pdf-lib` | ADOPT_NEXT | CV/MAP/package PDFs | Confirm output visually |
| HTML-to-PDF | `gotenberg/gotenberg` | WATCH | Server-side document rendering | Resource test required |
| Forms | `formbricks/formbricks` | WATCH | Feedback/survey pattern | Not candidate portal core |
| E-sign/doc forms | `docusealco/docuseal` | WATCH | Future consent/signatures | POPIA/legal review required |
| PayFast helper | `Eckhardt-D/payfastjs` | WATCH | PayFast pattern reference | Prefer official PayFast docs/API; never treat as authority |

## Rejected or delayed patterns

1. Random “Jarvis desktop assistant” repos — mostly demos; not production Kingsmen architecture.
2. Fully autonomous browser submission — violates portal safety and MAP doctrine.
3. Agent swarms as core — unnecessary complexity and hard to audit.
4. Replacing PostgreSQL truth with vector DB — vectors support truth; they do not become truth.
5. Adding workflow engines just because they are popular — n8n stays thin unless a replacement proves simpler.
6. Directly vendoring AGPL/GPL code into Kingsmen — requires legal/license approval.

## Execution order

### Phase 1 — Local clone and inspection

Run:

```powershell
pwsh ./scripts/github-stack/clone-kingsmen-open-source-stack.ps1 -Mode clone -Group all
```

Output:

- `external/github-stack/*` local clones,
- `reports/github-stack/clone-report.local.json`,
- `reports/github-stack/clone-report.local.csv`.

### Phase 2 — Immediate adapters

1. `DoclingAdapter` for document smart intake.
2. `JarvisVoiceGateway` using wake word + STT + TTS.
3. `PlaywrightScoutGateway` for source/portal probing.
4. `LangfuseTraceGateway` for Jarvis/AI traces.
5. `SecurityScanGate` using gitleaks + trivy.

### Phase 3 — Kingsmen product wiring

- N04 Candidate Portal: smart form prefill from CV/documents.
- N05 Document Vault: document analysis evidence ledger.
- N06 Route Universe: source confidence and portal DNA scouts.
- N09 Communications: email-first proof ledger.
- N11 AI Decision: source-grounded suggestions only.
- N17 Founder Control Plane: Jarvis command shell.

## Jarvis law

Jarvis may:

- listen,
- transcribe,
- classify command intent,
- call allowed Kingsmen commands,
- prepare drafts,
- run local diagnostics,
- summarize evidence,
- ask for human approval when needed.

Jarvis may not:

- silently change candidate truth,
- submit applications without approval,
- bypass CAPTCHA/OTP/payment gates,
- store raw sensitive documents in traces,
- run uncontrolled web automation,
- override backend state machine,
- create new “layers” without a repo-materializable reason.

## Acceptance checklist

A project is approved only when this checklist is true:

- [ ] License reviewed and recorded.
- [ ] No hardcoded secrets.
- [ ] Docker/resource use tested on Oracle Lite target.
- [ ] PII/POPIA risk reviewed.
- [ ] Integration happens through Kingsmen adapter/gateway.
- [ ] Errors create evidence ledger entries.
- [ ] Human approval boundary is clear.
- [ ] Feature improves Kingsmen capability directly.
