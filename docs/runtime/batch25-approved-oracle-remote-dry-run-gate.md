# BATCH 25 — Approved Oracle Remote Dry-Run Execution Gate

BATCH 25 creates the controlled gate for an approved Oracle remote dry-run.

This is not production deployment.

## What this batch allows only when explicitly approved

- Check that local Oracle dry-run environment variables are present.
- Build safe SSH command text without printing secrets.
- Optionally run harmless remote read-only checks later.
- Write a local dry-run report.

## Required approval flag

Remote dry-run execution must require:

- `-ApprovedDryRun`

Without this flag, the runner must not run remote commands.

## Blocked in BATCH 25

- no production deployment
- no public production URL
- no paid Oracle resource creation
- no OCI compute launch
- no live database migration
- no payment
- no email sending
- no document upload runtime
- no official application submission
- no secrets committed to repo

## Next action

BATCH 26 may perform approved remote read-only checks only after BATCH 25 validates.
