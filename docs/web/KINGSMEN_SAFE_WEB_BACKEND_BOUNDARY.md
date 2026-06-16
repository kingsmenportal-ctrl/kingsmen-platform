# Kingsmen Safe Web-to-Backend Boundary

Status: foundation built pending staging proof  
Production Ready: false

## Purpose

This document locks the public web runtime boundary for Kingsmen.

The Next.js web app is a user interface and proxy surface. It must not become the backend authority, database client, local workstation shell, or proof-file writer.

## Boundary rule

Public `apps/web` API routes may:

- validate request shape before handoff
- build safe command envelopes
- attach correlation and idempotency evidence
- call the backend API through `KINGSMEN_BACKEND_BASE_URL`
- return safe status to the browser

Public `apps/web` API routes may not:

- execute local shell commands
- execute local database binaries
- depend on Windows workstation paths
- write JSONL proof files
- write candidate data directly to local disk
- access PostgreSQL/Supabase directly
- submit official applications
- send payments
- send email or WhatsApp messages directly

## Implemented files

- `apps/web/src/lib/kingsmen-backend-client.ts`
- `apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts`
- `apps/web/src/app/api/jarvis/status/route.ts`
- `apps/web/src/app/api/jarvis/command/route.ts`
- `scripts/validators/validate-safe-web-backend-boundary.mjs`

## Runtime environment

Required for connected web runtime:

```bash
KINGSMEN_BACKEND_BASE_URL=http://127.0.0.1:8080
KINGSMEN_BACKEND_TIMEOUT_MS=15000
```

If `KINGSMEN_BACKEND_BASE_URL` is not configured, public write/proxy routes must fail safely instead of writing local files or calling local shell commands.

## Free Destiny Map intake boundary

The Free Destiny Map intake route now performs only:

1. safe payload validation
2. sensitive-key rejection
3. command-envelope creation
4. backend API handoff to `/api/commands`

It emits a `candidate.intake.received` command envelope with:

- `commandId`
- `idempotencyKey`
- `correlationId`
- `actor`
- `source: portal`
- safe payload metadata

The web route does not accept documents, payments, email sending, or official application submission.

## Jarvis status boundary

The Jarvis status route now calls:

```text
GET {KINGSMEN_BACKEND_BASE_URL}/api/system/health
```

It renders backend health and static command options only.

## Jarvis command boundary

The Jarvis command route no longer runs local workstation commands. It converts whitelisted SAFE_READ command IDs into backend command envelopes and posts them to:

```text
POST {KINGSMEN_BACKEND_BASE_URL}/api/commands
```

The backend remains responsible for policy, evidence, Truth Vault persistence, approvals, and any future execution.

## Validation

Run:

```bash
npm run web:validate:backend-boundary
npm run kingsmen:launch:audit
```

The validator checks that public boundary routes do not import shell/process execution modules, filesystem write modules, or direct local database execution patterns.

## Remaining proof before public launch

This step proves source-level boundary hardening. It does not yet prove staging runtime.

Before public launch, Kingsmen still needs:

- deployed web + API staging smoke test
- backend URL configured outside source code
- Truth Vault staging integration proof
- RLS/security proof
- payment proof
- backup/restore proof
- branch protection
