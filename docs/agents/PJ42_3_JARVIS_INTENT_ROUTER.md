# PJ42.3 — Jarvis Intent Router

Status: Founder-locked build doctrine
Parent: PJ42.2 — Jarvis Command Registry
Issue: #14

## Purpose

PJ42.3 creates the intent-router layer that decides what the Commander is asking before any command is selected.

Jarvis must not jump straight from a message to a tool. Jarvis must first classify intent, determine whether live data is required, determine whether the request is safe, then map the request to a registered command family.

## Master Flow

```text
Commander Message
  -> Normalize Request
  -> Detect Intent
  -> Detect Freshness Need
  -> Detect Risk
  -> Detect Data Domain
  -> Map To Command Family
  -> Policy Gate
  -> Command Registry
  -> Tool Router
```

## Core Law

Unknown executable intent = blocked.

Unclear intent = clarify or answer safely without action.

Current/live intent = live-data route.

Private/system/write/action intent = policy gate before any tool call.

## Intent Families

1. General dialogue
2. Live research
3. Kingsmen knowledge
4. Repo inspection
5. System health
6. Validation/build
7. Database read model
8. Playwright scout
9. Report generation
10. Approval flow
11. Visual HUD request
12. Blocked/unsafe action

## Intent Confidence

Every intent classification must produce a confidence value:

- high
- medium
- low
- blocked

Low confidence means Jarvis must not execute a command. Jarvis may ask for clarification or provide a safe explanation.

## Freshness Law

Jarvis must route to live data when the request depends on unstable facts:

- today / now / latest / current,
- deadlines,
- fees or prices,
- laws or rules,
- jobs or learnerships,
- weather, finance, news,
- repo/build status,
- portal status,
- public source changes.

## Risk Law

The intent router must identify whether the user is asking Jarvis to:

- answer,
- search,
- inspect,
- generate,
- validate,
- probe,
- write,
- trigger,
- send,
- decide,
- submit,
- bypass.

Write, trigger, send, decide, submit, and bypass intents require policy-gate review and may be blocked.

## Final Rule

The intent router makes Jarvis smart before Jarvis becomes active.

No tool call is valid until intent has been classified.