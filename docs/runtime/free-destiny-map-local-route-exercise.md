# BATCH 08 - Local API Boot Command / First End-to-End Local Route Exercise

## Purpose

This batch creates the first controlled local route exercise for Free Destiny Map intake.

It proves the local pathway from a safe demo payload into a local JSONL proof record, while keeping production runtime claims blocked.

## What this batch creates

- local route exercise contract
- PowerShell runtime command
- Node proof exercise
- local JSONL proof write under ignored data/local
- runtime proof report
- validator and validation report

## What this batch proves

The local exercise proves:

- upstream BATCH 05 intake files exist
- upstream BATCH 06 local persistence files exist
- upstream BATCH 07 form wiring files exist
- the public local intake endpoint contract is still `/api/public/free-destiny-map/intake/local`
- the local write flag remains `KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE`
- a safe demo payload can be shaped into a local intake exercise
- a local JSONL proof record can be written under `data/local/free-destiny-map/exercise`
- generated local data remains protected by `data/local/.gitignore`

## What this batch does not prove yet

- no real HTTP server boot
- no real browser interaction
- no production database
- no Oracle deploy
- no payment
- no email
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a local developer/runtime proof only.

## Next action

After validation, BATCH 09 should create either a real local API server boot shell or a minimal local HTTP route exercise.
