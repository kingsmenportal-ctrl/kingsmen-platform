# BATCH 15A - Workspace Root / Lockfile Warning Repair

## Purpose

This batch repairs the controlled Next boot warning found in BATCH 14.

BATCH 14 proved the real Next dev server can boot and serve `/free-destiny-map`, but Next warned that multiple lockfiles exist and that it inferred a workspace root outside the intended Kingsmen web app boundary.

This batch fixes the warning safely by explicitly setting the Next output tracing root to the Kingsmen repository root.

## What this batch repairs

- prevents Next from guessing the workspace root incorrectly
- keeps the web app inside the Kingsmen repo boundary
- avoids deleting lockfiles outside the repo
- preserves the successful BATCH 14 boot proof
- keeps production claims blocked

## What this batch does not claim

- no Oracle runtime
- no production deployment
- no Docker Compose boot
- no PostgreSQL
- no Redis
- no email sending
- no payment
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a local Next configuration repair only.

## Next action

After validation, rerun the controlled Next boot proof. If the warning is gone and BATCH 14 still passes, proceed to BATCH 15B controlled local web plus local API integration proof.
