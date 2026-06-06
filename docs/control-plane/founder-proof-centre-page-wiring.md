# BATCH 25 - Smallest Founder Control Plane Page Wiring

## Purpose

BATCH 25 wires the proven BATCH 24 Control Plane proof display adapter into the real web app through the smallest safe founder-facing page.

## Web App Reality

The current repo preflight showed:

- apps/web exists
- apps/web/app does not exist
- apps/web/src exists
- apps/web/package.json exists

Because there is no confirmed App Router path, this batch does not guess framework routing.

## Output

The page is written to:

- apps/web/public/founder/proof-centre/index.html
- apps/web/public/founder/proof-centre/adapter.json

## Local URL

When the web app is running, the founder page should be reachable at:

/founder/proof-centre/

## Hard Boundaries

This batch does not:

- start Docker
- deploy to Oracle
- claim production readiness
- access secrets
- access candidate data
- process payments
- send email
- send WhatsApp
- modify backend runtime services
- create a large dashboard

## Authority

This is a local founder proof display page only.

PowerShell, Git, validators, reports, and founder approval remain the authority.
