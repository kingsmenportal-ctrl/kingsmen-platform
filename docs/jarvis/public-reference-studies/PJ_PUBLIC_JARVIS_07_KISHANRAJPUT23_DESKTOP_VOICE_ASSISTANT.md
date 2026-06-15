# PJ Public Jarvis Study 07 — kishanrajput23 / Jarvis-Desktop-Voice-Assistant

Status: RECORDED
Repository target: kingsmen-platform
Branch recorded: main
Doctrine boundary: docs/N00-doctrine/jarvis-app-connector-law.md
Study purpose: extract useful public Jarvis lessons for Kingsmen Jarvis without copying unsafe or uncontrolled architecture.

---

## 1. Public project identity

Project studied:

```txt
kishanrajput23/Jarvis-Desktop-Voice-Assistant
```

Public topic listing:

```txt
GitHub topic: jarvis-assistant
Topic listing count at review time: 109 public repositories
Language grouping: mostly Python
Project summary from topic listing: a Python based desktop voice assistant capable of executing system-level commands, integrating speech recognition and text-to-speech, and handling asynchronous user interactions.
Visible topic rank signal: listed with hundreds of stars and updated Jan 20, 2026.
```

Source note: this study is based on the public GitHub topic listing and repository identity, not on importing the code into Kingsmen.

---

## 2. What kind of Jarvis this is

This is a classic desktop voice assistant pattern:

```txt
microphone input
  -> speech recognition
  -> command detection
  -> text-to-speech response
  -> local desktop/system action
  -> loop back to listening
```

It is useful because Kingsmen Jarvis must eventually feel responsive and usable from the founder's machine, not only through a web form.

It is not a complete production agent platform. It is a voice-command desktop assistant reference.

---

## 3. Useful lessons for Kingsmen Jarvis

### 3.1 Wake/listen/respond loop

Kingsmen Jarvis needs a simple interaction loop:

```txt
wake or button press
  -> listen
  -> transcribe
  -> classify intent
  -> apply doctrine/policy gate
  -> execute safe route or ask for approval
  -> speak/respond
  -> log evidence
```

This is stronger than a dead chat box because the founder can operate Kingsmen while working in PowerShell, GitHub, browser, or phone.

### 3.2 Asynchronous user interaction

The public project is useful because the topic listing highlights asynchronous interaction. Kingsmen Jarvis must not freeze during long jobs.

Kingsmen version:

```txt
Founder says: "Jarvis, validate N04."
Jarvis replies immediately: "Validation started."
Background worker runs validator.
HUD updates progress.
Evidence ledger records result.
Jarvis reports pass/fail with repair path.
```

### 3.3 Local system command boundary

Desktop voice assistants often open apps, run system commands, browse websites, or fetch information. Kingsmen should adapt this only through a local utility adapter.

Allowed Kingsmen local utility actions:

```txt
open repo folder
open Jarvis HUD
open local dev server
run git status
run validator scripts
open generated report
open safe documentation
capture non-secret screenshot proof
```

Forbidden without explicit approval:

```txt
push to main
run destructive scripts
send production messages
activate production workflows
edit secrets
change payment settings
submit candidate applications
```

### 3.4 Voice command vocabulary

Kingsmen should define a clear phrase set:

```txt
Jarvis, status.
Jarvis, open Kingsmen repo.
Jarvis, show changed files.
Jarvis, validate current module.
Jarvis, explain this error.
Jarvis, prepare commit evidence.
Jarvis, build next module.
Jarvis, stop.
Jarvis, cancel action.
Jarvis, require approval.
```

These commands must map to explicit registry entries, not random natural-language shell execution.

---

## 4. What Kingsmen must reject

Kingsmen must not copy weak hobby-assistant behavior:

```txt
uncontrolled shell execution
voice-only production actions
blind web/app automation
hardcoded secrets
unlogged system changes
candidate data stored in loose files
assistant acting without founder approval
```

Kingsmen must keep:

```txt
policy gate
approval gate
evidence ledger
validator runner
repo-first build rule
PostgreSQL truth
backend state machine authority
```

---

## 5. Kingsmen adaptation

The correct adaptation is not to import the public project as-is. The correct adaptation is to build a Kingsmen-controlled desktop voice bridge.

Proposed Kingsmen modules:

```txt
apps/web/src/app/api/jarvis/voice/route.ts
apps/web/src/app/api/jarvis/voice/events/route.ts
apps/web/src/lib/jarvis/voice/voice-command-finalizer.ts
apps/web/src/lib/jarvis/voice/voice-risk-classifier.ts
tools/jarvis/KINGSMEN_NATIVE_VOICE_BRIDGE.ps1
tools/jarvis/START_JARVIS_FULL_COMMAND_VOICE.ps1
manifests/jarvis/jarvis-voice-command-safety.json
manifests/jarvis/jarvis-voice-state-machine.json
```

Some of these paths already exist in the Kingsmen Jarvis build work and should be hardened rather than duplicated.

---

## 6. One-system fit

Kingsmen Jarvis should combine this project with earlier studies as follows:

```txt
OpenJarvis
  -> skills, agents, local-first intelligence, code assistant pattern

N.E.K.O
  -> presence, session continuity, memory boundary

JoelShine Jarvis-v2.0
  -> launchpad, local utility feel, old-style assistant command examples

PocketPaw
  -> command center, event bus, security/approval posture

ganeshnikhil J.A.R.V.I.S.2.0
  -> hybrid local/cloud model router, RAG, function calling

sukeesh/Jarvis
  -> command registry and plugin discipline

kishanrajput23/Jarvis-Desktop-Voice-Assistant
  -> voice loop, desktop responsiveness, async interaction
```

Unified Kingsmen flow:

```txt
Founder voice/chat/HUD command
  -> Jarvis intake
  -> transcript/session finalizer
  -> intent classifier
  -> command registry
  -> doctrine and policy gate
  -> risk classifier
  -> approval gate where required
  -> local utility adapter / builder core / app connector / validator / research agent
  -> evidence ledger
  -> response composer
  -> HUD + voice response
```

---

## 7. Build decision

Decision: ADAPT CONCEPTS ONLY.

Kingsmen should adapt:

```txt
voice loop
desktop responsiveness
safe local utility commands
asynchronous progress updates
speech output for founder status
```

Kingsmen must not copy:

```txt
uncontrolled desktop automation
production actions from voice only
unreviewed shell command routing
hardcoded secrets
loose memory
```

---

## 8. Kingsmen implementation priority

Priority for this lesson:

```txt
P1: Voice command safety manifest
P1: Voice command finalizer
P1: Cancel/stop command handling
P1: Async progress events
P2: Native PowerShell voice bridge
P2: Spoken status summaries
P3: Optional desktop helper after web HUD is stable
```

This study strengthens the Kingsmen Jarvis voice layer but does not replace Kingsmen doctrine, backend state machine, repo-first rule, or approval gates.
