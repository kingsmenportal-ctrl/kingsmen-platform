# PJ52 — Jarvis Integration Hardening

Status: Founder-locked build doctrine
Parent: PJ51 — Jarvis Runtime Repair and Build Validation
Issue: #32

## Purpose

PJ52 hardens the seams between the Jarvis HUD, API routes, runtime kernel, connectors, memory, evidence, smoke tests, and repair tracker.

PJ42 created the laws. PJ43 to PJ50 created the first runtime, HUD, API, connector, memory, orchestrator, and smoke-test packages. PJ51 recorded build validation and deferred repairs. PJ52 makes sure those parts share one governed path instead of becoming disconnected modules.

## Core Law

Jarvis must not remain separate pieces.

A Commander request must flow through one governed runtime path:

```text
HUD or Voice Input
  -> API Runtime Bridge
  -> Jarvis Kernel
  -> Intent Router
  -> Command Registry
  -> Policy Gate
  -> Adapter Selector / Tool Router
  -> Approved Connector or Knowledge Route
  -> Source Confidence
  -> Evidence Ledger
  -> Answer Composer
  -> HUD / Voice Output
```

## Hardening Goals

1. Keep HUD output aligned with kernel metadata.
2. Keep API responses stable and typed.
3. Keep runtime imports/export paths consistent.
4. Keep connectors narrow and governed.
5. Keep memory summary-only.
6. Keep evidence required for success claims.
7. Keep smoke tests reachable through API and runtime helper.
8. Keep deferred repair items visible until closed.

## Integration Boundary

Jarvis may integrate modules only through registered contracts.

No module may silently bypass:

- Intent Router
- Command Registry
- Policy Gate
- Tool Router / Adapter Selector
- Source Confidence
- Evidence Ledger

## Final Rule

A powerful Jarvis is not many uncontrolled parts.

A powerful Jarvis is one governed chain with visible evidence at each step.