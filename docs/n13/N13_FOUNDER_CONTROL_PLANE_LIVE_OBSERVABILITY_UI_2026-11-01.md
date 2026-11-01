# N13 Founder Control Plane live observability UI — 1 November 2026

## Scope

Wire the N13 founder-only Supabase Edge Function into the Founder Control Plane without exposing service-role credentials or candidate-level records to the browser.

## Runtime contract

- The panel reads the current Supabase Auth access token from the existing Kingsmen browser session.
- Requests use the public Supabase URL, public anon key and the signed-in user's bearer token.
- The Edge Function resolves the token with Supabase Auth and independently checks for an active, non-revoked `PLATFORM_ADMIN` grant. A JWT role claim alone is not trusted.
- GET loads the latest persisted health snapshot and service checks.
- POST is available only behind a two-step founder confirmation and captures aggregate health snapshots, service checks and metric samples.
- The panel displays counts only. It does not request candidate identifiers, names, contact details, documents, applications or provider credentials.
- Browser requests use `cache: no-store`; no service-role key is referenced by the UI.

## Health semantics

- `UNKNOWN`: no valid current observation or query failures.
- `RED`: an open SEV1, candidate-cap breach or confirmed down service.
- `AMBER`: partial coverage, degraded queues, failed workflows, open SEV2 or other unresolved risk.
- `GREEN`: permitted only after complete telemetry and all required external service probes are present.

The current N13 backend intentionally reports `coverage: PARTIAL` and `productionReady: false`. It observes Supabase Auth/PostgreSQL aggregates only. Email delivery, Netlify, worker and provider health, and backup/restore are not inferred from the database responding.

## Failure handling

- 401: founder session absent or expired.
- 403: active `PLATFORM_ADMIN` grant absent.
- 404: N13 Edge Function not deployed to the configured Supabase project.
- 429: capture rate limit; the panel displays the returned retry window.
- 5xx/network errors: the panel withholds the snapshot and shows a safe runtime error.

## Validation

`scripts/tests/test-n13-live-observability-ui.mjs` checks the authentication method, public-key-only boundary, GET/POST separation, explicit capture confirmation, uncached requests, aggregate-only output and Control Plane mount.

## Deployment boundary

This UI is integrated into the N13 workstream branch and requires the N13 Edge Function to be deployed with JWT verification enabled. It is not deployed to staging or production by this source change.

At the 1 November 2026 inspection, the staging Supabase Edge Function inventory did not contain `n13-observability-runtime`; the staging migration ledger ended at 0095. The function must not be deployed from an unmerged draft. Independent review, approved merge, deployment with `verify_jwt=true`, authenticated founder runtime tests and redacted evidence capture remain release gates.


## Atomic capture hardening — 1 November 2026

The N13 capture path uses the migration `20261101170000_n13_atomic_observability_capture.sql` to commit the health snapshot, service checks and metric samples in one PostgreSQL transaction. A transaction-level advisory lock enforces the 60-second capture cooldown so concurrent requests cannot race past the limit. The RPC validates JSON object/array types and batch bounds, uses a pinned `pg_catalog` search path, and is executable only by `service_role`.

The Edge Function still authenticates every caller with Supabase Auth and checks the active, non-revoked `PLATFORM_ADMIN` grant. The persisted evidence references the opaque `platform_reviewers.id` rather than a generic Founder actor marker. The SQL migration must be independently reviewed and applied only after migration provenance and protected backup/restore gates pass. This source change does not deploy or apply the migration.
