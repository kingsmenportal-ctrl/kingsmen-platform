# PJ50 — Jarvis Kernel Smoke Tests

Status: Founder-locked smoke-test phase
Parent: PJ49 — Jarvis Agent Orchestrator
Issue: #30

## Purpose

PJ50 creates the first smoke-test layer for the real Jarvis kernel.

Smoke tests are not full production tests. They are quick proof that the governed Jarvis path exists, returns predictable metadata, blocks unsafe routes, and does not pretend that missing evidence is success.

## Core Law

Jarvis kernel smoke tests must prove safe behavior before deeper automation.

A smoke test must not require private candidate records, payment records, private documents, credentials, browser sessions, or official external submissions.

## Smoke Paths

PJ50 must prove these paths:

1. General dialogue path
2. Kingsmen knowledge path
3. Live-data route decision path
4. Blocked action path
5. Source-confidence label path
6. Evidence-entry path
7. HUD metadata path
8. Orchestrator plan path

## Expected Behavior

Every smoke result must include:

- scenario id,
- input text,
- expected intent,
- expected command,
- expected route family,
- expected safety outcome,
- source-confidence expectation,
- evidence expectation,
- HUD metadata expectation.

## Failure Rule

If a smoke test fails, Jarvis must report the failed path and next repair step.

Jarvis must not mark the kernel ready when smoke paths fail.

## Final Rule

PJ50 proves that Jarvis has a safe spine before advanced automation begins.