# BATCH 13 - Repair Real Web Build Blockers / Add Next App Package Runtime

## Purpose

This batch repairs the real web boot blockers found by BATCH 12.

BATCH 12 did the correct thing: it refused to claim a real local web boot because the repo had no build script, no dev script, no Next dependency, no React dependency, no React DOM dependency, and no node_modules install evidence.

BATCH 13 adds the missing web runtime foundation so the next batch can attempt a controlled local web boot proof.

## What this batch creates or repairs

- `apps/web/package.json`
- web `dev`, `build`, and `start` scripts
- Next, React, React DOM, TypeScript, and type dependencies
- `apps/web/.gitignore`
- `apps/web/next.config.mjs`
- `apps/web/tsconfig.json`
- `apps/web/next-env.d.ts`
- `apps/web/src/app/layout.tsx`
- import-path repair for the Free Destiny Map form component if needed
- dependency install command
- runtime repair proof report
- validator report

## What this batch does not claim

- no production deployment
- no Oracle runtime
- no Docker Compose boot
- no PostgreSQL database
- no Redis queue
- no production web build claim yet
- no long-running dev server claim yet
- no email sending
- no payment
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This only repairs the local web runtime foundation.

## Next action

After validation, rerun BATCH 12 readiness. If BATCH 12 changes to `READY_FOR_CONTROLLED_LOCAL_BOOT`, BATCH 14 can attempt a controlled local Next/dev-server boot proof with explicit timeout and shutdown.
