# N07-AIRTABLE-04 — Sync API Routes / Founder Health View / Closeout

Closes the N07 Airtable mirror boundary:
- sync enqueue API route shell
- sync health API route shell
- founder Airtable health view
- N07 evidence matrix
- verifies N07-AIRTABLE-01 through N07-AIRTABLE-03 proof reports
- confirms PostgreSQL remains truth
- confirms Airtable is async mirror only
- confirms Airtable cannot govern payments, documents, outcomes, refunds, source authority, or submission truth
- confirms missing credentials degrade gracefully
- confirms Oracle Lite sync limits
- confirms productionReady remains false
- hands over to N08 Founder Control Plane / Operator Console

## Operational correction — 2026-10-23

The enqueue endpoint is intentionally fail-closed until a server-side authenticated durable-outbox writer is connected. It must return `queued: false` and HTTP 503 with `QUEUE_ADAPTER_NOT_CONFIGURED`; it must never report a successful queue write based only on request validation.

This correction does not mean the durable queue worker is operational. Before enabling enqueue, implement and verify all of the following:

1. Authenticate the founder/operator and enforce a server-side role check.
2. Validate the source entity type, source record ID, target allowlist, operation, and permitted fields.
3. Apply consent-safe transformation and reject secret-bearing or disallowed candidate data.
4. Insert into `public.airtable_sync_outbox` using a stable idempotency key; return success only after the database confirms the insert/upsert.
5. Claim jobs atomically with a lease so two workers cannot process the same item concurrently.
6. Persist attempt count, next-attempt time, redacted error category, completion time, and dead-letter status.
7. Retry with bounded exponential backoff and move exhausted jobs to the dead-letter queue.
8. Add automated tests for duplicate enqueue, unauthorised caller, target allowlist bypass, lease expiry, retry exhaustion, provider outage, and PII/secret redaction.
9. Prove the deployed route against the staging database and verify the resulting outbox row and recovery path.

Until these conditions are met, Airtable remains optional and disconnected; candidate registration, opportunity discovery, application preparation, document vault, and candidate tracking must continue without it. No provider connectivity or production readiness may be inferred from a passing source validator.
