# BATCH 17 - Backend Runtime Integration Shell / Local API Service Boundary

## Purpose

This batch creates the first local backend runtime boundary for the Free Destiny Map intake path.

BATCH 15B proved the real local Next web app can call a same-origin local Next API route.

BATCH 16 proved the web app can complete a controlled production build.

BATCH 17 now creates a separate backend-side HTTP service boundary. This is the line between the web surface and the backend runtime that will later become the Oracle Lite API service.

## What this batch proves

- BATCH 16 production build proof exists and passed
- a backend local runtime module exists under `apps/api`
- a local backend HTTP service can start on `127.0.0.1`
- `/health` returns HTTP 200
- `/api/public/free-destiny-map/intake/local` accepts a safe demo payload
- backend boundary returns HTTP 202
- backend boundary writes local JSONL proof
- production claims remain blocked
- official submission, payment, document upload and email remain blocked
- service shuts down after proof

## What this batch does not claim

- no Oracle deployment
- no Docker Compose boot
- no PostgreSQL runtime
- no Redis queue
- no public production URL
- no frontend-to-backend bridge yet
- no email sending
- no payment processing
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a local backend boundary proof only.

## Next action

After validation, BATCH 18 should connect the proven Next local API route to this local backend service boundary using a controlled bridge proof.
