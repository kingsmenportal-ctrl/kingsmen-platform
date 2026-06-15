# PJ Public Jarvis Study 16 — OpenHands

Status: RECORDED
Repository branch recorded to: main
Doctrine anchor: docs/N00-doctrine/jarvis-app-connector-law.md
Purpose: Extract the software-agent / repo-builder lessons from OpenHands for Kingsmen Jarvis.

---

## 1. Public Project

Project: OpenHands
Former name: OpenDevin
Category: AI software-development agent platform
Primary relevance to Kingsmen: repo-aware builder, sandboxed execution, command-line/browser operation, software-agent lifecycle, multi-agent/evaluation discipline.

OpenHands is not a Jarvis-branded assistant, but it is one of the strongest public references for the exact capability Kingsmen Jarvis needs: helping build a real repository by writing code, using a command line, browsing, testing, and iterating in a controlled environment.

---

## 2. What OpenHands Teaches Kingsmen

The key lesson is that a serious builder assistant is not only a chatbot.

A serious builder assistant needs:

1. A workspace.
2. A sandbox.
3. Shell access.
4. File editing.
5. Browser/research ability.
6. Test execution.
7. Iterative repair.
8. Human-facing progress UI.
9. Lifecycle control.
10. Security boundaries.

For Kingsmen, this means Jarvis must become a controlled software operator that can help build Kingsmen from beginning to finish, while never bypassing doctrine, validators, repository evidence, or founder approval.

---

## 3. Kingsmen Adaptations

Kingsmen should adapt these concepts:

```txt
JarvisWorkspace
JarvisSandboxExecutor
JarvisRepoExplorer
JarvisPatchWriter
JarvisShellRunner
JarvisBrowserScout
JarvisValidatorRunner
JarvisRepairLoop
JarvisLifecycleController
JarvisBuildSession
JarvisProgressStreamer
JarvisSecurityAnalyzer
```

These must plug into the existing Kingsmen Jarvis runtime, not replace it.

---

## 4. Kingsmen Builder Flow

Target flow:

```txt
Founder command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> builder_mode
  -> DoctrinePolicyGate
  -> RepoExplorer
  -> BuildPlanGenerator
  -> ApprovalGate if risky
  -> PatchWriter
  -> SandboxExecutor
  -> ValidatorRunner
  -> RepairLoop
  -> EvidenceLedger
  -> ChangedFilesReport
  -> CommitSuggestion
```

Production/deployment remains blocked until explicit founder approval.

---

## 5. What Kingsmen Must Reject

Kingsmen must reject:

```txt
unrestricted shell access
silent file edits with no evidence
production environment execution by default
repo-wide rewrites without module scope
AI deciding architecture against doctrine
automatic deployment without approval
secret exposure through logs or terminal output
agent browsing without source confidence rules
long autonomous loops without progress checkpoints
```

OpenHands-style power is valuable only if it is wrapped by Kingsmen policy gates.

---

## 6. Fit With Current Kingsmen Build

Current Kingsmen Jarvis already has these relevant directions:

```txt
apps/web/src/app/jarvis/                 HUD surface
apps/web/src/app/api/jarvis/             API command routes
apps/web/src/lib/jarvis/runtime/         runtime/router/policy concepts
manifests/jarvis/                        laws, command registry, tool policies
scripts/jarvis/                          validators and build proofs
docs/N00-doctrine/jarvis-app-connector-law.md
```

OpenHands should influence the next Kingsmen build layer:

```txt
JarvisBuilderCore
JarvisSandboxExecutor
JarvisRepoExplorer
JarvisPatchWriter
JarvisValidatorRunner
JarvisRepairLoop
JarvisChangedFilesReporter
```

This is the layer that lets Kingsmen Jarvis build Kingsmen modules safely.

---

## 7. Required Kingsmen Safety Boundary

Any OpenHands-inspired Kingsmen builder must enforce:

1. Work on a feature branch or controlled build branch.
2. Read doctrine before action.
3. Create a build plan first.
4. Keep edits inside the requested module/scope.
5. Never expose secrets.
6. Run validators before commit suggestions.
7. Produce changed-file reports.
8. Log all actions to evidence.
9. Ask approval for production-risk actions.
10. Never deploy silently.

---

## 8. Kingsmen Verdict

OpenHands becomes the Kingsmen lesson for:

```txt
Jarvis as repo-aware software builder
sandboxed code execution
iterative repair loop
shell/browser/file workspace control
validator-first development
human-supervised lifecycle control
```

It must not become the uncontrolled brain of Kingsmen.

Kingsmen Jarvis remains:

```txt
Doctrine-governed
Repository-first
Validator-proven
Evidence-ledgered
Founder-approved
PostgreSQL-truth-aligned
Backend-state-machine-controlled
```
