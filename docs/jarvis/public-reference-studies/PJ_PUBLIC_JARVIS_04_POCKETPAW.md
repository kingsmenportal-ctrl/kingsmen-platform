# PJ_PUBLIC_JARVIS_04 — PocketPaw Public Reference Study

Status: RECORDED
Repository target: kingsmen-platform
Branch recorded: main
Study type: Public Jarvis / personal AI reference
Project studied: pocketpaw/pocketpaw
Public source URL: https://github.com/pocketpaw/pocketpaw

---

## 1. Why this project matters

PocketPaw is a strong public reference because it is not only a toy voice assistant. It is presented as a self-hosted personal AI agent with a native desktop app, web dashboard, multiple communication channels, multiple agent backends, many tools, integrations, memory, and a security stack.

For Kingsmen Jarvis, PocketPaw is valuable because it shows how a personal assistant can become a practical command center instead of only a chat screen.

Kingsmen must not copy PocketPaw blindly. Kingsmen must extract the useful design patterns and place them under Kingsmen doctrine, policy gates, evidence ledgers, repository-first building, and founder approval.

---

## 2. Public project snapshot

Public repo: `pocketpaw/pocketpaw`

Observed public metadata:

- Public repository.
- Default branch: `main`.
- Includes folders such as `.github`, `assets`, `client`, `connectors`, `deploy/discord`, `docs`, `installer`, `scripts`, `src/pocketpaw`, and `tests`.
- README describes it as an AI agent that runs on the user's machine, not someone else's.
- README describes a native desktop app and web dashboard.
- README says it can talk over Discord, Slack, WhatsApp, Telegram, or the browser.
- README says it is beta and actively developed.

---

## 3. Main architecture lessons for Kingsmen

PocketPaw has several ideas Kingsmen should learn from:

1. Native desktop app plus web dashboard.
2. Event-driven message bus.
3. Multi-channel input.
4. Agent backend abstraction.
5. REST and WebSocket connection between desktop client and backend.
6. System tray / global shortcuts / quick ask style controls.
7. Multi-window or side-panel workflow.
8. Many tools behind a single assistant.
9. Memory and session history.
10. Security guard, tool policies, approval modes, audit logs.

These are directly relevant to Kingsmen Jarvis because Kingsmen needs a responsive command surface and a serious backend control layer.

---

## 4. What Kingsmen should adapt

### 4.1 Desktop + browser dashboard pattern

Kingsmen should eventually support:

```txt
Jarvis Web HUD
  - runs inside Kingsmen portal
  - used for founder command center
  - shows status, approvals, build progress, and evidence

Jarvis Desktop Helper
  - optional later
  - opens local repo folder
  - starts local dev server
  - runs validators
  - captures local evidence
  - sends safe commands to Kingsmen backend
```

Do not start with a heavy desktop app. Start with the web HUD and PowerShell tools, then add desktop helper later if it is useful.

### 4.2 Event-driven message bus pattern

PocketPaw's event-driven style is useful. Kingsmen Jarvis should use a controlled internal event model:

```txt
JarvisCommandReceived
JarvisIntentClassified
JarvisPolicyChecked
JarvisPlanCreated
JarvisApprovalRequired
JarvisRepoFileCreated
JarvisValidatorStarted
JarvisValidatorPassed
JarvisValidatorFailed
JarvisConnectorDryRunCompleted
JarvisProductionActionBlocked
```

Every event should be written to the evidence ledger.

### 4.3 Agent backend abstraction

PocketPaw supports multiple agent backends. Kingsmen should adapt the same idea, but with stricter doctrine:

```txt
KingsmenAgentBackend
  - OpenAI backend
  - local Ollama backend later
  - code-assistant backend
  - research backend
  - validator/auditor backend
```

The agent backend must be swappable, but Kingsmen authority must not move into the model. The model proposes; Kingsmen policy, state machine, validators, and founder approval decide.

### 4.4 Communication channels

PocketPaw supports multiple channels. Kingsmen must be more disciplined:

```txt
Allowed Kingsmen channels:
  - Jarvis HUD
  - Founder console
  - Email primary
  - WhatsApp urgent-only
  - SMS backup-only
  - GitHub issue/PR comments where useful
```

Do not make WhatsApp or Telegram the central nervous system. Kingsmen doctrine already locks email as primary and WhatsApp as urgent-only.

### 4.5 Tool catalog

PocketPaw lists many tools: browser, web search, image generation, voice/TTS/STT, OCR, research, delegation, skills, integrations.

Kingsmen should adapt this into an approved tool catalog:

```txt
Approved Kingsmen tool families:
  - repo file tools
  - Git/GitHub tools
  - validator tools
  - documentation tools
  - source research tools
  - browser scout tools
  - Airtable mirror tools
  - n8n staging workflow tools
  - Supabase/PostgreSQL migration tools
  - Gmail/Drive/Calendar tools
  - PayFast evidence tools
  - WhatsApp urgent alert tools
  - Oracle deploy tools
```

Every tool must have allowed actions, forbidden actions, required secrets, dry-run mode, approval rules, and evidence logging.

### 4.6 Security stack pattern

PocketPaw's security posture is important: guardian review, injection scanning, tool policy, plan mode, audit log, and self-audit ideas.

Kingsmen should adapt this as:

```txt
JarvisPolicyGate
JarvisPromptInjectionScanner
JarvisToolPolicy
JarvisPlanMode
JarvisApprovalGate
JarvisAuditLedger
JarvisSelfAuditReport
JarvisProductionRiskClassifier
```

This is one of the strongest lessons from PocketPaw.

---

## 5. What Kingsmen must reject

Kingsmen must reject any pattern that would weaken founder control or production safety:

1. Any channel that can silently trigger production changes.
2. Any model backend that can execute tools without policy gate review.
3. Any connector that stores secrets in ordinary files or chat.
4. Any direct production action without founder approval.
5. Any general-purpose memory that stores candidate data without strict retention/redaction boundaries.
6. Any app connector that bypasses PostgreSQL truth and backend state-machine control.
7. Any assistant habit of doing too much in one step without validator evidence.

---

## 6. How PocketPaw fits into one Kingsmen Jarvis system

PocketPaw contributes the command-center architecture lesson.

Kingsmen Jarvis combined system:

```txt
Founder voice/chat/HUD command
  -> Jarvis Command Intake
  -> Event Bus
  -> Conversation Engine
  -> Intent Router
  -> Policy Gate
  -> Approval Gate when needed
  -> Agent Backend Router
  -> Tool Connector Router
  -> Builder Core / App Connector / Research / Validator
  -> Evidence Ledger
  -> Response Composer
  -> Founder HUD update
```

This gives Kingsmen the power of many agents and apps while keeping one controlled operating flow.

---

## 7. Current Kingsmen repo impact

This study supports these Kingsmen Jarvis modules:

```txt
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/intent-router.ts
apps/web/src/lib/jarvis/runtime/policy-gate.ts
apps/web/src/lib/jarvis/runtime/evidence-ledger.ts
apps/web/src/lib/jarvis/runtime/connectors/registry.ts
apps/web/src/lib/jarvis/runtime/orchestrator/agent-orchestrator.ts
apps/web/src/app/jarvis/JarvisAgentClient.tsx
apps/web/src/app/api/jarvis/command/route.ts
apps/web/src/app/api/jarvis/status/route.ts
```

It also supports future modules:

```txt
JarvisEventBus
JarvisConnectorDryRunEngine
JarvisPromptInjectionScanner
JarvisPlanMode
JarvisSecurityAuditRunner
JarvisChannelRouter
JarvisDesktopHelperBridge
```

These must be built only when needed and validator-provable.

---

## 8. Build order contribution

PocketPaw suggests this Kingsmen Jarvis build order:

1. Harden Jarvis web HUD.
2. Add event ledger for every command.
3. Add tool policy gate.
4. Add connector registry with dry-run mode.
5. Add agent backend abstraction.
6. Add approval gate for production-risk actions.
7. Add memory with redaction and retention boundaries.
8. Add optional desktop helper only after web/control-plane stability.

---

## 9. Final verdict

PocketPaw should influence Kingsmen Jarvis more than most small hobby Jarvis projects because it has the right categories:

- desktop and dashboard presence
- channels
- agent backends
- tools
- memory
- security
- audit logs

But Kingsmen must remain stricter:

- repository-first build
- PostgreSQL truth
- backend state machine
- validators
- source confidence
- founder approval
- no useless layers

PocketPaw = useful command-center reference.
Kingsmen Jarvis = sovereign controlled builder/operator for Kingsmen.
