# N15 Operator Run History — 2026-11-01

## Scope

This workstream adds an authenticated, read-only run-history view to the existing N15 Official Source Ingestion operator screen. It reuses the existing `public.n15_ingestion_runs` ledger and does not introduce a table, migration, candidate record, provider integration or new source authority.

The existing POST operation remains the only action that starts an ingestion run. A GET request only reads the latest 50 run summaries.

## Read-model contract

The GET response includes only:

- `run_ref`
- `status`
- `sources_checked` and `sources_succeeded`
- `observations_created`, `observations_updated` and `observations_skipped`
- `started_at` and `finished_at`

It deliberately excludes the raw JSON `summary`, source URLs, observation payloads, evidence locators, candidate identifiers, identity/profile data, document paths and provider response bodies. Results are ordered newest-first and capped at 50 rows. Responses are marked `Cache-Control: no-store`.

## Authorization and method boundaries

- OPTIONS is limited to the existing configured staging origin.
- GET and POST are the only supported application methods.
- The exact server-held Supabase service-role key is the only backend bypass.
- Every other bearer is verified through Supabase Auth and mapped to an active permitted row in `platform_reviewers`.
- Invalid/missing identity is rejected; an authenticated user without a permitted active reviewer role receives 403.
- The history read is executed with the server-held service client after authorization. The client UI never receives or stores a service-role key.
- A history refresh does not initiate a crawl. A separate explicit button issues POST.

## Data and privacy boundary

The ledger currently contains zero run rows in staging. The underlying table has RLS enabled with a service-role-only policy. Read access is mediated through the Edge Function rather than direct candidate/browser table access.

The current staging grant inventory also reports broad table-level GRANT metadata for anon/authenticated on this backend table. No direct read policy is present, so RLS remains the enforcement boundary; a separate least-privilege migration/reconciliation should remove unused client grants after migration-provenance and backup/restore gates are satisfied. This workstream does not change grants or schema.

## Validation

The source contract suite now checks the GET method allowlist, authenticated reviewer gate, explicit aggregate projection, 50-row cap, no raw summary exposure, and the operator page's separation between read-only GET and explicit POST.

## Release status

- Code and source-contract tests: proposed in a feature branch stacked on N15 authentication hardening PR #169.
- Database schema: reused; no migration created or applied.
- Candidate data: not read or changed.
- Live source crawl: not run.
- Authenticated staging GET matrix: not run.
- Candidate A/B isolation: outside this read-only operator workstream.
- Netlify/Edge Function deployment: not performed by this change.
- Production readiness: FALSE until independent review, exact-head CI, dependency merge order, staging authentication tests and founder release approval.
