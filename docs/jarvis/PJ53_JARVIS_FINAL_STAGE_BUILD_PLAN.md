# PJ53 — Kingsmen Jarvis Final-Stage Build Plan

Status: founder-requested roadmap  
Purpose: define how to build every missing Jarvis part until Jarvis becomes a real, working, clickable, usable, voice-capable, evidence-led Kingsmen operator.

## Current reality rating

Jarvis is currently around **45/100**.

It already has:

- clickable `/jarvis` HUD;
- typed command input;
- command cards;
- browser voice input where supported;
- browser speech output;
- optional visual/camera panel;
- `/api/jarvis/agent` runtime route;
- `/api/jarvis/status` status route;
- `/api/jarvis/command` safe command route;
- local Windows starter;
- safe read/check tools;
- evidence logs.

It is not yet final Jarvis because the full governed kernel, memory, approval workflow, production adapters, local voice stack, final visual operating desk, and real Kingsmen execution chain are not complete.

## Final-stage vision

Final Jarvis must look and behave like a real Kingsmen command system, not a static chatbot.

### Final visible surfaces

1. **Founder Jarvis Command HUD**
   - full-screen command cockpit;
   - Jarvis orb with live state;
   - voice wake/listening state;
   - command input;
   - command cards;
   - approvals drawer;
   - evidence drawer;
   - live output panel;
   - incident banner;
   - system confidence chip;
   - source confidence chip;
   - queue pressure panel;
   - candidate/document/route/finance/comms status strips.

2. **Jarvis Command Console**
   - typed command mode;
   - slash commands;
   - safe command autocomplete;
   - previous command history;
   - command replay with evidence;
   - blocked command explanation.

3. **Jarvis Voice Mode**
   - wake phrase;
   - local speech-to-text;
   - local or browser text-to-speech;
   - visible transcript;
   - confirm-before-action prompts;
   - push-to-talk fallback.

4. **Jarvis Approval Centre**
   - pending approvals;
   - risk rating;
   - affected candidate/application/document;
   - proposed action;
   - evidence links;
   - approve/reject buttons;
   - reason capture;
   - audit record.

5. **Jarvis Workbench Panels**
   - candidate status panel;
   - document pipeline panel;
   - route/source health panel;
   - manual fallback/MAP panel;
   - finance/payment panel;
   - communication drafts panel;
   - incident and repair tracker;
   - daily founder report.

## Final governed runtime chain

Final Jarvis must run through one chain:

```text
HUD / Voice / Command Input
  -> API Runtime Bridge
  -> Jarvis Kernel
  -> Intent Router
  -> Command Registry
  -> Policy Gate
  -> Approval Gate when required
  -> Tool Router / Adapter Selector
  -> Approved Adapter
  -> Source Confidence / Privacy Gate
  -> Evidence Ledger
  -> Response Composer
  -> HUD / Voice Output
```

No part may silently skip the kernel, policy gate, approval gate, source confidence, or evidence ledger.

## Missing Part 1 — Real Jarvis Kernel

### Problem

Current Jarvis has routes and command execution, but the real kernel chain is not yet fully centralised. The system needs one governed runtime path.

### Build files

- `apps/web/src/lib/jarvis/kernel/JarvisKernel.ts`
- `apps/web/src/lib/jarvis/kernel/JarvisKernel.types.ts`
- `apps/web/src/lib/jarvis/kernel/JarvisRuntimeContext.ts`
- `apps/web/src/lib/jarvis/kernel/JarvisResponseComposer.ts`
- `apps/web/src/app/api/jarvis/kernel/route.ts`

### Build steps

1. Create `JarvisCommandEnvelope` type.
2. Create `JarvisRuntimeContext` with founder id, session id, source, route, timestamp, and safety mode.
3. Move current keyword routing away from the API route into `JarvisKernel`.
4. Kernel must return a stable `JarvisKernelResult`.
5. API route becomes thin: receive request, call kernel, return result.
6. Add evidence id to every response.
7. Add tests for safe command, blocked command, failed adapter, and approval-required command.

### Acceptance test

- `/api/jarvis/kernel` returns a typed result for `system status`.
- Unknown command returns `BLOCKED`, not crash.
- Kernel result always includes evidence id, policy result, and next action.

## Missing Part 2 — Intent Router

### Problem

Current command identification is mostly phrase matching. Final Jarvis needs a typed intent router.

### Build files

- `apps/web/src/lib/jarvis/intent/JarvisIntentRouter.ts`
- `apps/web/src/lib/jarvis/intent/JarvisIntentCatalog.ts`
- `apps/web/src/lib/jarvis/intent/JarvisIntentRouter.test.ts`
- `manifests/jarvis/jarvis-intent-routing-matrix.json` already exists and must be treated as law/reference.

### Build steps

1. Define canonical intents:
   - `SYSTEM_STATUS`
   - `RUN_VALIDATION`
   - `RUN_BUILD`
   - `DATABASE_READ`
   - `ROUTE_HEALTH_CHECK`
   - `GIT_STATUS`
   - `DOCUMENT_INTAKE_REVIEW`
   - `CANDIDATE_STATUS_REVIEW`
   - `COMMUNICATION_DRAFT`
   - `FINANCE_REVIEW`
   - `APPROVAL_DECISION`
   - `HELP`
   - `BLOCKED_OR_UNKNOWN`
2. Add aliases and phrase patterns.
3. Add optional model-assisted classification later, but keep deterministic fallback.
4. Return confidence and matched evidence.
5. Route low confidence to review/help instead of executing.

### Acceptance test

- Ten sample founder commands map to correct intent.
- Low-confidence commands do not execute risky actions.

## Missing Part 3 — Command Registry

### Problem

Commands exist in routes, but final Jarvis needs one registry with risk, permission, adapter, and approval rules.

### Build files

- `apps/web/src/lib/jarvis/commands/JarvisCommandRegistry.ts`
- `apps/web/src/lib/jarvis/commands/JarvisCommand.types.ts`
- `manifests/jarvis/jarvis-command-categories.json` must stay aligned.

### Build steps

1. Define every command with:
   - id;
   - title;
   - category;
   - risk;
   - allowed roles;
   - required approval;
   - adapter id;
   - evidence requirement;
   - timeout;
   - read/write classification.
2. Move current command list into registry.
3. Block commands not in registry.
4. Add command discovery endpoint for HUD cards.

### Acceptance test

- HUD command cards are generated from registry, not hardcoded only.
- Unknown command cannot execute.

## Missing Part 4 — Policy Gate

### Problem

The repo already has Jarvis law files, but final Jarvis needs executable policy checks.

### Build files

- `apps/web/src/lib/jarvis/policy/JarvisPolicyGate.ts`
- `apps/web/src/lib/jarvis/policy/JarvisPolicyResult.ts`
- `apps/web/src/lib/jarvis/policy/JarvisApprovalPolicyLoader.ts`
- `manifests/jarvis/jarvis-approval-policy.json`
- `manifests/jarvis/jarvis-orchestration-policy.json`

### Build steps

1. Load policy manifests at runtime.
2. Evaluate command risk before adapter execution.
3. Require approval for sensitive actions.
4. Block unknown, destructive, or unregistered actions.
5. Return clear reason when blocked.
6. Log policy result in evidence ledger.

### Acceptance test

- Safe read command passes.
- Write command returns `APPROVAL_REQUIRED`.
- Unknown command returns `BLOCKED` with reason.

## Missing Part 5 — Approval Centre

### Problem

Risky actions are currently blocked. Final Jarvis needs a safe way to prepare risky actions and wait for founder approval.

### Build files

- `apps/web/src/lib/jarvis/approvals/JarvisApprovalStore.ts`
- `apps/web/src/lib/jarvis/approvals/JarvisApproval.types.ts`
- `apps/web/src/app/api/jarvis/approvals/route.ts`
- `apps/web/src/app/api/jarvis/approvals/[approvalId]/route.ts`
- `apps/web/src/app/jarvis/components/JarvisApprovalDrawer.tsx`

### Data model

Approval item:

- approval id;
- command id;
- requested by;
- requested at;
- risk;
- proposed action;
- affected records;
- evidence ids;
- expiry;
- status: pending / approved / rejected / expired;
- founder decision note.

### Build steps

1. Create approval table or JSON-local MVP store.
2. Policy gate creates approval request when required.
3. HUD shows approval drawer.
4. Founder approves or rejects.
5. Approved command executes through same kernel path.
6. Evidence ledger records full decision.

### Acceptance test

- `draft email to candidate` creates approval if send is requested.
- Approval appears on HUD.
- Reject prevents execution.
- Approve executes only the prepared command.

## Missing Part 6 — Evidence Ledger Upgrade

### Problem

Evidence JSONL exists, but final Jarvis needs normalized, queryable evidence connected to commands, approvals, adapters, and outputs.

### Build files

- `apps/web/src/lib/jarvis/evidence/JarvisEvidenceLedger.ts`
- `apps/web/src/lib/jarvis/evidence/JarvisEvidence.types.ts`
- database migration for `jarvis_evidence_events`
- API endpoint: `apps/web/src/app/api/jarvis/evidence/route.ts`

### Build steps

1. Keep local JSONL for dev fallback.
2. Add PostgreSQL evidence table.
3. Store command id, session id, adapter id, risk, result, output hash, and timestamps.
4. Redact sensitive output.
5. Expose evidence search endpoint to HUD.

### Acceptance test

- Every Jarvis command produces evidence.
- HUD evidence drawer can load evidence from backend.
- Sensitive values are redacted.

## Missing Part 7 — Memory Vault

### Problem

Jarvis needs memory, but memory must not become uncontrolled personal-data storage.

### Build files

- `apps/web/src/lib/jarvis/memory/JarvisMemoryVault.ts`
- `apps/web/src/lib/jarvis/memory/JarvisMemoryPolicy.ts`
- `apps/web/src/app/api/jarvis/memory/route.ts`
- `manifests/jarvis/jarvis-memory-write-policy.json`

### Memory types

Allowed:

- founder preference summaries;
- Kingsmen doctrine summaries;
- project decisions;
- command patterns;
- repair notes;
- adapter decisions;
- source confidence summaries.

Not allowed by default:

- raw candidate documents;
- raw ID numbers;
- passwords;
- API keys;
- private payment data;
- unredacted sensitive records.

### Build steps

1. Add memory write policy loader.
2. Add memory proposal flow.
3. Store memory only after policy check.
4. Memory entries must have reason, source, and expiry/review date where useful.
5. HUD memory panel shows recent safe memories.

### Acceptance test

- Jarvis can remember a safe founder preference.
- Jarvis refuses to store secrets.
- Memory has evidence link.

## Missing Part 8 — Real Voice Stack

### Problem

Current voice uses browser speech recognition and browser speech synthesis. Final Jarvis needs a more reliable local voice stack.

### Build files

- `tools/jarvis-voice/README.md`
- `tools/jarvis-voice/wakeword-service/`
- `tools/jarvis-voice/stt-service/`
- `tools/jarvis-voice/tts-service/`
- `apps/web/src/app/api/jarvis/voice/session/route.ts`
- `apps/web/src/app/jarvis/components/JarvisVoicePanel.tsx`

### External tools to test

- `dscripka/openWakeWord` for wake word;
- `ggml-org/whisper.cpp` for local speech-to-text;
- `OHF-Voice/piper1-gpl` or browser TTS for speech output.

### Build steps

1. Keep browser voice as fallback.
2. Build local wake-word service.
3. Build local STT service.
4. Add transcript endpoint.
5. Add voice session id.
6. Add voice command confirmation flow.
7. Add push-to-talk mode.
8. Add visual voice state: standby / listening / transcribing / confirming / executing.

### Acceptance test

- Founder says command.
- Transcript appears in HUD.
- Safe command runs.
- Sensitive command asks for approval.

## Missing Part 9 — Tool Adapter System

### Problem

Jarvis currently runs a small set of direct local commands. Final Jarvis needs adapter-based tools.

### Build files

- `apps/web/src/lib/jarvis/adapters/JarvisAdapterRegistry.ts`
- `apps/web/src/lib/jarvis/adapters/JarvisAdapter.types.ts`
- `apps/web/src/lib/jarvis/adapters/system/SystemStatusAdapter.ts`
- `apps/web/src/lib/jarvis/adapters/database/DatabaseReadAdapter.ts`
- `apps/web/src/lib/jarvis/adapters/routes/RouteHealthAdapter.ts`
- `apps/web/src/lib/jarvis/adapters/documents/DocumentSmartIntakeAdapter.ts`
- `apps/web/src/lib/jarvis/adapters/comms/CommunicationDraftAdapter.ts`
- `apps/web/src/lib/jarvis/adapters/finance/FinanceReviewAdapter.ts`

### Build steps

1. Define adapter interface.
2. Wrap current system/db/git/route tools as adapters.
3. Add adapter allowlist.
4. Add adapter timeout and error standard.
5. Add adapter output redaction.
6. Add adapter evidence mapping.

### Acceptance test

- Kernel can call adapter by command id.
- Adapter failure returns clean result.
- Adapter output appears in evidence drawer.

## Missing Part 10 — Document Smart Intake Adapter

### Problem

Candidates should not type details already in CVs and documents.

### Build files

- `apps/web/src/lib/jarvis/adapters/documents/DocumentSmartIntakeAdapter.ts`
- `apps/web/src/lib/documents/extraction/DocumentExtractionService.ts`
- `apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts`
- `apps/web/src/app/api/documents/extract/route.ts`
- `apps/web/src/app/candidate/profile/review/page.tsx`

### Build steps

1. Store uploaded original in Document Vault.
2. Extract text/tables using Docling first.
3. Map extracted fields to candidate draft profile.
4. Score confidence per field.
5. Show review UI.
6. Candidate/operator confirms or corrects.
7. Backend commits approved truth.
8. Store extraction evidence.

### Acceptance test

- CV upload creates draft work-history fields.
- ID/certificate fields require higher confidence and review.
- Nothing becomes truth until approved.

## Missing Part 11 — Portal Scout Adapter

### Problem

Jarvis must help inspect route/source/portal health without becoming unsafe automation.

### Build files

- `apps/web/src/lib/jarvis/adapters/scout/PortalScoutAdapter.ts`
- `apps/web/src/lib/routes/scout/RouteScoutService.ts`
- `apps/web/src/app/api/routes/scout/route.ts`
- `apps/web/src/app/jarvis/components/RouteScoutPanel.tsx`

### Build steps

1. Use allowlisted route/source URLs only.
2. Read source confidence registry first.
3. Run Playwright scout in controlled mode.
4. Capture evidence summary and screenshot path where appropriate.
5. Mark source as online, changed, blocked, stale, or manual-review.
6. Return MAP/manual fallback hints when needed.

### Acceptance test

- Scout can check a public route page.
- Scout result updates route health read model.
- Uncertain/sensitive route goes to manual review.

## Missing Part 12 — Kingsmen Operational Adapters

### Problem

Jarvis must operate Kingsmen, not only inspect system health.

### Build adapters

1. `CandidateStatusAdapter`
   - reads candidate profile, journey state, missing docs, next action.
2. `ApplicationWorkbenchAdapter`
   - reads application state, route, deadline, blockers.
3. `DocumentPipelineAdapter`
   - reads uploaded/missing/verified/rejected documents.
4. `CommunicationDraftAdapter`
   - drafts email-first messages.
5. `FinanceReviewAdapter`
   - reads invoice/payment/refund status.
6. `ManualFallbackAdapter`
   - prepares MAP/manual package.
7. `FounderDigestAdapter`
   - morning/midday/evening reports.

### Build steps

1. Define read-only MVP first.
2. Add draft actions second.
3. Add approval-required execution third.
4. Add scheduled reports later.

### Acceptance test

- Jarvis can answer: “What is blocking this candidate?”
- Jarvis can draft an email but not send without approval.
- Jarvis can prepare a manual package draft.

## Missing Part 13 — Final HUD Design

### Problem

The HUD exists, but final Jarvis needs full operator layout.

### Build files

- `apps/web/src/app/jarvis/components/JarvisOrb.tsx`
- `apps/web/src/app/jarvis/components/JarvisCommandDeck.tsx`
- `apps/web/src/app/jarvis/components/JarvisEvidenceDrawer.tsx`
- `apps/web/src/app/jarvis/components/JarvisApprovalDrawer.tsx`
- `apps/web/src/app/jarvis/components/JarvisMissionBoard.tsx`
- `apps/web/src/app/jarvis/components/JarvisWorkQueuePanel.tsx`
- `apps/web/src/app/jarvis/components/JarvisVoicePanel.tsx`
- `apps/web/src/app/jarvis/components/JarvisMemoryPanel.tsx`
- `apps/web/src/app/jarvis/components/JarvisIncidentBanner.tsx`

### Final layout

```text
┌──────────────────────────────────────────────────────────────┐
│ KINGSMEN JARVIS COMMAND HOUSE                                │
│ status | voice | system confidence | source confidence        │
├───────────────┬───────────────────────────────┬──────────────┤
│ Jarvis Orb    │ Command Conversation           │ Mission Board │
│ Voice Panel   │ Typed/Voice Transcript         │ Queue Pressure│
│ Visual Feed   │ Live Command Output            │ Route Health  │
├───────────────┼───────────────────────────────┼──────────────┤
│ Command Deck  │ Approval Centre                │ Evidence      │
│ Safe Actions  │ Pending Risk Decisions         │ Memory        │
│ Workbenches   │ Drafts / Prepared Actions      │ Incidents     │
└───────────────┴───────────────────────────────┴──────────────┘
```

### Acceptance test

- Founder can use Jarvis without opening developer console.
- Every visible claim has evidence or confidence.
- Risky action shows approval card.

## Missing Part 14 — OpenAI/Ollama Reasoning Loop

### Problem

Jarvis needs reasoning, but model output must not directly control the system.

### Build files

- `apps/web/src/lib/jarvis/brain/JarvisBrainProvider.ts`
- `apps/web/src/lib/jarvis/brain/OllamaJarvisProvider.ts`
- `apps/web/src/lib/jarvis/brain/OpenAIJarvisProvider.ts`
- `apps/web/src/lib/jarvis/brain/JarvisBrainPolicy.ts`

### Build steps

1. Keep deterministic command routing as authority.
2. Add model only for explanation, classification help, summarization, and draft generation.
3. Model may propose command envelope.
4. Policy gate must verify command envelope.
5. Tool execution must not happen from raw model text.
6. Store model trace with redaction.

### Acceptance test

- Model can explain a database scan result.
- Model cannot execute unregistered command.
- Model-generated draft is marked as draft until approved.

## Missing Part 15 — Production Deployment Path

### Problem

Current Jarvis is local Windows-first. Final Jarvis needs local founder mode and server mode.

### Build files

- `docs/jarvis/JARVIS_DEPLOYMENT_MODES.md`
- `docker/jarvis/`
- `scripts/windows/START_JARVIS_PRODUCTION.cmd`
- `scripts/linux/start-jarvis.sh`
- environment examples without secrets.

### Modes

1. **Founder Local Mode**
   - Windows machine;
   - local browser HUD;
   - local PostgreSQL path if present;
   - local voice tools;
   - local evidence files.

2. **Oracle Lite Server Mode**
   - backend/web deployed;
   - no always-on heavy local voice stack by default;
   - browser voice optional;
   - strict resource budget;
   - production evidence in database.

3. **Hybrid Mode**
   - server runs Kingsmen;
   - founder laptop runs local Jarvis voice shell;
   - voice shell calls secure backend APIs.

### Acceptance test

- Local mode starts with one command.
- Server mode starts without Windows-only paths.
- Hybrid mode can run safe commands remotely.

## Build order

### PJ53.1 — Kernel chain

Build `JarvisKernel`, typed envelope, result type, and `/api/jarvis/kernel`.

### PJ53.2 — Intent + registry + policy

Move command classification and command metadata into proper modules.

### PJ53.3 — Evidence ledger upgrade

Add PostgreSQL-backed evidence while keeping JSONL fallback.

### PJ53.4 — Approval centre

Add pending approvals API and HUD drawer.

### PJ53.5 — Adapter registry

Convert existing system/db/git/route tools into adapters.

### PJ53.6 — Final HUD components

Split current large HUD into reusable components and add approval/evidence/memory panels.

### PJ53.7 — Real voice stack

Add local wake/STT/TTS integration while keeping browser fallback.

### PJ53.8 — Document Smart Intake

Build Docling-powered extraction and candidate review flow.

### PJ53.9 — Portal Scout

Build controlled Playwright route/source scout.

### PJ53.10 — Kingsmen operational adapters

Candidate, application, document, finance, communications, manual fallback, and founder digest adapters.

### PJ53.11 — Brain provider

Add OpenAI/Ollama reasoning provider behind policy gate.

### PJ53.12 — Deployment modes

Make local, server, and hybrid Jarvis modes explicit and runnable.

## Final rating target

| Stage | Rating target |
|---|---:|
| Current | 45/100 |
| Kernel + registry + policy | 60/100 |
| Evidence + approval centre | 70/100 |
| Adapter registry + final HUD | 78/100 |
| Real voice + brain provider | 85/100 |
| Document intake + portal scout | 90/100 |
| Full Kingsmen operational adapters + deployment modes | 95/100 |

The last 5% is long-term refinement: speed, polish, mobile command surface, advanced monitoring, continuous learning, and production hardening.

## Final definition of done

Jarvis is final-stage ready when:

- founder can launch it with one command;
- founder can talk or type to it;
- Jarvis understands command intent;
- Jarvis shows what it plans to do;
- Jarvis blocks unsafe actions;
- Jarvis asks approval for sensitive actions;
- Jarvis executes approved tools through adapters;
- Jarvis records evidence for every action;
- Jarvis can read Kingsmen status across candidate, document, route, finance, comms, and system surfaces;
- Jarvis can draft but not silently send sensitive communication;
- Jarvis can prepare manual packages;
- Jarvis can explain blockers;
- Jarvis can run in local and server modes;
- Jarvis remains inside Kingsmen law.
