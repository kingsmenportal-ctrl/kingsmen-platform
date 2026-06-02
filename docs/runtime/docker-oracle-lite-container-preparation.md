# BATCH 19 - Docker / Oracle Lite Local Runtime Container Preparation

## Purpose

This batch prepares Docker and Oracle Lite local runtime container files for the proven Kingsmen Free Destiny Map path.

BATCH 18 proved the full local chain:

Next page -> Next API route -> backend runtime boundary -> backend local proof write.

BATCH 19 now prepares container boundaries for the web and backend services without running Docker, without deploying to Oracle, and without claiming production readiness.

## What this batch creates

- Dockerfile for the Next web app
- Dockerfile for the backend local runtime boundary
- executable backend local server entrypoint
- Oracle Lite local Docker Compose preparation file
- Docker ignore file
- container preparation proof script
- validator
- runtime proof report
- validation report

## What this batch proves

- BATCH 18 bridge proof exists and passed
- BATCH 16 production build proof exists and passed
- web Dockerfile exists and has Oracle Lite-safe defaults
- backend Dockerfile exists and has Oracle Lite-safe defaults
- compose file defines web and api services
- compose file uses low local ports and local-only bind intent
- compose file sets backend bridge env vars
- compose file avoids PostgreSQL, Redis, n8n, Playwright and Oracle deployment claims for this batch
- production/action flags remain false

## What this batch does not do

- no Docker build
- no Docker Compose up
- no Oracle deployment
- no public production URL
- no PostgreSQL runtime
- no Redis queue
- no n8n runtime
- no Playwright runtime
- no email sending
- no payment processing
- no document upload
- no official application submission

## Oracle Lite impact

Preparation only.

No runtime is started in this batch.

## Next action

BATCH 20 should run a controlled Docker local build proof if Docker is installed, or produce a clear Docker unavailable report if Docker is not installed.
