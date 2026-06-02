# BATCH 07 - Public Form to Intake API Wiring / Local API Boot Proof

## Purpose

This batch connects the public Free Destiny Map form shell toward the safe intake API boundary created in BATCH 05 and the local persistence shell created in BATCH 06.

It does not claim production readiness.

## What this batch creates

- public form client adapter
- connected Free Destiny Map form component
- updated Free Destiny Map page
- public API wiring contract
- local API boot proof script
- runtime proof report
- validator and validation report

## Runtime boundary

The connected form posts to:

`/api/public/free-destiny-map/intake/local`

That endpoint remains a local runtime shell.

The backend decides whether local JSONL writing is enabled through:

`KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE`

If the flag is not enabled, the API still returns safe shell feedback without writing data.

## What this batch does not do yet

- no production database storage
- no Supabase service role usage
- no email sending
- no payment processing
- no document upload
- no official application submission
- no Oracle runtime claim
- no production readiness claim

## Safety

The public form must only capture basic route-mapping information and consent.

It must not capture raw ID numbers, passwords, portal logins, card details, CVV, document files, base64 documents, or official application credentials.

## Oracle Lite impact

none_runtime_yet.

This batch creates UI wiring, client adapter, local boot proof, validator, and reports only.

## Next action

After validation, BATCH 08 should create local API boot/server wiring or the first developer runtime command that proves the route can be exercised locally.
