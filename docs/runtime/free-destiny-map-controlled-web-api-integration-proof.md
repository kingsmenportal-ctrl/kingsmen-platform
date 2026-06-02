# BATCH 15B - Controlled Local Web + Local API Integration Proof

## Purpose

This batch proves the first controlled same-origin local web plus local API integration for the Free Destiny Map path.

BATCH 14 proved the real Next web app can boot and serve `/free-destiny-map`.

BATCH 15A repaired the Next workspace-root warning.

BATCH 15B now adds a real Next route handler at `/api/public/free-destiny-map/intake/local`, starts the controlled local Next dev server, fetches the Free Destiny Map page, posts a safe demo intake payload to the local API route, verifies HTTP 202, writes local JSONL proof, and shuts the server down.

## What this batch proves

- the real Next app boots locally
- `/free-destiny-map` responds with HTTP 200
- `/api/public/free-destiny-map/intake/local` exists as a real Next route handler
- a safe demo intake payload can be posted to the same-origin local API route
- the local API route returns HTTP 202
- the route keeps production claims blocked
- the route blocks official submission, payment, document upload and email
- local proof data stays under ignored `data/local`
- the server process is stopped after proof

## What this batch does not claim

- no production deployment
- no Oracle runtime
- no Docker Compose boot
- no PostgreSQL database
- no Redis queue
- no production API
- no email sending
- no payment processing
- no document upload
- no official application submission

## Oracle Lite impact

none_runtime_yet.

This is a controlled local Next web plus local API proof only.

## Next action

After validation, BATCH 16 should either add a production build proof or connect this local API intake to the backend runtime shell with a controlled local API service boundary.
