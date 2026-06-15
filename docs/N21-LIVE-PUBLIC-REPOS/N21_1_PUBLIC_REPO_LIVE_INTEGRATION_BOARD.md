# N21.1 — Live Public Repo Integration Board

Status: built on branch `n21-live-public-repo-adapters`  
Purpose: make public repository projects visible to Jarvis and Kingsmen as governed adapter records instead of loose research notes.

## What changed

This phase turns the public repo work into a live Kingsmen surface.

It does **not** vendor third-party code into Kingsmen production.
It does **not** make public projects the Kingsmen authority.
It does **not** allow silent portal automation, candidate truth mutation, or secret exposure.

It adds:

1. a live public repo integration registry;
2. public repo adapter contracts;
3. a read API for Jarvis/HUD use;
4. a Jarvis runtime intent for public repo integration;
5. a Jarvis command registry entry for the public repo integration board;
6. a registered Jarvis adapter id for the public repo board.

## New live files

| File | Purpose |
|---|---|
| `apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts` | Source of truth for public repo integration records. |
| `apps/web/src/lib/public-repos/live/public-repo-adapter-contracts.ts` | Contract layer for the first adapters. |
| `apps/web/src/app/api/jarvis/public-repos/route.ts` | Read endpoint for public repo integration records. |
| `apps/web/src/lib/jarvis/runtime/types.ts` | Adds `public_repo_integration` intent and `PUBLIC_REPO_INTEGRATION_BOARD` command. |
| `apps/web/src/lib/jarvis/runtime/intent-router.ts` | Routes public repo and stack phrases to public repo intent. |
| `apps/web/src/lib/jarvis/runtime/command-registry.ts` | Registers the public repo board command. |
| `apps/web/src/lib/jarvis/runtime/adapter-selector.ts` | Allows `public_repo_registry_adapter`. |

## First live public repo adapters

| Adapter | Public repo | Status | Purpose |
|---|---|---|---|
| `DoclingAdapter` | `DS4SD/docling` | live contract ready | Candidate/document smart intake. |
| `PlaywrightScoutGateway` | `microsoft/playwright` | live contract ready | Controlled route and portal scout. |
| `JarvisWakeWordService` | `dscripka/openWakeWord` | live contract ready | Wake phrase for local Jarvis voice mode. |
| `JarvisSpeechToTextService` | `ggml-org/whisper.cpp` | live contract ready | Local speech-to-text. |
| `JarvisTextToSpeechService` | `OHF-Voice/piper1-gpl` | planned next | Local speech output with license review. |
| `LangfuseTraceGateway` | `langfuse/langfuse` | live contract ready | Redacted AI/tool tracing and evidence link. |
| `SecurityScanGate` | `gitleaks/gitleaks` | live contract ready | Secret-scan gate. |
| `TrivySecurityGate` | `aquasecurity/trivy` | live contract ready | Dependency/container risk gate. |
| `SemgrepPolicyGate` | `semgrep/semgrep` | planned next | Static policy checks. |

## Jarvis command surface

Jarvis now has a dedicated public repo route:

```text
Intent: public_repo_integration
Command: PUBLIC_REPO_INTEGRATION_BOARD
Adapter: public_repo_registry_adapter
Risk: safe_read
```

Example founder messages that should route to this intent:

```text
Jarvis public repo integration board
Show public repos live
Check the GitHub stack
What is the Docling adapter status
What public repos are ready for Kingsmen
```

## API surface

Read all records:

```text
GET /api/jarvis/public-repos
```

Read live-contract-ready records:

```text
GET /api/jarvis/public-repos?live=true
```

Read one record:

```text
GET /api/jarvis/public-repos?id=docling
```

Test runtime routing through the existing kernel API:

```text
POST /api/jarvis/kernel
Body: { "message": "Jarvis public repo integration board" }
```

Expected command:

```text
PUBLIC_REPO_INTEGRATION_BOARD
```

## Safety boundary

A public repo is allowed into Kingsmen only through these stages:

```text
Study record
  -> Integration registry
  -> Adapter contract
  -> License/security/Oracle Lite/POPIA review
  -> Kingsmen-owned implementation
  -> Validator proof
  -> Founder approval when sensitive
  -> Evidence-led release
```

## Immediate next build sequence

1. Build `DoclingAdapter` implementation for document extraction drafts.
2. Build `PlaywrightScoutGateway` implementation for route/source scout.
3. Build `JarvisVoiceGateway` local shell using wake word and STT contracts.
4. Build `LangfuseTraceGateway` redacted trace writer.
5. Build `SecurityScanGate` validator wiring.

## Definition of live for N21.1

This phase is live when:

- Jarvis can route a public repo request into `public_repo_integration`;
- `/api/jarvis/public-repos` returns the integration board;
- records show status, adapter id, use, boundaries, build targets, and acceptance tests;
- public repos are visible as governed Kingsmen adapters, not random external code;
- sensitive adapters are marked as approval-required;
- next build targets are clear and repo-materialized.
