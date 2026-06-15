# PJ_PUBLIC_JARVIS_22_SWE_AGENT

Status: RECORDED
Branch recorded: main
Project number: 22
Public reference: SWE-agent/SWE-agent
Reference type: public software-engineering agent / issue-to-patch repair system
Kingsmen use: pattern study only; not runtime authority

---

## 1. Public project identity

Public repository:

```txt
SWE-agent/SWE-agent
```

Public description:

```txt
SWE-agent takes a GitHub issue and tries to automatically fix it, using your LM of choice.
```

Important current warning from the public README:

```txt
Most current development effort is on mini-SWE-agent, which has superseded SWE-agent.
General recommendation from the project is to use mini-SWE-agent going forward.
```

Therefore Kingsmen records SWE-agent as a design and pattern study, not as a direct runtime dependency.

---

## 2. What this project teaches Kingsmen

SWE-agent gives Kingsmen Jarvis the issue-to-patch repair loop.

The key pattern is:

```txt
issue / task
  -> repo inspection
  -> file navigation
  -> targeted edits
  -> test execution
  -> result interpretation
  -> patch output
  -> trajectory / evidence record
```

Kingsmen needs this because the founder will say things like:

```txt
Jarvis, fix the failing N04 validator.
Jarvis, inspect why the auth route broke.
Jarvis, repair the migration but do not touch unrelated files.
Jarvis, create a patch and show me proof before commit.
```

SWE-agent proves that the assistant needs a designed interface for software work. It is not enough to ask a model to write code. The model needs a controlled agent-computer interface.

---

## 3. Kingsmen adaptation

Kingsmen should adapt the following concepts:

```txt
JarvisIssueToPatchRunner
JarvisAgentComputerInterface
JarvisRepoNavigationTools
JarvisTargetedEditTool
JarvisTestExecutionTool
JarvisTrajectoryRecorder
JarvisPatchOutputContract
JarvisRepairAttemptLedger
JarvisIssueContextLoader
JarvisNoUnrelatedFileGuard
JarvisMiniRepairMode
JarvisBenchmarkHarness
```

---

## 4. Kingsmen issue-to-patch flow

```txt
Founder command / GitHub issue / validator failure
  -> JarvisCommandIntake
  -> JarvisModeManager selects repair_mode
  -> DoctrinePolicyGate
  -> IssueContextLoader
  -> RepoMap + file scope resolver
  -> AgentComputerInterface
  -> targeted file reads
  -> targeted edits
  -> validator/test execution
  -> output parser
  -> repair loop if safe
  -> patch summary
  -> trajectory evidence ledger
  -> founder review
  -> commit/PR only after approval
```

---

## 5. What Kingsmen must reject

Kingsmen must not copy these risks:

```txt
maximal autonomous agency as default
repo-wide edits without module scope
issue fixes that ignore Kingsmen doctrine
cybersecurity/offensive modes inside Kingsmen Jarvis default build
silent terminal/test execution
unbounded repair loops
patches without evidence trail
candidate data in issue context
secrets in logs, prompts, trajectories, diffs, or commits
```

The public SWE-agent project includes cybersecurity-oriented modes. Kingsmen must keep offensive security functionality out of the default Jarvis build unless the founder explicitly creates a separate, controlled, legal security-testing module later.

---

## 6. Kingsmen authority boundary

SWE-agent can inspire the repair engine, but Kingsmen authority remains:

```txt
PostgreSQL Truth Vault
Backend state machine
GitHub repository
Locked doctrine files
Validators and boot-blockers
Evidence ledger
Founder approval
```

Jarvis may propose and generate a patch. It may not silently become the architect, compliance officer, production deployer, or source of truth.

---

## 7. Required Kingsmen implementation modules later

When Kingsmen starts implementing Jarvis Builder Core, create these modules only if validator-provable:

```txt
packages/jarvis-builder/src/issue-to-patch-runner.ts
packages/jarvis-builder/src/agent-computer-interface.ts
packages/jarvis-builder/src/repo-navigation-tools.ts
packages/jarvis-builder/src/targeted-edit-tool.ts
packages/jarvis-builder/src/test-execution-tool.ts
packages/jarvis-builder/src/trajectory-recorder.ts
packages/jarvis-builder/src/patch-output-contract.ts
packages/jarvis-builder/src/no-unrelated-file-guard.ts
packages/jarvis-builder/src/repair-attempt-ledger.ts
packages/jarvis-builder/src/mini-repair-mode.ts
```

No useless layers: each module must directly support issue-to-patch building, validation, evidence, or founder review.

---

## 8. Final Kingsmen lesson

SWE-agent teaches Kingsmen this rule:

```txt
Jarvis must not just answer coding questions.
Jarvis must produce scoped patches with test evidence and a replayable repair trail.
```

That is the difference between a chat assistant and a real Kingsmen builder.
