# PJ Public Jarvis Study 12 — Gladiator07 / JARVIS

Status: RECORDED
Repository branch: main
Public source: https://github.com/Gladiator07/JARVIS
Source type: public GitHub repository
Kingsmen use: reference study only, not direct dependency

---

## 1. Public project identity

Public repository:

```txt
Gladiator07/JARVIS
```

Public description:

```txt
Personal Voice Assistant made with Python and has a cool looking GUI
```

The public GitHub page describes the project as an attempt to make a voice assistant similar to JARVIS from Iron Man. The author is clear that it is not as intelligent as the movie version, but can automate many daily personal-computer tasks.

Visible repository facts from public GitHub page:

```txt
Repository: Gladiator07/JARVIS
Visibility: public
Default branch shown: master
Stars shown: 636
Forks shown: 285
Commits shown: 148
Primary language shown: Python 100.0%
License: MIT
```

---

## 2. What the public project can do

The README lists functions such as:

```txt
- greet user
- tell current time and date
- launch local applications/software
- open websites
- weather lookup
- location lookup and distance information
- system status: RAM, battery, CPU
- Google Calendar events
- Wikipedia lookup
- Google search
- YouTube song playback
- news headlines
- music playback
- email sending
- mathematical expression calculation
- generic question answering through WolframAlpha
- notes in Notepad
- random jokes
- IP address lookup
- window switching
- screenshot capture with custom filename
- hide/unhide files in a folder
- graphical user interface
```

The project structure shown in the README is simple and modular:

```txt
driver/
Jarvis/
  config/       # secret/API key configuration in that project
  features/     # feature functions
  utils/        # GUI images
__init__.py     # feature definitions
gui.ui          # GUI file
main.py         # driver program
requirements.txt
```

The README says new features can be added by creating a file in the `features` folder, adding the function definition, and adding the voice commands that invoke the function.

---

## 3. Kingsmen relevance

This project is useful because it shows a simple, understandable pattern for a voice assistant that has:

```txt
Voice command surface
GUI surface
Feature modules
Local PC actions
External information lookups
Calendar/email-style integrations
Screenshot and evidence capture
System-status reporting
```

For Kingsmen, this becomes a lesson for the founder-facing Jarvis HUD and safe local utility adapters.

It is not a production architecture. It is a public hobby-style assistant with useful UI and command ideas.

---

## 4. What Kingsmen should adapt

Kingsmen should adapt these ideas:

```txt
1. Modular feature folders
2. Explicit command-to-feature mapping
3. GUI command surface
4. Voice command vocabulary
5. Local system-status helper
6. Screenshot proof helper
7. Calendar/status lookup pattern
8. Search/research command pattern
9. Small utility actions grouped as adapters
10. A visible launch/driver program
```

Kingsmen version:

```txt
apps/web/src/app/jarvis/                 # HUD / GUI surface
apps/web/src/app/api/jarvis/command/     # command entrypoint
apps/web/src/lib/jarvis/command-registry.ts
apps/web/src/lib/jarvis/tool-router.ts
apps/web/src/lib/jarvis/policy-gate.ts
apps/web/src/lib/jarvis/evidence-ledger.ts
apps/web/src/lib/jarvis/local-utility-adapter.ts
manifests/jarvis/jarvis-command-registry.json
manifests/jarvis/jarvis-tool-policy.json
```

---

## 5. What Kingsmen must reject

Kingsmen must reject these patterns:

```txt
1. Secrets stored as normal Python config files
2. Email sending without approval
3. Voice commands directly triggering risky actions
4. File hiding/unhiding without strict confirmation
5. Window/system control without evidence logging
6. Generic web results presented as verified truth
7. Assistant acting outside the backend state machine
8. Production app actions from GUI/voice alone
9. Candidate data stored in local assistant folders
10. API keys or credentials in repo files
```

Kingsmen rule:

```txt
Voice and GUI are only input/output surfaces.
They do not become authority.
```

Authority remains:

```txt
PostgreSQL Truth Vault
Backend state machine
GitHub repository
Doctrine and policy gates
Validators
Evidence ledger
Founder approval
```

---

## 6. Kingsmen-safe version of this pattern

Public project pattern:

```txt
Voice command -> feature function -> local action
```

Kingsmen-safe pattern:

```txt
Founder voice/chat/HUD command
  -> transcript/session finalizer
  -> intent classifier
  -> command registry
  -> doctrine policy gate
  -> risk classifier
  -> approval gate if risky
  -> safe tool adapter
  -> evidence ledger
  -> response composer
```

For local desktop controls:

```txt
JarvisLocalUtilityAdapter
  -> allowed low-risk local actions only
  -> no production apps
  -> no candidate data movement
  -> no secrets exposure
  -> evidence logged
```

For screenshots:

```txt
JarvisScreenshotProofHelper
  -> capture requested screenshot/proof
  -> store in reports/evidence path
  -> redact sensitive data when required
  -> attach to build/validation report
```

For calendar/email:

```txt
JarvisGoogleConnector
  -> OAuth/API only
  -> draft-first email behavior
  -> no mass send without approval
  -> no candidate data leak
```

---

## 7. Fit into Kingsmen Jarvis unified system

Gladiator07/JARVIS contributes to these Kingsmen modules:

```txt
JarvisHud
JarvisVoiceInputShell
JarvisCommandRegistry
JarvisFeatureAdapterPattern
JarvisLocalUtilityAdapter
JarvisScreenshotProofHelper
JarvisSystemStatusReporter
JarvisSafeCalendarLookup
JarvisDraftEmailHelper
```

It does not contribute to:

```txt
Backend truth
Candidate state machine
Financial authority
Production app orchestration
SETA/CAO/NSFAS submission authority
```

---

## 8. Build sequence impact

This project supports Kingsmen Jarvis build order:

```txt
1. HUD command surface
2. Command registry
3. Local utility adapter
4. Screenshot proof helper
5. System status reporter
6. Voice shell
7. Google connector draft-only behavior
8. Approval gate
9. Evidence ledger enforcement
```

Do not build unrestricted local control before the policy gate and evidence ledger.

---

## 9. Final Kingsmen verdict

Gladiator07/JARVIS is valuable as a public example of:

```txt
GUI + voice + modular local-feature assistant
```

Kingsmen should use it to improve Jarvis usability and responsiveness, especially:

```txt
- command vocabulary
- visual command surface
- modular utility adapters
- screenshot proof capture
- local system-status reporting
```

Kingsmen must not copy its weaker safety model. Kingsmen Jarvis must remain doctrine-controlled, evidence-logged, validator-proven, and approval-gated.
