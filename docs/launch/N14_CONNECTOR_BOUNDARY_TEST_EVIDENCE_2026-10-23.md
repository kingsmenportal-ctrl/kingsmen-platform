# N14 connector boundary regression suite — evidence record

Date: 2026-10-23

## Scope
Added `scripts/staging/test-n14-connector-boundaries.mjs`, a regression suite that transpiles and exercises the repository's actual N14 connector module. It covers:
- the 19-entry workflow registry and W24 -> W17 contract;
- the eight-node worker contract and exactly-one backend result post;
- Airtable's mirror-only boundary;
- Playwright CAPTCHA/OTP fallback and required probe evidence;
- PayFast's prohibition on deciding refunds;
- urgent-only WhatsApp;
- webhook verification fail-closed behaviour;
- integration dead-letter requirements for cause, reason, fix path and evidence.

## Run
```bash
node scripts/staging/test-n14-connector-boundaries.mjs
```

The test requires the repository's TypeScript dependency to be installed. It does not call external providers or need secrets.

## Evidence boundary
- Test source was committed on `test/n14-connector-boundaries-2026-10-23`.
- The test has **not been executed here**; no pass is claimed.
- This is a local module boundary test, not a staging integration or end-to-end candidate journey test.
- No provider credentials were added, no Airtable target was created, and no deployment was performed.
- Production readiness remains false until runtime, security, and end-to-end gates have real evidence.


## Executed CI evidence — 2026-10-23
- GitHub Actions run: `Kingsmen Release Evidence`, run ID `39992339165`, conclusion **success**.
- GitHub Actions run: `Kingsmen Source Guard`, run ID `39992339185`, conclusion **success**.
- GitHub Actions run: `Jarvis Live Runtime`, run ID `39992339149`, conclusion **success**.
- The repository test-suite step passed after resolving TypeScript from the API package dependency context. The expanded N14 boundary test is included in that suite.
- API build and web build passed in the release-evidence run.
- The isolated API smoke checks passed for `GET /health` (HTTP 200), `GET /api/system/health` (HTTP 200), and unknown-route contract (HTTP 404).
- These are code/CI boundary and isolated API smoke results; they do **not** prove that any external connector completed a real provider operation.
- CI evidence artifact: `kingsmen-release-evidence-39992339165` (artifact ID `12517639624`).

## Provider/runtime evidence reconciliation
Read-only queries against Supabase staging project `euhubhhnumtibbyufghm` returned zero rows in `airtable_sync_targets`, `airtable_sync_outbox`, and `integration_health_snapshots`. The N07 enqueue and N08 founder-health Edge Functions are deployed and active with JWT verification enabled, but deployment state alone does not prove provider connectivity. The inspected N08 function reports degraded readiness when no active Airtable target or active platform reviewer grant exists; the staging database has not supplied a live provider operation to validate in this run. A Supabase log query for 2026-10-23 16:30–17:30 UTC returned Postgres, PostgREST, and PgBouncer logs, but no Edge Function log source, so it provides no evidence of a live connector invocation.

No successful Airtable, email, WhatsApp, PayFast, Playwright, or n8n provider response is claimed. Airtable remains unconfigured as an optional mirror; no target or outbox row was fabricated to make a test appear successful.

## Remaining N14 gates
- For each connector that has an authorised configuration, execute a safe, non-destructive health/probe or sandbox transaction and capture redacted request/result IDs, response status, timestamps, and failure reason where unavailable.
- For providers not configured, record `NOT_CONFIGURED`/blocked with cause and remediation rather than reporting success.
- Exercise retry/dead-letter handling against a controlled failure and verify persisted evidence.
- No external provider integration, staging connector runtime, or production deployment is claimed. Production readiness remains **false**.
