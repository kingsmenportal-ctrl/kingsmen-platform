# BATCH 27 - Founder Control Plane Proof Centre Entry Link

## Purpose

BATCH 27 adds the smallest useful entry link from the existing Founder Control Plane page to the proven Founder Proof Centre page.

## Source Page

- apps/web/src/app/founder/control-plane/page.tsx

## Target Page

- /founder/proof-centre/
- apps/web/src/app/founder/proof-centre/page.tsx

## Scope

Local UI wiring only.

## Hard Boundaries

This batch does not:

- create a new dashboard
- start Docker
- deploy to Oracle
- claim production readiness
- access secrets
- access candidate data
- process payments
- send email
- send WhatsApp
- modify backend runtime services

## Proof Dependency

This batch depends on BATCH 26B proving that the Founder Proof Centre page is reachable through the local web runtime.
