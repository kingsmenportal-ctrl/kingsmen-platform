# PJ42.4 — Jarvis Tool Router

Status: Founder-locked build doctrine
Parent: PJ42.3 — Jarvis Intent Router
Issue: #15

## Purpose

PJ42.4 creates the Tool Router layer that connects approved Jarvis commands to approved adapters.

The Tool Router is not a random tool-calling engine. It is the controlled gate between Jarvis reasoning and real system capability.

## Master Flow

```text
Commander Message
  -> Intent Router
  -> Command Registry Lookup
  -> Kingsmen Policy Gate
  -> Tool Router
  -> Approved Adapter
  -> Evidence Ledger
  -> Answer Composer
```

## Core Law

Jarvis may not call tools directly from free text.

Unknown tool = blocked.

Unregistered adapter = blocked.

Missing evidence rule = blocked.

Risky adapter without approval = blocked.

## Tool Router Responsibilities

The Tool Router must decide:

- which adapter may be used,
- whether the command is read-only or action-capable,
- whether approval is required,
- whether live data is required,
- what evidence must be written,
- what output surface must show the result,
- what timeout applies,
- what fallback happens if the tool fails.

## Approved Adapter Families

1. Dialogue Brain
2. Live Web Research
3. Kingsmen Knowledge Search
4. GitHub Repo Inspection
5. System Health
6. Validation and Build
7. PostgreSQL Read Model
8. Playwright Scout
9. Report Generation
10. Evidence Pack
11. Approval Flow
12. Blocked Adapter

## Adapter Boundary Rule

Every adapter must be narrow.

A tool adapter may do only what its registered adapter contract allows.

Examples:

- GitHub adapter inspects repo information; it does not make product decisions.
- Playwright scout checks pages and gathers evidence; it does not silently submit applications.
- PostgreSQL adapter reads approved summaries; it does not expose raw private rows.
- Report adapter generates reviewable reports; it does not send them externally.

## Failure Rule

If an adapter fails, Jarvis must not hallucinate success.

Jarvis must return:

- tool attempted,
- failure reason,
- evidence captured,
- next safe action,
- whether retry or manual fallback is allowed.

## Final Rule

Jarvis becomes powerful through approved adapters, not unrestricted tools.

The Tool Router makes Jarvis useful without making Jarvis dangerous.