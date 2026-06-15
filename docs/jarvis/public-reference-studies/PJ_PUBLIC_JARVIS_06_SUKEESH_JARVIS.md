# PJ Public Jarvis Study 06 — sukeesh/Jarvis

Status: RECORDED
Target branch: main
Study category: Public Jarvis reference / command-line assistant / plugin command model
Source project: sukeesh/Jarvis
Source type: Public GitHub repository
Kingsmen decision: ADAPT SELECTIVELY, DO NOT COPY WHOLESALE

---

## 1. Public Project Identity

`sukeesh/Jarvis` is a public personal-assistant project on GitHub.

Observed public characteristics:

- Repository: `sukeesh/Jarvis`
- Public GitHub project
- Description: personal assistant for Linux and macOS, with Windows support mentioned in README body
- Approximate public signal at time of study: 3.5k stars, 1.1k forks, 1,815 commits
- Language profile: primarily Python
- Default branch visible as `master`
- Folders visible include `custom`, `doc`, `icons`, `installer`, and `jarviscli`
- Repository includes README, CONTRIBUTING, Makefile, installer scripts, test script, Docker-related files, and MIT license

The README describes Jarvis as a simple personal assistant that works on the command line, can talk if voice is enabled, and can perform utility tasks such as weather, places, entertainment, sports information, games, health/fitness helpers, random generators, conversions, screenshots, system information, file management, image/PDF utilities, jokes/facts, calculations, QR generation, translation, stock/crypto information, and more.

---

## 2. Why This Matters for Kingsmen

This project is valuable because it shows an older but practical assistant pattern:

```txt
command-line assistant
  -> command parser
  -> many small utility commands
  -> plugin/contributor model
  -> optional voice output
  -> local machine helpers
  -> tests and installer support
```

Kingsmen Jarvis does not need to become a hobby command bot, but it does need a strong command vocabulary and a safe plugin/tool model.

The useful lesson is not the exact code. The useful lesson is the shape:

```txt
Small command modules are easier to test, explain, approve, and disable.
```

That is important for Kingsmen because Jarvis must eventually connect to GitHub, Airtable, n8n, Supabase/PostgreSQL, Gmail, Drive, Calendar, PayFast, WhatsApp, Oracle, local scripts, validators, and browser scout tools.

Each of those must behave like an approved command/plugin with rules, not like an uncontrolled AI action.

---

## 3. What Kingsmen Should Adapt

Kingsmen should adapt these ideas:

### 3.1 Command Vocabulary

`sukeesh/Jarvis` exposes many simple typed commands such as weather, screenshots, conversions, calculations, help, system info, and plugins.

Kingsmen version:

```txt
jarvis help
jarvis status
jarvis explain repo
jarvis build N04
jarvis validate N04
jarvis scan secrets
jarvis show changed files
jarvis prepare commit
jarvis create Airtable dry-run
jarvis import n8n staging
jarvis research NSFAS source
jarvis create MAP package
jarvis generate candidate email draft
jarvis run health report
```

Kingsmen Jarvis must have a controlled command registry, not random natural-language execution only.

### 3.2 Plugin-Like Tool Modules

The public project demonstrates a plugin model where a new command can be added as a separate function/module.

Kingsmen version:

```txt
packages/jarvis-command-core/
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/connectors/
tools/jarvis/
manifests/jarvis/jarvis-command-registry.json
manifests/jarvis/jarvis-approved-tool-adapters.json
```

Every Kingsmen command should have:

1. command id
2. description
3. allowed caller surface
4. risk level
5. required connector
6. required approval mode
7. evidence event type
8. validator requirement
9. rollback/fallback note

### 3.3 Help System

The public project encourages typing `help` to discover what Jarvis can do.

Kingsmen needs a serious version:

```txt
Jarvis, what can you do?
Jarvis, show safe commands.
Jarvis, show production-risk commands.
Jarvis, show disabled connectors.
Jarvis, show N-series build commands.
Jarvis, show Airtable dry-run commands.
Jarvis, show n8n staging commands.
```

The help system must be generated from the command registry so it never lies.

### 3.4 Optional Voice Layer

The public project can talk if sound is enabled and includes optional voice-related dependencies.

Kingsmen version:

```txt
Voice input/output is a surface only.
Voice must not bypass policy.
Voice commands must go through the same policy gate, approval gate, and evidence ledger as chat commands.
```

### 3.5 Local Utility Adapter

The public project includes local utilities such as screenshots, system information, file helpers, and conversions.

Kingsmen version:

```txt
local screenshot proof helper
local repo status helper
local file existence checker
local validator runner
local PowerShell script runner
local server doctor
local browser scout launcher
```

These tools help the founder operate the system quickly.

---

## 4. What Kingsmen Must Reject

Kingsmen must reject the weak parts of a generic command-line assistant:

```txt
random utilities mixed with production controls
untyped commands
no serious approval gate
no evidence ledger
no backend state authority
no candidate-data protection model
no POPIA-grade privacy boundary
no source-confidence model
no production deploy boundary
unreviewed community plugins
```

Kingsmen cannot allow a random command module to change Airtable, send email, activate n8n, submit applications, or touch payments.

Every tool must pass the Kingsmen connector law.

---

## 5. Kingsmen Fit

This project contributes to Kingsmen Jarvis as the:

```txt
Command Registry + Help + Plugin Utility Layer
```

It does not contribute the sovereign architecture, because Kingsmen already has stricter doctrine:

```txt
PostgreSQL Truth Vault
Backend state machine
GitHub repo evidence
Validators and boot blockers
Founder approval for production-risk actions
```

The public project’s small-command pattern is useful because it makes Jarvis understandable and testable.

---

## 6. Unified Kingsmen Jarvis Placement

Project 6 fits inside the full Kingsmen Jarvis system here:

```txt
Founder voice/chat/HUD command
  -> Conversation engine
  -> Intent classifier
  -> Command registry
  -> Help/command resolver
  -> Policy gate
  -> Approval gate if risky
  -> Tool/plugin adapter
  -> Evidence ledger
  -> Validator if repo/action-related
  -> Response composer
```

Where Project 1 OpenJarvis gives the local-first agent/skill architecture, Project 6 gives the simple command-module discipline.

---

## 7. Required Kingsmen Implementation Decisions

Kingsmen Jarvis should implement:

### 7.1 Command Registry Manifest

Keep this as a source of truth:

```txt
manifests/jarvis/jarvis-command-registry.json
```

It must include all approved commands and risk levels.

### 7.2 Command Help Generator

Jarvis help must be generated from approved command manifests.

### 7.3 Plugin Safety Loader

No plugin/tool/connector should load unless it has:

```txt
approved manifest entry
risk classification
policy gate rule
evidence event type
validator or dry-run where required
```

### 7.4 Local Founder Utilities

Create safe local utility commands:

```txt
repo.status
repo.changed_files
repo.scan_secrets
repo.validate
server.doctor
jarvis.health
jarvis.evidence_tail
jarvis.open_local_hud
```

### 7.5 Production-Risk Wall

Production actions must remain blocked unless approved:

```txt
payment.refund
email.mass_send
whatsapp.send
n8n.activate_production
airtable.delete_field
supabase.production_migration
oracle.deploy_production
candidate.submit_application
```

---

## 8. Advancement to Kingsmen

This study advances Kingsmen by clarifying that Jarvis must be both:

```txt
conversational enough for natural command
structured enough for safe execution
```

The final Kingsmen Jarvis should not rely only on freeform AI interpretation. It must translate conversation into an approved command, then run that command through doctrine.

That is how Jarvis becomes powerful without becoming dangerous.

---

## 9. Final Verdict

`sukeesh/Jarvis` is an important reference for:

```txt
command-line assistant behavior
help/discovery system
small plugin command model
local utility tasks
optional voice/speech surface
community-extensible command pattern
```

Kingsmen should adapt the command/plugin discipline, but reject uncontrolled utility mixing and weak safety boundaries.

Kingsmen outcome:

```txt
Project 6 becomes the Kingsmen Jarvis Command Registry and Safe Plugin Loader lesson.
```
