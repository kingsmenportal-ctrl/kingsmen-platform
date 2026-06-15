# PJ_PUBLIC_JARVIS_19 — Cline

Status: RECORDED
Repository target: kingsmen-platform
Branch recorded: main
Study category: public Jarvis / coding-agent reference

---

## Public project

Project: Cline
Repository: cline/cline
Public description: open-source coding agent in IDE and terminal; autonomous coding agent as SDK, IDE extension, or CLI assistant.

Cline is relevant to Kingsmen because it is one of the strongest public examples of a repo-native coding agent. It can operate through CLI, IDE extension, SDK, and a Kanban-style multi-agent task board.

---

## What Cline teaches Kingsmen

Cline gives Kingsmen Jarvis the IDE-native builder lesson.

Kingsmen Jarvis must be able to work inside the Kingsmen repository with a controlled builder flow:

```txt
Founder command
  -> Jarvis reads doctrine
  -> Jarvis maps repo scope
  -> Jarvis plans
  -> Jarvis requests approval where required
  -> Jarvis edits files
  -> Jarvis runs validators
  -> Jarvis reports changed files
  -> Jarvis records evidence
  -> Jarvis suggests commit or pull request
```

Cline's strongest ideas for Kingsmen are:

1. Plan mode before action mode.
2. Human-in-the-loop approval for file edits and terminal commands.
3. Project-specific rules files.
4. Diff review and checkpoint/undo habit.
5. Terminal command execution with output monitoring.
6. Model/provider flexibility.
7. Plugin and MCP extension layer.
8. Multi-agent task board pattern.
9. Scheduled repo-health/reporting agents.
10. Channel connectors with access control.

---

## Kingsmen adaptation

Cline maps into Kingsmen as:

```txt
Cline Plan mode               -> JarvisBuildPlanMode
Cline Act mode                -> JarvisApprovedActionMode
Cline rules                   -> Kingsmen doctrine + .jarvisrules
Cline diffs/checkpoints       -> JarvisChangedFilesReport + evidence ledger
Cline terminal execution      -> JarvisValidatorCommandRunner
Cline plugins/MCP             -> JarvisToolAdapterBridge
Cline multi-agent teams       -> JarvisBuilderSquad
Cline scheduled agents        -> JarvisScheduledHealthReports
Cline channel connectors      -> JarvisGateway with sender allowlist
```

---

## Kingsmen components to build from this lesson

```txt
JarvisBuildPlanMode
JarvisApprovedActionMode
JarvisRepoRulesLoader
JarvisDiffCheckpointLedger
JarvisValidatorCommandRunner
JarvisTerminalOutputWatcher
JarvisToolAdapterBridge
JarvisMcpBridge
JarvisBuilderSquad
JarvisScheduledRepoHealthAgent
JarvisChannelAccessControl
```

---

## What Kingsmen must reject

Kingsmen must not copy any pattern that allows:

1. Auto-approval by default.
2. Repo-wide edits without module scope.
3. Terminal commands without risk classification.
4. Production deployment from builder mode.
5. Secrets entering prompts, logs, or commits.
6. Community tools/MCP servers without review.
7. Messaging-channel users controlling Jarvis without pairing and allowlist.
8. Scheduled agents performing production-risk actions without founder approval.

---

## Required Kingsmen flow

```txt
Founder HUD / voice / chat
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> JarvisBuildPlanMode
  -> DoctrinePolicyGate
  -> RiskClassifier
  -> Founder approval if risky
  -> JarvisApprovedActionMode
  -> Repo file edits / validator commands only
  -> EvidenceLedger
  -> ChangedFilesReport
  -> Commit/Pull Request suggestion
```

Production-risk actions must always go through the Kingsmen approval boundary and must not be executed only because a coding agent proposed them.

---

## Decision for Kingsmen

Cline is a major reference for the Kingsmen Jarvis Builder Core.

Kingsmen should adapt Cline's plan/action split, project rules, diff review, terminal-output monitoring, plugin/MCP bridge, and scheduled repo-health patterns.

Kingsmen must remain stricter than Cline in production boundaries because Kingsmen handles candidate data, payments, applications, communications, and South African opportunity evidence.
