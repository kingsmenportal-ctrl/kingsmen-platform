# PJ42.2 — Jarvis Command Registry

Status: Founder-locked build doctrine
Parent: PJ42.1 — Jarvis Law Files
Issue: #13

## Purpose

PJ42.2 creates the command registry that turns Jarvis from a loose assistant into a governed Kingsmen command brain.

Jarvis may answer conversationally, but every operational capability must be registered before it can be treated as an executable command.

## Core Law

Unknown command = blocked.

Jarvis may not invent executable actions at runtime.

Every command must have:

- command id,
- label,
- category,
- description,
- risk level,
- allowed actor,
- adapter boundary,
- approval rule,
- evidence rule,
- timeout,
- output surface,
- rollback note.

## Command Flow

```text
Commander
  -> Jarvis HUD
  -> Intent Router
  -> Command Registry Lookup
  -> Kingsmen Policy Gate
  -> Tool Adapter
  -> Evidence Ledger
  -> Answer Composer
```

## Command Families

### 1. Dialogue Commands

Used for normal Jarvis conversation, explanation, and reasoning.

### 2. Live Research Commands

Used when questions require current public information.

### 3. Kingsmen Knowledge Commands

Used to search Kingsmen doctrine, architecture, business pack, build decisions, and safe project memory.

### 4. Repo Inspection Commands

Used to inspect GitHub repo status, files, issues, and build evidence.

### 5. System Health Commands

Used to check local or deployed Kingsmen health through approved health surfaces.

### 6. Validation and Build Commands

Used to run validators and build checks. These require approval when they consume system resources or change outputs.

### 7. Database Read Model Commands

Used only against approved read-only summaries.

### 8. Playwright Scout Commands

Used for live portal scouting with screenshots, timestamps, blockers, and manual fallback. These require approval.

### 9. Report Generation Commands

Used to generate Founder reports, evidence packs, route maps, and operational digests.

### 10. Approval Flow Commands

Used to request or record Commander approvals.

### 11. Blocked Commands

Used to explicitly classify unsafe actions as blocked.

## Risk Levels

- safe_read
- safe_generate
- review_required
- approval_required
- blocked

## Final Rule

Jarvis gets stronger by registering capabilities, not by becoming uncontrolled.

Every future Jarvis tool must first become a command registry entry.