# PJ Public Jarvis Study 03 — JoelShine/Jarvis-v2.0

Status: RECORDED TO ORIGINAL REPO
Branch recorded: main
Doctrine: docs/N00-doctrine/jarvis-app-connector-law.md
Purpose: Public Jarvis reference study for Kingsmen Jarvis design.

---

## 1. Public project identity

Repository: JoelShine/Jarvis-v2.0
Public URL: https://github.com/JoelShine/Jarvis-v2.0
Project type: Python Windows virtual assistant / voice assistant.

Public repository details found:

- repository_full_name: JoelShine/Jarvis-v2.0
- visibility: public
- default branch: main
- archived: false
- project language: Python

The GitHub page describes the project as a virtual assistant similar to Siri, Cortana, and Google Assistant. It also describes this as a major update to the creator's earlier Jarvis project.

---

## 2. What this public Jarvis is trying to be

JoelShine/Jarvis-v2.0 is a personal computer voice assistant, not a production business platform.

It focuses on:

1. Voice commands.
2. Opening apps and websites.
3. Local Windows helper actions.
4. Multimedia player concepts.
5. Launchpad-like app interface.
6. Screenshots and webcam capture concepts.
7. Gmail sending concept.
8. Notes and small utilities.
9. Calculator/calendar GUI utilities.
10. OCR/text extraction concepts.

It is closer to the classic Iron-Man-style desktop assistant than a controlled enterprise system.

---

## 3. Useful ideas for Kingsmen Jarvis

Kingsmen should not copy this repo as a base system, but it contains useful UX and command lessons.

### 3.1 Voice command vocabulary

The project demonstrates simple human command patterns such as greeting Jarvis, waking Jarvis, opening apps, taking screenshots, taking notes, checking time/date/weather, searching, and extracting text from an image.

Kingsmen adaptation:

Jarvis needs a plain command vocabulary that the founder can remember, for example:

- Jarvis, open candidate portal.
- Jarvis, show build status.
- Jarvis, run validators.
- Jarvis, create N04 plan.
- Jarvis, show failed workflow.
- Jarvis, prepare Airtable dry run.
- Jarvis, check n8n staging only.
- Jarvis, generate evidence report.
- Jarvis, summarize today.
- Jarvis, stop production action.

### 3.2 Local PC utility layer

The project demonstrates practical desktop-helper thinking: app opening, screenshots, notes, battery/system information, media controls, OCR, and utility windows.

Kingsmen adaptation:

Kingsmen Jarvis can use local utility commands for founder productivity:

- open repo folder
- open terminal in repo
- open Jarvis HUD
- start local dev server
- capture screenshot proof
- save command note
- extract text from screenshot/log image
- open GitHub branch
- open validator report

These must remain local helper commands. They must not become production authority.

### 3.3 Launchpad idea

The project includes a Launchpad concept similar to an app launcher UI.

Kingsmen adaptation:

Kingsmen Jarvis should have a visual command launchpad for safe actions:

- Build module
- Run validator
- View repo status
- Open docs
- Open pending approvals
- Open app connectors
- Generate report
- Start local server
- Show current N-series stage

This belongs in the Jarvis HUD experience, not in the backend state machine.

### 3.4 Voice profile idea

The public project separates assistant voice presentation.

Kingsmen adaptation:

Kingsmen can support voice/personality profiles later, but only as presentation. Personality must never change policy, doctrine, approval gates, or truth rules.

### 3.5 Screenshot/OCR helper idea

The public project includes screenshot/OCR-style capabilities.

Kingsmen adaptation:

This can help with:

- reading portal screenshots
- extracting error messages from screenshots
- creating visual proof of build/test status
- helping founder troubleshoot local UI

Boundary:

Screenshot/OCR features must not capture secrets, candidate IDs, payment data, or private documents without explicit purpose and redaction.

---

## 4. What Kingsmen must reject

Kingsmen must not inherit unsafe parts of a hobby desktop assistant design.

Reject:

1. Uncontrolled system commands.
2. Production-risk actions from casual voice commands.
3. Email sending without approval.
4. Browser/app opening that bypasses workflow evidence.
5. Web scraping as a system of truth.
6. Random local storage for private candidate data.
7. Unknown binary dependencies as a core requirement.
8. Desktop automation as production orchestration.
9. Voice command alone as production approval.
10. Any path that bypasses Kingsmen validators.

---

## 5. Kingsmen integration decision

JoelShine/Jarvis-v2.0 contributes mostly to Kingsmen Jarvis UX:

- voice wake phrases
- command vocabulary
- local utility command set
- app launcher / launchpad concept
- screenshot proof concept
- OCR helper concept
- small helper modules

It does not contribute:

- production architecture
- app connector law
- backend state machine
- PostgreSQL truth vault
- n8n workflow pattern
- Airtable mirror discipline
- candidate data security
- payment safety
- validator design

Therefore it should be treated as:

> UX and local assistant inspiration only.

---

## 6. Where it fits in Kingsmen Jarvis architecture

```txt
Founder voice/chat command
  -> Jarvis HUD
  -> command vocabulary parser
  -> intent router
  -> policy gate
  -> local utility adapter OR builder core OR connector router
  -> evidence ledger
  -> response composer
```

Suggested Kingsmen modules influenced by this project:

```txt
apps/web/src/lib/jarvis/voice-command-vocabulary.ts
apps/web/src/lib/jarvis/local-utility-adapter.ts
apps/web/src/lib/jarvis/screenshot-proof-adapter.ts
apps/web/src/lib/jarvis/ocr-helper-boundary.ts
apps/web/src/app/jarvis/JarvisLaunchpad.tsx
manifests/jarvis/jarvis-local-utility-commands.json
manifests/jarvis/jarvis-launchpad-command-catalog.json
```

---

## 7. Kingsmen action items

1. Create a controlled voice command vocabulary manifest.
2. Create a Jarvis launchpad command catalog.
3. Add local utility adapter boundary rules.
4. Add screenshot/OCR redaction law.
5. Ensure local utility commands cannot bypass approvals.
6. Require evidence logging for every local utility command that changes files, launches builders, or reads sensitive outputs.

---

## 8. Final verdict

JoelShine/Jarvis-v2.0 is useful for the feel of Kingsmen Jarvis: voice commands, app-launcher behavior, local PC helper actions, screenshots, OCR, and simple desktop assistant patterns.

It is not suitable as Kingsmen core architecture.

Kingsmen should adapt the experience layer only:

```txt
JoelShine Jarvis-v2.0 = voice/local desktop inspiration
Kingsmen Jarvis = doctrine-controlled builder/operator with evidence, app connectors, validators, and approval gates
```
