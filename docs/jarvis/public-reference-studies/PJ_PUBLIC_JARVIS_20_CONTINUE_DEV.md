# PJ_PUBLIC_JARVIS_20_CONTINUE_DEV

Status: Recorded public reference study 20
Branch recorded: main
Project: continuedev/continue
Public URL: https://github.com/continuedev/continue
Study date: 2026-06-15
Kingsmen doctrine status: Reference only. Not adopted as authority.

---

## 1. Public project snapshot

Continue is a public open-source coding-agent project under `continuedev/continue`.

The public GitHub repository describes Continue as a coding agent available as a CLI, VS Code extension, and JetBrains plugin. The current README also says the repository is no longer actively maintained and is read-only for all users. That means Kingsmen should study its architecture and patterns, but must not treat it as a living core dependency.

Observed public traits:

- Repository: `continuedev/continue`
- Public status: public GitHub repository
- Approximate public scale at study time: 33k+ stars, 4k+ forks, 21k+ commits
- Main formats/platforms: CLI, VS Code extension, JetBrains plugin
- Primary implementation signals: TypeScript-majority repo, with JavaScript, Kotlin, Python, Rust, CSS, and other supporting code
- License: Apache-2.0
- Current maintenance warning: README says the repository is no longer actively maintained and read-only for all users

Important note: Kingsmen records this as a reference study only. It is not a dependency decision.

---

## 2. Why this matters for Kingsmen Jarvis

Continue teaches Kingsmen Jarvis the context-managed coding-assistant pattern.

Kingsmen Jarvis must not only edit files. It must know what context to load, what to ignore, which command mode to use, which model is appropriate, and how to keep repo rules close to the assistant.

Kingsmen needs this because the founder will say things like:

```text
Jarvis, continue N04 from where we stopped.
Jarvis, check only Candidate Portal files.
Jarvis, do not touch finance or payment files.
Jarvis, explain this error and repair it.
Jarvis, use cheap mode first, then deep reasoning if validator fails.
```

The useful pattern is not blind autonomy. The useful pattern is context discipline.

---

## 3. Kingsmen lessons extracted

### 3.1 Repo context must be selected, not dumped

A serious builder must not pour the whole repo into the model.

Kingsmen adaptation:

```text
JarvisRepoContextSelector
JarvisModuleScopeResolver
JarvisContextBudgetGuard
JarvisIgnorePolicy
JarvisRelevantFilePicker
JarvisConversationCompactor
```

For Kingsmen, this means:

- N04 work should load N04 files, doctrine, backend contracts, portal auth/profile/comms files, and validators.
- N05 work should load document vault schema, storage, signing, upload routes, and related validators.
- Finance files should not enter context unless the task needs finance.
- Candidate personal data must never be used as model context unless there is a strict purpose and evidence boundary.

### 3.2 Repo rules must sit beside the assistant

Continue-style assistants show the value of local repo configuration and rules.

Kingsmen adaptation:

```text
.jarvis/rules/
.jarvis/context/
.jarvis/commands/
.jarvis/model-routing.json
.jarvis/ignore
```

However, Kingsmen already has stronger doctrine files. Jarvis rules must point back to:

```text
docs/N00-doctrine/
kingsmen-laws.json
boot-blockers.json
jarvis-app-connector-law.md
source-confidence-bands.json
privacy-popia-law.json
```

No `.jarvis` rule may override the locked doctrine.

### 3.3 IDE and CLI should share the same brain

Continue supports multiple surfaces: CLI, VS Code, and JetBrains plugin.

Kingsmen adaptation:

```text
JarvisCli
JarvisHud
JarvisIdeBridge
JarvisVoiceShell
JarvisCommandEnvelope
```

All surfaces must submit the same command envelope into the backend/policy path.

No separate IDE brain. No separate CLI brain. No separate voice brain.

### 3.4 Code checks should be source-controlled

Continue's current repository description emphasizes source-controlled AI checks enforceable in CI.

Kingsmen adaptation:

```text
JarvisCiCheckPack
JarvisValidatorManifest
JarvisAiCheckDefinition
JarvisRepoHealthCheck
JarvisPreCommitReviewGate
```

For Kingsmen this becomes:

```text
repo file change
  -> validator manifest
  -> CI/local validator
  -> evidence ledger
  -> changed files report
  -> founder review
```

### 3.5 Maintenance status matters

The Continue repo currently warns that it is no longer actively maintained/read-only.

Kingsmen rule:

```text
Do not depend on abandoned public assistant repos as runtime foundations.
Study their patterns. Rebuild only the necessary parts inside Kingsmen doctrine.
```

---

## 4. What Kingsmen should adapt

```text
JarvisRepoContextSelector
JarvisContextBudgetGuard
JarvisIgnorePolicy
JarvisRelevantFilePicker
JarvisConversationCompactor
JarvisRepoRulesLoader
JarvisCli
JarvisIdeBridge
JarvisModelRoutingConfig
JarvisSourceControlledAiChecks
JarvisValidatorManifest
JarvisPreCommitReviewGate
JarvisCiCheckPack
```

---

## 5. What Kingsmen must reject

```text
unbounded repo context dumping
assistant rules overriding locked doctrine
IDE plugin acting outside backend policy
CLI command bypassing approval gates
model selection without budget/risk policy
using stale/unmaintained public repos as runtime authority
candidate data in coding context
secret files entering prompts or logs
source-controlled AI checks with no human accountability
```

---

## 6. Kingsmen build interpretation

Kingsmen Jarvis Builder Core should work like this:

```text
Founder command
  -> JarvisCommandEnvelope
  -> ModeManager
  -> DoctrinePolicyGate
  -> ModuleScopeResolver
  -> RepoContextSelector
  -> ContextBudgetGuard
  -> ModelRouter
  -> PatchWriter or ReadOnlyAnswer
  -> ValidatorRunner
  -> EvidenceLedger
  -> ChangedFilesReporter
  -> Commit/PR suggestion
```

If a command is production-risk:

```text
RiskClassifier
  -> ApprovalGate
  -> explicit founder approval
  -> action
  -> evidence proof
```

---

## 7. Placement in Kingsmen Jarvis architecture

Project 20 belongs under:

```text
Jarvis Builder Core
Jarvis Context Engine
Jarvis IDE/CLI Bridge
Jarvis Model Router
Jarvis Validator Layer
Jarvis Evidence Layer
```

It does not replace:

```text
Backend state machine
PostgreSQL Truth Vault
N00 doctrine
validators
founder approval
```

---

## 8. Verdict

Continue is useful to Kingsmen as a context-management and coding-assistant reference, especially for CLI/IDE surfaces and source-controlled checks.

It should not be imported blindly because its public README now states that the repository is no longer actively maintained and read-only.

Kingsmen should extract the patterns, then implement them under Kingsmen doctrine.
