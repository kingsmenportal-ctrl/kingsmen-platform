# BATCH 09 - Local HTTP API Boot Shell / First End-to-End Local HTTP Route Exercise

## Purpose

This batch creates the first real local HTTP route exercise for the Free Destiny Map intake path.

BATCH 08 proved the local route exercise through script and JSONL proof. BATCH 09 now proves that a temporary local HTTP server can accept a safe POST request to the Free Destiny Map local endpoint contract and return a safe response.

## What this batch proves

- a local HTTP server can start on 127.0.0.1
- the endpoint contract remains `/api/public/free-destiny-map/intake/local`
- a safe demo payload can be POSTed as JSON
- the response keeps `productionReady` false
- official submission, payment, document upload and email remain blocked
- local JSONL proof can be written only as local ignored proof data
- generated local data remains protected by `data/local/.gitignore`

## What this batch does not prove yet

- no Oracle deployment
- no Docker Compose boot
- no PostgreSQL database
- no Redis queue
- no production API
- no browser automation
- no email sending
- no payment processing
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a local HTTP proof only and does not start Oracle services.

## Next action

After validation, BATCH 10 should create a local web-to-HTTP exercise or a minimal app boot proof that verifies the public form and local HTTP endpoint together.
