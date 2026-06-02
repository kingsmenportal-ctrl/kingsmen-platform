# BATCH 18 - Controlled Next-to-Backend Bridge Proof

## Purpose

This batch proves the first controlled bridge from the real Next local API route into the separate backend runtime boundary.

BATCH 15B proved the same-origin local Next web plus Next API route.

BATCH 16 proved the controlled production build.

BATCH 17 proved the separate backend local HTTP service boundary.

BATCH 18 now connects the proven Next API route to the proven backend boundary using explicit local environment flags.

## What this batch proves

- BATCH 17 backend boundary proof exists and passed
- BATCH 16 production build proof exists and passed
- Next dev server can boot locally
- backend boundary server can boot locally
- `/free-destiny-map` returns HTTP 200 from Next
- `/api/public/free-destiny-map/intake/local` returns HTTP 202 from Next
- Next API route calls backend boundary
- backend boundary returns HTTP 202
- backend boundary writes local JSONL proof
- bridge response confirms backend boundary was reached
- production claims remain blocked
- official submission, payment, document upload and email remain blocked
- both servers shut down after proof

## What this batch does not claim

- no Oracle deployment
- no Docker Compose boot
- no PostgreSQL runtime
- no Redis queue
- no public production URL
- no production backend URL
- no email sending
- no payment processing
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a controlled local bridge proof only.

## Next action

After validation, BATCH 19 should prepare Oracle Lite container/runtime boundaries or create a controlled Docker-local web plus backend compose proof.
