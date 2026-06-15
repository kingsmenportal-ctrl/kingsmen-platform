# PJ Public Jarvis Study 18 — Open Interpreter

Status: RECORDED
Recorded for: Kingsmen Jarvis build doctrine
Repository branch: main
Study type: Public assistant / coding-agent reference

---

## 1. Public project

Project: Open Interpreter
Repository: `openinterpreter/openinterpreter`
Public description: lightweight coding agent for open models like DeepSeek, Kimi, and Qwen.

The current public project is a Rust-era Open Interpreter repo with a terminal/TUI workflow, model/harness switching, skills, hooks, permissions, MCP support, sandboxing, and computer-use testing capability.

---

## 2. Why this matters to Kingsmen

Open Interpreter is important because Kingsmen Jarvis must eventually operate like a controlled local builder/operator:

```txt
Founder command
  -> Jarvis understands intent
  -> Jarvis checks doctrine
  -> Jarvis creates a plan
  -> Jarvis runs safe scripts/validators
  -> Jarvis reads results
  -> Jarvis repairs or explains failure
  -> Jarvis records evidence
```

The key lesson is not uncontrolled automation. The key lesson is controlled command execution with local state, sandboxing, permissions, and visible output.

---

## 3. Useful ideas to adapt

Kingsmen should adapt these ideas:

```txt
JarvisTerminalRuntime
JarvisSandboxExecutor
JarvisCommandHarness
JarvisModelHarnessSelector
JarvisPermissionPrompt
JarvisSkillsRuntime
JarvisHooksRuntime
JarvisMcpBridge
JarvisLocalSessionState
JarvisQaBrowserTester
JarvisNativeAppTester
JarvisValidatorCommandRunner
JarvisExecutionTranscript
```

---

## 4. What Kingsmen must reject

Kingsmen must reject:

```txt
unrestricted shell execution
silent command execution
production app control from terminal mode
secrets printed into logs
model-driven decisions without policy gate
repo-wide changes without scope
long-running agent loops without checkpoints
browser/native app automation bypassing login/CAPTCHA/OTP rules
```

---

## 5. Kingsmen integration pattern

Correct Kingsmen flow:

```txt
Founder voice/chat/HUD command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> builder_mode or operator_mode
  -> DoctrinePolicyGate
  -> RiskClassifier
  -> PermissionPrompt if command execution is needed
  -> SandboxExecutor
  -> ValidatorCommandRunner
  -> OutputParser
  -> RepairLoop if safe
  -> EvidenceLedger
  -> ChangedFilesReporter
  -> ResponseComposer
```

Production-risk commands must add:

```txt
ApprovalGate
  -> explicit founder approval
  -> production connector/action
  -> evidence proof
```

---

## 6. How this helps build Kingsmen from beginning to finish

Open Interpreter's lesson helps Kingsmen Jarvis become capable of:

```txt
running npm/pnpm build checks
running TypeScript checks
running migration validators
running Jarvis validator scripts
reading command output
summarizing failures
creating repair plans
running safe local smoke tests
using Kimi/Qwen/DeepSeek-style open models where useful
switching stronger models only when needed
```

This supports the future Kingsmen target:

```txt
Jarvis can build Kingsmen modules from repo instructions,
validate them,
record proof,
and ask before risky actions.
```

---

## 7. Kingsmen build modules influenced by this study

This study should influence:

```txt
apps/web/src/lib/jarvis/runtime/sandbox-executor.ts
apps/web/src/lib/jarvis/runtime/command-harness.ts
apps/web/src/lib/jarvis/runtime/model-harness-selector.ts
apps/web/src/lib/jarvis/runtime/permission-prompt.ts
apps/web/src/lib/jarvis/runtime/execution-transcript.ts
apps/web/src/lib/jarvis/runtime/validator-command-runner.ts
apps/web/src/lib/jarvis/runtime/qa-browser-tester.ts
apps/web/src/lib/jarvis/runtime/native-app-tester.ts
manifests/jarvis/jarvis-command-execution-policy.json
manifests/jarvis/jarvis-sandbox-policy.json
manifests/jarvis/jarvis-harness-catalog.json
```

---

## 8. Final Kingsmen verdict

Open Interpreter should not become the authority over Kingsmen.

It should become a reference for:

```txt
safe local command execution
model/harness routing
sandbox discipline
permission prompts
skills/hooks/MCP integration
computer-use QA testing
local session continuity
```

Kingsmen authority remains:

```txt
PostgreSQL Truth Vault
Backend state machine
GitHub repository
DoctrinePolicyGate
ApprovalGate
Validators
EvidenceLedger
Founder approval
```
