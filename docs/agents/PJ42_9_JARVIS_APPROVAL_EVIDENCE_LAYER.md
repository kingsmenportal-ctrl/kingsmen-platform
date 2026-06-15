# PJ42.9 — Jarvis Approval and Evidence Layer

Status: Founder-locked build doctrine
Parent: PJ42.8 — Jarvis Visual HUD
Issue: #20

## Purpose

PJ42.9 creates the Approval and Evidence Layer for Real Jarvis.

Jarvis must be powerful, but every meaningful action must be controlled, explainable, reversible where possible, and evidence-backed.

## Core Law

No risky action without Commander approval.

No success claim without evidence.

No official status claim without source proof.

No tool-backed answer without evidence metadata.

Blocked actions must also create evidence explaining why they were blocked.

## Master Flow

```text
Commander Request
  -> Intent Router
  -> Command Registry
  -> Policy Gate
  -> Tool Router
  -> Approval Check
  -> Approved Adapter
  -> Evidence Ledger
  -> Answer Composer
  -> Visual HUD Evidence Drawer
```

## Approval Law

Approval is required when a command may:

- write or modify files,
- run a build or validator,
- probe a portal with Playwright,
- affect candidate workflow state,
- create a public/external draft for use,
- generate an evidence pack for external use,
- touch finance or payment workflow,
- trigger any operational workflow,
- perform any action that cannot be treated as read-only.

## Evidence Law

Every tool-backed action must record:

- evidence id,
- timestamp,
- actor,
- command id,
- intent id,
- adapter id,
- risk level,
- approval status,
- source confidence,
- input summary,
- result summary,
- failure reason where applicable,
- next safe action.

## Refusal Evidence

A refusal is not silence. A blocked command must record:

- why it was blocked,
- which law blocked it,
- safe alternative,
- whether review is possible.

## Final Rule

Jarvis must not only be intelligent. Jarvis must be auditable.

Every serious answer or action must leave a clean trail.