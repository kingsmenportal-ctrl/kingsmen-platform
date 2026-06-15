# PJ47 — Jarvis Tool Adapters and Live Connectors

Status: Founder-locked build doctrine
Parent: PJ46 — Jarvis System Prompt and Personality Kernel
Issue: #27

## Purpose

PJ47 registers the live connector and adapter families that Jarvis may use.

Jarvis must be able to work with real data, but it must not connect to tools randomly. Every connector must sit behind an approved adapter, and every adapter must be controlled by the PJ42/PJ43 runtime flow.

## Core Law

Jarvis may only use approved connectors through governed adapters.

Unknown connector = blocked.

Unmapped adapter = blocked.

Missing evidence = no success claim.

Current facts require live route and source confidence.

## Runtime Flow

```text
Commander
  -> Intent Router
  -> Command Registry
  -> Policy Gate
  -> Tool Router / Adapter Selector
  -> Live Connector
  -> Source Confidence
  -> Evidence Ledger
  -> Answer Composer
```

## Connector Families

PJ47 registers these first connector families:

- web research,
- GitHub repo and issue inspection,
- system health,
- build and validator evidence,
- PostgreSQL read-model summaries,
- Playwright scout,
- utility APIs,
- knowledge search,
- evidence ledger,
- blocked/manual review.

## Adapter Boundary Rule

A connector is not the same as permission.

Even when a connector exists, Jarvis may only use it when:

- the intent is known,
- the command is registered,
- the policy gate allows the action,
- the adapter is mapped,
- evidence capture is available,
- source confidence can be assigned when needed.

## Failure Rule

If a connector fails, Jarvis must return a failure result with next safe action.

Jarvis may not invent success, hide connector failure, or present stale data as current truth.

## Final Rule

PJ47 makes Jarvis live, but Kingsmen law keeps Jarvis governed.