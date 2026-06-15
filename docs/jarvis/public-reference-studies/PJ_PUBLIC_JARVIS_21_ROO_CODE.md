# PJ_PUBLIC_JARVIS_21_ROO_CODE

Status: RECORDED_PUBLIC_REFERENCE_STUDY
Project number: 21
Recorded branch: main
Reference project: RooCodeInc/Roo-Code
Reference type: archived public open-source IDE coding agent
Kingsmen use: pattern study only, not runtime dependency

## Public source snapshot

Roo Code is a public archived GitHub repository under `RooCodeInc/Roo-Code`.

Its GitHub page describes it as:

> Roo Code gives you a whole dev team of AI agents in your code editor.

The page shows it as a public archive and states that the repository was archived by the owner on 2026-05-15. The README also says the Roo Code Extension was shut down on May 15th.

At the time of study, the visible GitHub snapshot showed approximately 24.2k stars, 3.3k forks, 7,073 commits, Apache-2.0 license, and TypeScript as the dominant language.

Visible repository structure included `.roo`, `.roomodes`, `.rooignore`, `AGENTS.md`, `apps`, `packages`, `schemas`, `src`, and `webview-ui`.

The README lists Roo Code capabilities including natural-language code generation, modes, refactoring/debugging, documentation updates, codebase questions, repetitive-task automation, and MCP server use.

The README describes these modes:

- Code Mode: everyday coding, edits, and file operations.
- Architect Mode: planning systems, specs, and migrations.
- Ask Mode: fast answers, explanations, and docs.
- Debug Mode: tracing issues, adding logs, and isolating root causes.
- Custom Modes: specialized modes for a team or workflow.

## Kingsmen interpretation

Roo Code is useful to Kingsmen as a design reference for mode-separated coding agents, not as a direct runtime dependency.

The strongest lesson is that Kingsmen Jarvis must not operate as one giant uncontrolled assistant. It must have separated modes, each with its own authority level, tool access, approval boundary, and evidence requirement.

## Kingsmen modules informed by this study

- JarvisModeManager
- JarvisCodeMode
- JarvisArchitectMode
- JarvisAskMode
- JarvisDebugMode
- JarvisCustomModeRegistry
- JarvisModePolicyMatrix
- JarvisRooIgnoreEquivalent
- JarvisAgentInstructionsLoader
- JarvisMcpGateway
- JarvisIdeWebviewBridge
- JarvisModeScopedToolAccess
- JarvisModeScopedEvidenceLedger

## Kingsmen mode mapping

Roo Code mode -> Kingsmen Jarvis equivalent:

- Code Mode -> `builder_mode`
- Architect Mode -> `architecture_plan_mode`
- Ask Mode -> `safe_chat_or_explain_mode`
- Debug Mode -> `diagnostic_repair_mode`
- Custom Modes -> `module_scoped_modes`

Kingsmen custom modes should include:

- `n00_doctrine_mode`
- `n01_runtime_mode`
- `n02_backend_kernel_mode`
- `n03_truth_vault_mode`
- `n04_candidate_portal_mode`
- `n05_document_vault_mode`
- `n06_route_universe_mode`
- `airtable_sync_mode`
- `n8n_worker_mode`
- `source_research_mode`
- `deployment_dry_run_mode`

## What Kingsmen should adapt

1. Mode-separated assistant behavior.
2. A source-controlled `.jarvis/modes` or equivalent rules folder.
3. Mode-specific tool permission matrices.
4. Repo ignore rules for secrets, credentials, large files, and candidate-sensitive data.
5. Agent instruction files stored in the repo, but subordinate to locked Kingsmen doctrine.
6. MCP/server gateway concept, but only through Kingsmen policy gates.
7. IDE/HUD webview pattern for founder review and changed-file visibility.
8. Custom mode registry for Kingsmen N-series modules.

## What Kingsmen must reject

1. Depending on an archived/shut-down project as a live foundation.
2. Any mode that can override Kingsmen doctrine.
3. Any custom mode that can grant itself production authority.
4. Any MCP server or tool adapter not registered, scoped, and logged.
5. IDE assistant actions that bypass backend policy, validators, or founder approval.
6. Repo-wide edits without module scope.
7. Secret files entering prompts, logs, diffs, or commits.
8. Candidate data being used as free-form coding context.

## Required Kingsmen guardrails

Every Jarvis mode must declare:

- mode id
- purpose
- allowed commands
- allowed files/folders
- forbidden files/folders
- allowed tools
- forbidden tools
- approval requirements
- evidence requirements
- validator requirements
- rollback/failure path

## Proposed repo structure

```text
.jarvis/
  modes/
    builder-mode.json
    architecture-plan-mode.json
    safe-chat-mode.json
    diagnostic-repair-mode.json
    source-research-mode.json
    deployment-dry-run-mode.json
  ignore/
    jarvis-ignore.rules
  instructions/
    AGENTS.md
    KINGSMEN_AGENT_RULES.md
  policies/
    mode-policy-matrix.json
    mcp-tool-policy.json
```

## Kingsmen execution flow

```text
Founder command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> selected mode
  -> ModePolicyMatrix
  -> DoctrinePolicyGate
  -> RiskClassifier
  -> scoped tool access
  -> patch / explanation / diagnostic action
  -> validators if files changed
  -> EvidenceLedger
  -> ChangedFilesReport
  -> approval or commit suggestion
```

## Final Kingsmen decision

Adopt Roo Code's mode separation concept.

Do not depend on Roo Code as a runtime dependency because the public project is archived and the extension was shut down.

Kingsmen Jarvis must implement its own mode manager, mode policy matrix, and module-scoped custom modes inside the Kingsmen repo.
