# PJ_PUBLIC_JARVIS_14 — Leon AI Study

Status: RECORDED
Recorded for: Kingsmen Jarvis
Repository branch: main
Public reference: https://github.com/leon-ai/leon
Study date: 2026-06-15

---

## 1. Public Project Identity

Project: Leon
Repository: leon-ai/leon
Public description: Leon is an open-source personal AI assistant.
Visible public signals at study time:
- Public GitHub repository.
- Develop branch focused on the 2.0 Developer Preview.
- Approximately 17.3k stars and 1.4k forks shown on GitHub.
- README describes Leon as a personal AI assistant built around tools, context, memory, and agentic execution.
- Repository structure includes server runtime, app/web application, UI component area, skills, bridges, Python services, tools, tests, and context documents.

Source notes:
- GitHub page: https://github.com/leon-ai/leon
- README states Leon can operate locally, use dedicated tools, remember useful information, and complete tasks through deterministic workflows and agent-style execution.

---

## 2. Why This Project Matters To Kingsmen

Leon is important because it is not just a toy voice bot. It is a serious public personal-assistant framework that has moved from old intent-classification assistant design toward a more modern architecture:

```txt
Goal understanding
  -> mode selection
  -> native controlled skills OR agent skills
  -> tools/context/memory
  -> execution
  -> recovery when something goes wrong
```

This is very close to what Kingsmen Jarvis needs, except Kingsmen must be stricter because it handles candidate operations, applications, payments, documents, POPIA boundaries, and production app connectors.

Leon teaches Kingsmen that Jarvis must have **modes**, not one uncontrolled AI mode.

---

## 3. Leon Concepts Worth Adapting

### 3.1 Smart / Controlled / Agent Modes

Leon describes different ways to run depending on the task:

```txt
smart mode       -> assistant chooses path
controlled mode  -> deterministic native skills/actions
agent mode       -> plan step by step
```

Kingsmen version:

```txt
safe_chat_mode
  -> normal explanation, no external action

controlled_command_mode
  -> approved deterministic commands only

builder_mode
  -> repo file generation, validator execution, evidence logging

research_mode
  -> source-backed research with citations and confidence bands

connector_dry_run_mode
  -> Airtable/n8n/Supabase/etc. plan and validation only

production_approval_mode
  -> blocks action until founder explicitly approves
```

Kingsmen must not run production app actions from generic `smart` mode.

### 3.2 Skills -> Actions -> Tools -> Functions -> Binaries

Leon-native skills are described as following a chain like:

```txt
Skills -> Actions -> Tools -> Functions -> Binaries
```

Kingsmen should adapt this as:

```txt
JarvisSkill
  -> JarvisCommand
  -> JarvisToolAdapter
  -> ApprovedFunction
  -> Script/API/CLI implementation
```

Every level must have:

1. Scope
2. Risk level
3. Required permissions
4. Evidence event type
5. Validator requirement
6. Approval requirement if risky

### 3.3 Tools, Context, And Memory

Leon emphasizes tools, context, memory, and grounded environment behavior.

Kingsmen must adapt this as:

```txt
JarvisContextRouter
  -> reads current module, branch, repo state, doctrine, and active task

JarvisMemoryBoundary
  -> separates durable founder preferences, build history, candidate-safe summaries, and forbidden sensitive memory

JarvisToolRouter
  -> sends work to approved adapter only

JarvisEvidenceLedger
  -> records every meaningful decision and tool call
```

Memory must never become a dumping ground for raw candidate data or secrets.

### 3.4 Local And Remote AI Providers

Leon supports both local and remote AI providers to balance privacy, control, and capability.

Kingsmen version:

```txt
cheap/local/simple model later
  -> command classification, short summaries, routine checks

strong cloud model
  -> repo architecture, code generation, complex repair, serious reasoning

vision model
  -> screenshots, documents, UI proof

research-capable path
  -> current public facts, citations, source confidence
```

The model router must be controlled by policy. AI provider choice is not the same as permission to act.

---

## 4. What Kingsmen Should Build From This

Leon contributes the strongest lesson for the **mode manager + skill execution architecture**.

Kingsmen Jarvis should include:

```txt
JarvisModeManager
JarvisControlledMode
JarvisBuilderMode
JarvisResearchMode
JarvisConnectorDryRunMode
JarvisProductionApprovalMode
JarvisSkillActionToolFunctionChain
JarvisContextRouter
JarvisLayeredMemoryBoundary
JarvisModelProviderRouter
JarvisRecoveryPlanner
```

This should connect into existing Kingsmen modules:

```txt
apps/web/src/lib/jarvis/runtime/intent-router.ts
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/policy-gate.ts
apps/web/src/lib/jarvis/runtime/agent-orchestrator.ts
apps/web/src/lib/jarvis/runtime/memory/vault.ts
apps/web/src/lib/jarvis/runtime/connectors/registry.ts
apps/web/src/lib/jarvis/runtime/evidence-ledger.ts
```

---

## 5. What Kingsmen Must Reject

Kingsmen must not copy:

```txt
free-form agent execution as default
assistant-generated doctrine changes
unbounded memory
unreviewed community skills
production connector actions from smart mode
secrets stored in context documents or logs
local machine context leaking candidate data
agent mode bypassing deterministic validators
```

Kingsmen law remains stronger than the assistant.

The assistant may propose. Kingsmen doctrine, backend state machine, PostgreSQL truth, validators, evidence ledger, and founder approval decide.

---

## 6. Kingsmen Integration Pattern

```txt
Founder voice/chat/HUD command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> safe_chat_mode OR controlled_command_mode OR builder_mode OR research_mode OR connector_dry_run_mode
  -> DoctrinePolicyGate
  -> ContextRouter
  -> MemoryBoundary
  -> SkillActionToolFunctionChain
  -> ToolAdapter / BuilderCore / ResearchAgent / Validator / ConnectorDryRun
  -> EvidenceLedger
  -> ResponseComposer
  -> HUD / voice / chat output
```

Production path adds:

```txt
RiskClassifier
  -> ApprovalGate
  -> explicit founder approval
  -> production action
  -> evidence proof
```

---

## 7. How This Advances Kingsmen Jarvis

Leon helps Kingsmen Jarvis become:

```txt
more structured
more conversational
more mode-aware
more memory-aware
more tool-aware
more recoverable after errors
more compatible with local/cloud AI routing
```

This is directly useful for the founder goal:

```txt
Kingsmen Jarvis must hold conversations, connect to apps/tools/agents, build Kingsmen from beginning to finish, and stay under Kingsmen law.
```

The Leon lesson becomes the architecture basis for **JarvisModeManager** and the strict **Skill -> Action -> Tool -> Function** chain.

---

## 8. Build Decision

Adopt concepts:

```txt
YES: mode manager
YES: controlled vs agent execution distinction
YES: skills/actions/tools/functions chain
YES: local/remote model routing
YES: context and memory layering
YES: recovery planner
```

Reject risks:

```txt
NO: production actions from free-form agent mode
NO: unreviewed skills
NO: unbounded memory
NO: secrets in context
NO: AI rewriting Kingsmen doctrine without founder instruction
```

Final Kingsmen decision:

```txt
Leon AI = reference for Kingsmen Jarvis Mode Manager, Skill Execution Chain, Context Router, Memory Boundary, and Recovery Planner.
Kingsmen Jarvis remains the controlled sovereign builder/operator inside kingsmen-platform.
```
