# N07 durable outbox, leases, retries and security boundary

## Scope

This migration hardens the existing `public.airtable_sync_outbox`; it does not create a parallel queue. PostgreSQL remains authoritative. Airtable is an optional asynchronous mirror and may be unavailable without blocking candidate-facing flows.

## Added database contract

- Idempotent enqueue through `n07_enqueue_airtable_mirror`, restricted to `service_role` by explicit function grants and an invoker-security role check.
- Only active `POSTGRES_TO_AIRTABLE` targets with PostgreSQL state authoritative are eligible.
- Idempotency keys cannot be reused for a different target/source/operation.
- Payload must be a JSON object; common candidate PII and credential/token fields are rejected.
- Browser roles lose direct table privileges on the outbox.
- Worker claims use `FOR UPDATE SKIP LOCKED`, a five-minute lease, a maximum batch of 50, and one claim transaction.
- Failed jobs use bounded exponential backoff. Attempts are capped at three; exhausted jobs are marked `DEAD_LETTER` in the same durable table.
- Completion requires the matching worker lease; error code/detail are bounded and expected to be redacted.

## Current limitation

The founder enqueue HTTP route intentionally returns HTTP 503 / `queued: false` until an authenticated server-side adapter is connected to these SQL functions. Do not expose `service_role` to the browser and do not treat this database foundation as an operational worker.

## Verification

Run `npm run n07:outbox:check` for source-contract checks. These checks are static and do not replace applying the migration in staging, running SQL role/idempotency/concurrency/retry tests, or proving an actual provider round trip. No production-readiness claim is made.

## Required staging acceptance

1. Apply migration using the approved migration process and inspect database advisors.
2. Confirm `anon` and `authenticated` cannot select/insert/update the outbox or execute queue RPCs.
3. Confirm service role can enqueue a permitted target and the persisted row is returned.
4. Repeat same key/event: one durable row; same key/different event: rejected.
5. Claim concurrently from two workers: no job is leased twice.
6. Complete as success; simulate failure and inspect backoff; exhaust retries and inspect dead-letter status.
7. Let a lease expire and verify safe recovery.
8. Inspect diagnostics and prove no PII, tokens, or credentials appear in stored error text.
9. Verify candidate registration, opportunity discovery, preparation, document vault and tracking remain operational while Airtable is disconnected.
