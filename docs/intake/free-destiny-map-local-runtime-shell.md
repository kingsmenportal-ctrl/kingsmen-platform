# BATCH 06 - Intake Persistence / Local Runtime Shell

## Purpose

This batch creates the first safe local persistence boundary for Free Destiny Map intake.

It connects the BATCH 05 intake service to a local runtime repository shell without claiming production storage, live database persistence, email delivery, payment readiness, or official application submission.

## What this batch creates

- local persistence contract
- local repository shell
- safe stored intake summary model
- audit event shell
- API-safe persistence service
- runtime route shell
- local data ignore rule
- validator and proof report

## What this batch does not do yet

- no production database write
- no Supabase service role usage
- no payment processing
- no email sending
- no document upload
- no official application submission
- no production runtime claim

## Runtime safety

Local persistence must be opt-in for development/runtime proof only.

Candidate production data must not be committed to Git.

The repository may create local JSONL records only when the runtime flag allows it. The committed repo includes a local data ignore rule so generated intake files are not tracked.

## Oracle Lite impact

none_runtime_yet.

This batch creates code and validation only. It does not start Docker, PostgreSQL, Redis, Nginx, n8n, Playwright, email, payment, or Oracle services.

## Next action

After validation, BATCH 07 should wire the public form shell to the intake endpoint or create the local API boot/run proof.
