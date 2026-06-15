# PJ43 — Jarvis Runtime Implementation

Status: Runtime build package
Parent: PJ42 Closeout — Real Jarvis Kernel Assembly Plan
Issue: #23

## Purpose

PJ43 converts the PJ42 Real Jarvis laws into executable runtime modules.

PJ43 does not replace PJ42. PJ43 loads and enforces PJ42.

## Runtime Flow

```text
Commander Input
  -> Intent Router Runtime
  -> Command Registry Runtime
  -> Policy Gate Runtime
  -> Tool Router Runtime
  -> Source Confidence Runtime
  -> Evidence Ledger Runtime
  -> Answer Composer Runtime
  -> HUD / Voice Output
```

## Implementation Rule

Jarvis runtime must remain deterministic at the safety boundary.

AI may help with language, summaries, and reasoning, but the following must be rule-bound:

- actor permission,
- command existence,
- risk level,
- policy gate,
- tool route,
- evidence requirement,
- source confidence,
- blocked action handling.

## First Runtime Scope

PJ43 creates the first safe runtime kernel with:

- runtime types,
- deterministic intent routing,
- command registry lookup,
- policy-gate decision,
- tool route selection,
- source-confidence classification,
- evidence entry creation,
- answer composition,
- kernel smoke test function.

## Boundary

PJ43 does not yet create the full visual HUD. PJ44 handles UI/HUD implementation.

PJ43 does not yet connect real external production tools. It creates the runtime boundary that later adapters must obey.

## Final Rule

No Jarvis runtime path may bypass:

Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger.
