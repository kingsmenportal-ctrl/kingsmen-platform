# N15 Staging Runtime Matrix — 2026-10-25

## Purpose

Run the source-ingestion and candidate-feed runtime checks only after the reviewed N15 Edge Functions have been deployed to the staging project. The runner is credential-gated and does not print bearer tokens or service keys.

## Command

`npm run n15:runtime:matrix`

Required environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Runtime identities:
- `N15_ORDINARY_USER_ACCESS_TOKEN`: valid authenticated non-reviewer; expected ingestion HTTP 403.
- `N15_REVIEWER_ACCESS_TOKEN`: active authorised reviewer; used for live ingestion only when explicitly enabled.
- `N15_CANDIDATE_A_ACCESS_TOKEN` and `N15_CANDIDATE_B_ACCESS_TOKEN`: separate candidate sessions, each expected to resolve to a different verified candidate link.
- `N15_RUN_LIVE_INGESTION=true`: explicit opt-in to crawl the configured active source authorities and write ingestion ledger/observation rows.
- `N15_TEST_BACKEND_SERVICE_PATH=true`: additionally call the source-ingestion endpoint using the exact server-held service-role key and verify its durable run ledger. This also requires the live-ingestion opt-in and performs an additional crawl.

## Runtime cases

The runner checks missing, invalid and forged/tampered service-role claims; ordinary-user denial; optional authorised-reviewer ingestion; durable run-ledger finalisation; review-only observation status; and candidate identity/feed separation. It checks HTTP responses and reads persisted staging rows through the service-role REST endpoint. It never upgrades an observation to VERIFIED or an opportunity to OPEN.

## Release constraints

At the time this matrix was added, staging reports source-ingestion function version 2 and candidate-opportunities version 2. The deployed ingestion source still contains the unverified JWT payload decoder, and the deployed candidate feed still uses broad row selection and does not fail closed on every evidence-query error. Therefore the new branch code is NOT yet what staging is serving.

Do not run the live ingestion matrix against the old deployed version and report the results as validation of the fix. First obtain independent review and required repository checks; then deploy the reviewed branch to staging through the normal release path and record the resulting function versions/hashes. Only then run this matrix.

The current staging database baseline was inspected read-only:
- 21 active source authorities.
- 0 rows in `external_source_observations`.
- 0 rows in `n15_ingestion_runs`.
- 0 approved, official, human-reviewed candidate match rows.

The empty baseline means publication-isolation checks cannot yet demonstrate positive delivery and rejection of bad fixtures. Candidate A/B tokens and a verified identity-link setup are also required. Expired/unverified evidence and database-failure injection need dedicated controlled fixtures after deployment; absence of rows is not a passing end-to-end test.

## Evidence status

- Runtime harness and npm command: committed to N15 branch.
- Static contract tests: committed; latest automated workflow result unavailable.
- Live source ingestion: NOT RUN.
- Authentication matrix against corrected deployed code: NOT RUN.
- Candidate A/B positive-data isolation: NOT RUN.
- Stale/unverified publication fixture tests: NOT RUN.
- Database error injection: NOT RUN.
- Deployment identity for corrected code: NOT AVAILABLE.
- Production readiness: FALSE.
