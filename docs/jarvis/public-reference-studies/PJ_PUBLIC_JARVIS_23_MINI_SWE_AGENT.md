# PJ_PUBLIC_JARVIS_23_MINI_SWE_AGENT

Status: RECORDED
Branch: main
Project number: 23
Public reference: SWE-agent/mini-swe-agent
Reference URL: https://github.com/SWE-agent/mini-swe-agent
Recorded for: Kingsmen Jarvis / Builder Core / validator-driven repair / Oracle Lite discipline

---

## 1. Public project identity

mini-SWE-agent is a public software-engineering agent project from the SWE-agent team.

The project describes itself as the minimal AI software engineering agent and as a roughly 100-line AI agent that solves GitHub issues or helps from the command line. Its repository states that it is radically simple, avoids huge configs and a giant monorepo, and still scores above 74% on SWE-bench verified.

The repository positions mini-SWE-agent as the default choice for users who want a quick local command-line tool, a simple control flow, and faster/stabler sandboxing and benchmark evaluation.

---

## 2. Why this matters to Kingsmen

Kingsmen has a strict rule: no useless layers.

mini-SWE-agent is valuable because it proves a serious builder agent does not need to become a giant system before it is useful. The important idea is not to copy it blindly, but to learn the discipline:

```text
small core
+ simple command loop
+ repo/task context
+ sandboxed execution
+ linear transcript
+ test/validator output
+ evidence trail
```

For Kingsmen Jarvis, this supports the Oracle Lite doctrine.

Kingsmen Jarvis should begin with a small, inspectable builder core that can:

```text
read the task
inspect relevant repo files
run safe local commands
apply scoped edits
run validators
record the transcript
show changed files
ask for approval before risky actions
```

This is better than building a large uncontrolled agent platform first.

---

## 3. What Kingsmen should adapt

Kingsmen should adapt the following patterns:

```text
JarvisMiniBuilderCore
JarvisLinearTrajectoryLedger
JarvisIndependentCommandRunner
JarvisSandboxCommandAdapter
JarvisLocalRepoTaskRunner
JarvisValidatorFirstLoop
JarvisSimpleControlFlow
JarvisBaselineAgentHarness
JarvisCommandTranscriptStore
JarvisRepairResultContract
JarvisNoUselessLayerCheck
```

The key design lesson:

```text
The first Kingsmen builder must be small enough to audit.
```

---

## 4. Kingsmen version of the mini repair loop

```text
Founder command / GitHub issue / validator failure
  -> JarvisMiniBuilderCore
  -> DoctrinePolicyGate
  -> RepoScopeResolver
  -> ContextBudgetGuard
  -> IndependentCommandRunner
  -> PatchWriter
  -> ValidatorRunner
  -> LinearTrajectoryLedger
  -> ChangedFilesReporter
  -> ApprovalGate if risky
  -> CommitSuggestion / PRSuggestion
```

For local Windows work:

```text
PowerShell command
  -> risk check
  -> run in approved project folder
  -> capture stdout/stderr/exit code
  -> summarize failure
  -> repair if safe
  -> rerun validator
  -> record proof
```

---

## 5. What Kingsmen must reject

Kingsmen must not copy these things blindly:

```text
unrestricted bash as a universal authority
commands outside approved project folders
production commands from a mini builder
blind model trust because the scaffold is simple
unbounded loops
terminal output containing secrets
candidate data in command transcripts
repo-wide edits without module scope
validator bypass because the agent thinks it is correct
```

The Kingsmen version must add:

```text
DoctrinePolicyGate
RiskClassifier
ApprovalGate
SecretsRedactionGuard
RepoScopeGuard
ValidatorRunner
EvidenceLedger
```

---

## 6. Relationship to SWE-agent Project 22

Project 22, SWE-agent, teaches the richer issue-to-patch repair loop and the agent-computer interface concept.

Project 23, mini-SWE-agent, teaches the opposite but equally important lesson:

```text
Start smaller.
Make it auditable.
Keep the loop simple.
Let validators prove the result.
Do not add layers unless they are necessary.
```

Together:

```text
SWE-agent -> rich repair workflow pattern
mini-SWE-agent -> minimal auditable implementation pattern
```

Kingsmen should use both lessons.

---

## 7. Kingsmen implementation implication

The first real Kingsmen Jarvis Builder Core should not begin as a giant multi-agent platform.

It should begin as:

```text
JarvisMiniBuilderCore
  + command intake
  + doctrine loader
  + repo scope resolver
  + safe command runner
  + validator runner
  + patch writer
  + evidence ledger
```

Then later, only when proven, it can gain:

```text
multi-agent delegation
IDE bridge
voice bridge
scheduled repair agents
advanced MCP connectors
```

This obeys the locked Kingsmen rule:

```text
No useless layers.
```

---

## 8. Build order for Kingsmen

Recommended Kingsmen build order from this study:

```text
1. JarvisMiniBuilderCore interface
2. Linear trajectory ledger table/schema
3. Safe PowerShell/Bash command runner
4. Repo scope guard
5. Validator runner
6. Changed-files reporter
7. Repair loop with max attempts
8. Founder approval boundary
9. Commit/PR suggestion only
10. Later: IDE/voice/channel bridges
```

---

## 9. Final Kingsmen decision

mini-SWE-agent is accepted as a Kingsmen reference for:

```text
minimal builder core
simple command execution
linear transcripts
sandbox-friendly command design
validator-first repair loops
Oracle Lite disciplined build path
```

It is not accepted as a direct authority over Kingsmen doctrine, production systems, candidate data, or deployment decisions.
