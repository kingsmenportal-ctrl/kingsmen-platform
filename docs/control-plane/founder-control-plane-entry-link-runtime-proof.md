# BATCH 28 - Founder Control Plane Entry Link Runtime Proof

## Purpose

BATCH 28 proves that the Founder Control Plane page renders the Proof Centre entry link inside the controlled local Docker web runtime.

## Source Page

- apps/web/src/app/founder/control-plane/page.tsx

## Target Route

- /founder/proof-centre/

## Scope

Controlled local Docker runtime proof only.

## What This Proves

- Docker engine is usable.
- Web image can be rebuilt after the BATCH 27 UI source change.
- Controlled Docker runtime starts.
- Founder Control Plane page returns HTTP 200.
- Founder Control Plane page contains the Proof Centre entry link.
- Founder Proof Centre route returns HTTP 200.
- Runtime is shut down after proof.

## Hard Boundaries

This batch does not:

- deploy to Oracle
- claim production readiness
- access secrets
- access candidate data
- process payments
- send email
- send WhatsApp
- modify backend business logic
- create another dashboard
