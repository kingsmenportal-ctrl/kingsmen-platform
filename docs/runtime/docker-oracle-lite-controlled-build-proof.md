# BATCH 20 - Controlled Docker Local Build Proof

## Purpose

This batch performs the first controlled Docker local build proof for the Kingsmen Oracle Lite web and backend runtime boundary.

BATCH 19 prepared Docker and Oracle Lite local runtime files.

BATCH 20 checks whether Docker is installed and available. If Docker is available, this batch builds the local API and web images. If Docker is not installed or not running, it writes an honest unavailable proof report instead of pretending the build passed.

## What this batch may prove

- BATCH 19 container preparation exists and passed
- Docker CLI is installed
- Docker daemon is available
- API Oracle Lite image can build locally
- Web Oracle Lite image can build locally
- built images can be inspected
- no container process is started
- no Compose startup is performed
- no Oracle deployment is performed
- production/action flags remain false

## What this batch does not do

- no container process start
- no Compose startup
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

## Honest unavailable mode

If Docker is missing or Docker Desktop is not running, this batch is allowed to produce:

`DOCKER_LOCAL_BUILD_UNAVAILABLE`

That is a valid environment proof, but it is not a successful image build. In that case, do not proceed to Docker runtime proof until Docker is installed and running.

## Oracle Lite impact

Controlled local image build proof only.

No Oracle deployment is performed.

## Next action

If image build is proven, BATCH 21 can run a controlled Docker local runtime proof.

If Docker is unavailable, start or install Docker first, then rerun BATCH 20.
