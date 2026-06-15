# PJ Public Jarvis Study 17 — Aider

Status: RECORDED
Branch: main
Source project: Aider-AI/aider
Source URL: https://github.com/Aider-AI/aider
Kingsmen classification: Repo-native AI pair-programming reference

---

## 1. Why this project matters

Aider is a public AI pair-programming assistant that works in the terminal. It is useful for Kingsmen because Kingsmen Jarvis must eventually work directly inside the repository: read context, plan scoped changes, edit files, run validators, show diffs, and prepare evidence.

Aider's public README describes it as AI pair programming in the terminal. It supports building on an existing codebase, codebase mapping, Git integration, image and web-page context, voice-to-code, and lint/test loops.

For Kingsmen, this is not a replacement for Kingsmen law. It is a reference for the Builder Core.

---

## 2. Public project signals

Observed public signals:

```txt
Repository: Aider-AI/aider
Description: AI pair programming in your terminal
Stars observed: about 46k
Forks observed: about 4.6k
Commits observed: about 13k
License: Apache-2.0
Primary language: Python
```

---

## 3. What Kingsmen should adapt

Kingsmen should adapt these ideas:

```txt
JarvisRepoMap
JarvisPatchWriter
JarvisChangedFilesReporter
JarvisValidatorLoop
JarvisRepairLoop
JarvisCommitMessageDraft
JarvisVoiceToBuildCommand
JarvisLocalCloudModelSelector
JarvisDiffReviewFlow
```

Main lesson:

```txt
Kingsmen Jarvis must build through the repository, not outside it.
```

---

## 4. Kingsmen-safe workflow

```txt
Founder command
  -> JarvisCommandIntake
  -> builder_mode
  -> DoctrinePolicyGate
  -> RepoMap
  -> BuildPlanGenerator
  -> PatchWriter
  -> ValidatorRunner
  -> RepairLoop if needed
  -> ChangedFilesReporter
  -> EvidenceLedger
  -> CommitMessageDraft
  -> Founder approval before push or merge
```

---

## 5. What Kingsmen must not copy

Kingsmen must not copy any pattern that allows:

```txt
unreviewed repo-wide edits
unchecked changes
production changes from builder mode
candidate data in build context
missing evidence reports
```

Every Kingsmen build must stay scoped, validated, and recorded.

---

## 6. How it combines with previous studies

```txt
OpenJarvis -> agent and skill model
PocketPaw -> command center and security lesson
OpenHands -> software-agent workspace lesson
Leon -> mode manager and skill chain
Home Assistant Assist -> intent-first execution
Aider -> repo-native patch, diff, and validator loop
```

Together they become:

```txt
Founder HUD/voice/chat
  -> intent catalog
  -> mode manager
  -> doctrine policy gate
  -> repo map
  -> builder core
  -> patch writer
  -> validators
  -> evidence ledger
  -> changed-files report
  -> approval boundary
```

---

## 7. Kingsmen implementation path

Build order:

```txt
1. JarvisRepoMap
2. JarvisBuildPlanGenerator
3. JarvisPatchWriter
4. JarvisChangedFilesReporter
5. JarvisValidatorRunner
6. JarvisRepairLoop
7. JarvisCommitMessageDraft
8. JarvisPushApprovalGate
```

---

## 8. Final verdict

Aider is a high-value public reference for Kingsmen Jarvis Builder Core.

Kingsmen should use the lesson, not copy blindly:

```txt
repo-native coding power
+ Kingsmen doctrine
+ validators
+ evidence ledger
+ founder approval
= safe Kingsmen Jarvis Builder Core
```
