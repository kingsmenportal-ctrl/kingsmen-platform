# N21 — Kingsmen Adapter Architecture for the GitHub Stack

This document explains how external GitHub projects may assist Kingsmen without becoming uncontrolled production code.

## Core rule

External tools are helpers only. Kingsmen remains governed by:

- backend command bus,
- PostgreSQL truth vault,
- evidence ledgers,
- source-confidence bands,
- human approval gates,
- POPIA/privacy boundaries,
- Oracle Lite resource discipline.

No external repository may directly write to candidate truth, application truth, finance truth, communications truth, or governance truth.

## Safe integration pattern

```text
External GitHub tool
  -> Kingsmen adapter
  -> Policy gate
  -> Source-confidence / privacy gate
  -> Backend command or read model
  -> Evidence ledger
```

The external tool returns a proposed result. Kingsmen decides whether that result is accepted.

## Standard adapter result

```ts
export type KingsmenAdapterRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

export type KingsmenAdapterResult<T> = {
  ok: boolean;
  adapter: string;
  version: string;
  risk: KingsmenAdapterRisk;
  confidence: number;
  proposed: T | null;
  evidence: Array<{
    type: 'source' | 'document' | 'trace' | 'screenshot' | 'log' | 'human_note';
    uri?: string;
    sha256?: string;
    summary: string;
  }>;
  warnings: string[];
  requiresHumanApproval: boolean;
};
```

## Adapter 1 — DocumentSmartIntakeAdapter

External references:

- `DS4SD/docling`
- `Unstructured-IO/unstructured`

Purpose:

- extract useful information from CVs, PDFs, IDs, certificates, statements, spreadsheets, and other candidate documents;
- create draft profile fields;
- reduce typing for candidates;
- preserve evidence and confidence for every suggested field.

Allowed output examples:

- names,
- contact details,
- education history,
- work history,
- qualification names,
- subjects/results,
- certificate/license hints,
- missing document hints,
- document-quality warnings.

Boundary:

The adapter creates suggestions only. Candidate/operator confirmation is required before committing profile truth.

## Adapter 2 — JarvisVoiceGateway

External references:

- `dscripka/openWakeWord`
- `ggml-org/whisper.cpp`
- `OHF-Voice/piper1-gpl`

Purpose:

- listen for a local wake phrase;
- transcribe founder voice commands;
- classify command intent;
- create safe Kingsmen command envelopes;
- read back summaries or confirmations.

Allowed command classes:

- queue summary,
- system health report,
- document pipeline report,
- route/source health report,
- draft message preparation,
- local diagnostics,
- manual package preparation,
- explain candidate/application status.

Boundary:

Jarvis does not become the source of truth. Jarvis must use approved backend commands and must ask for approval on risky or sensitive actions.

## Adapter 3 — PortalScoutGateway

External references:

- `microsoft/playwright`
- `microsoft/playwright-mcp`
- `browserbase/stagehand`
- lab-only references: `browser-use/browser-use`, `Skyvern-AI/skyvern`

Purpose:

- check public portal health;
- capture route evidence;
- inspect public instructions, fees, dates, and field labels;
- support MAP/manual package generation;
- help operators understand where a route is blocked or needs manual handling.

Boundary:

The scout is a read/inspect assistant first. Sensitive, uncertain, restricted, payment, authentication, or consent-heavy situations must be escalated to manual review.

## Adapter 4 — LangfuseTraceGateway

External references:

- `langfuse/langfuse`
- `open-telemetry/opentelemetry-js`

Purpose:

- trace Jarvis actions;
- trace AI decisions;
- record prompts, tool calls, confidence, policy outcomes, and evidence links;
- support debugging and accountability.

Boundary:

Traces must be redacted. Raw candidate documents, secrets, passwords, private tokens, and unnecessary sensitive personal data must not be written into traces.

## Adapter 5 — SecurityScanGate

External references:

- `gitleaks/gitleaks`
- `aquasecurity/trivy`
- `semgrep/semgrep`

Purpose:

- prevent secrets from entering the repo;
- scan containers and dependencies;
- detect high-risk code patterns;
- enforce review before external tools become production dependencies.

Boundary:

A failed security gate blocks production promotion.

## Adapter 6 — RAGSourceConfidenceGateway

External references:

- `pgvector/pgvector`
- `run-llama/llama_index`
- optional references: `langchain-ai/langchain`, `deepset-ai/haystack`

Purpose:

- retrieve institution, route, bursary, SETA, employer, and program information;
- attach source confidence;
- support grounded answers and matching suggestions.

Boundary:

RAG supports decisions. It does not become truth unless the source authority, freshness, and confidence checks pass.

## Adapter 7 — OpportunityDiscoveryGateway

External references:

- `apify/crawlee`
- `scrapy/scrapy`
- lab-only: `speedyapply/JobSpy`

Purpose:

- discover public opportunities;
- normalize them into Kingsmen opportunity candidates;
- route low-confidence findings for verification.

Boundary:

Opportunity discovery must respect site terms, rate limits, consent rules, and source confidence rules.

## Adapter 8 — FinanceGateway

External references:

- `Eckhardt-D/payfastjs` as reference only;
- official provider documentation remains authoritative.

Purpose:

- support future PayFast integration patterns;
- help with signed payment confirmation flow design.

Boundary:

Payment implementation must use official provider requirements and Kingsmen finance evidence ledgers.

## N-series impact

| N-series | GitHub stack impact |
|---|---|
| N01 | clone script, security scans, Oracle Lite resource checks |
| N02 | command envelope and adapter policy middleware |
| N03 | evidence tables, source confidence, pgvector support |
| N04 | smart form prefill and founder Jarvis shell |
| N05 | document extraction evidence |
| N06 | portal scouting, route health, MAP support |
| N08 | kill switches, approvals, adapter allowlists |
| N09 | email-first drafts and communication evidence |
| N10 | payment integration later through official rules |
| N11 | AI/RAG suggestions with confidence bands |
| N13 | traces, dashboards, health checks, observability |
| N15 | opportunity discovery and public source registry |
| N17 | Jarvis voice and command control plane |

## First build target

The first production-grade feature from this stack should be:

**Candidate Smart Form from CV/Documents**

Minimum result:

1. candidate uploads CV/document;
2. Document Vault stores original;
3. adapter extracts fields;
4. system creates draft profile suggestions;
5. candidate/operator confirms corrections;
6. backend command commits approved truth;
7. evidence ledger stores extraction source and confidence.
