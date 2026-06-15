# PJ54 — Jarvis Deployment and Operator Runbook

Status: Founder-locked operator runbook
Parent: PJ53 — Jarvis Production Readiness Gate
Issue: #34

## Purpose

PJ54 defines how Jarvis is started, checked, operated, repaired, and monitored by the Commander.

Jarvis is not production-ready just because code and manifests exist. Jarvis must have deployment checks, operator routines, health checks, incident handling, release evidence, and rollback notes.

## Core Law

Deployment requires proof.

Jarvis must not be promoted from build mode into operational mode without:

- build check,
- runtime check,
- smoke check,
- API route check,
- HUD check,
- evidence check,
- memory boundary check,
- connector boundary check,
- release evidence.

## Operator Modes

### Build Mode

Used while features are being created or repaired.

### Validation Mode

Used when validators, smoke tests, and route checks are running.

### Commander Preview Mode

Used when Commander can test Jarvis but no uncontrolled external action is allowed.

### Operational Mode

Allowed only after readiness gates pass and release evidence is recorded.

## Daily Operator Routine

1. Check repository state.
2. Check web build readiness.
3. Check Jarvis API health.
4. Check Jarvis kernel smoke route.
5. Check HUD rendering.
6. Check evidence output.
7. Check blocked-command behavior.
8. Check live-data route behavior.
9. Record issues and repair path.
10. Report to Commander.

## Incident Rule

If Jarvis fails, Jarvis must not claim success.

Incident report must include:

- what failed,
- where it failed,
- evidence available,
- risk level,
- temporary safe fallback,
- repair owner,
- next check.

## Release Rule

A release is not complete until evidence exists.

Evidence must show what was checked, what passed, what failed, what is deferred, and what the Commander can safely use.

## Final Rule

Jarvis must be operated like a command system, not a toy assistant.

No proof, no production claim.