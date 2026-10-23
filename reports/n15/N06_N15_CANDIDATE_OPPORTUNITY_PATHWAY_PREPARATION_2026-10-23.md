# N06/N15 candidate opportunity and pathway-preparation batch — 2026-10-23

## Shipped in source and staging

- Candidate opportunity page queries `current_verified_route_opportunities`, not a client-side filter over the base route table. The view is the single source of fail-closed catalogue rules.
- Opportunity cards use the view's `programme_id` and verified-record timestamp fields, preserving the existing account-save flow.
- The view includes only verified, public-safe providers and programmes marked OPEN, with HTTPS sources and an update within 90 days; it excludes programmes with expired verified deadlines in South African time.
- Staging grants `anon` and `authenticated` SELECT on the intentionally public-safe catalogue view. It uses `security_invoker=true`; underlying grants and RLS still apply. No candidate data is included.
- Candidate application preparation Edge Function is ACTIVE v14 with `verify_jwt=true`.
- Tracker creation supplies pathway-specific preparation items for higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. Provider-specific requirements must be confirmed; document items are not universally mandatory by default.
- Candidate tracker progress remains candidate-reported. A candidate-reported submission is not provider receipt, and neither is a provider-confirmed outcome.
- Added migration `0094_n05_document_application_owner_index.sql` to cover the composite (application_id, candidate_id) foreign key for private documents. The staging migration was applied successfully.

## Live staging checks

- Current verified opportunity view returned 6 eligible records in the earlier live snapshot.
- Earlier feed checks: 0 non-HTTPS rows, 0 stale rows (>90 days), 0 rows not marked OPEN, and 0 eligible rows with an expired verified deadline.
- Candidate application preparation: ACTIVE v14, `verify_jwt=true`.
- Staging ownership/security inventory currently reports 0 verified candidate identity links, 0 trackers, 0 private document rows, 0 document-review rows, 0 identity-review requests and 0 communication attempts. These empty tables mean there is no real candidate journey evidence to claim yet.
- The composite ownership index migration succeeded. Post-migration index and advisor re-checks are still required before calling the performance finding resolved.

## Automated verification

- GitHub Actions workflow `Kingsmen One smoke tests`, run #348, passed on commit `698f278effe3829da81c01abb57fa4599fc80636`.
- Node syntax checks passed for `app.js` and `supabase-client.js`.
- All 33 candidate-workflow smoke tests passed (33 passed, 0 failed), including the fail-closed verified-feed UI assertion.
- Run evidence: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39973477430

## Communications, worker recovery and release gates — current findings

- Communication attempt and submission queue tables have durable idempotency/queue indexes; the database currently has 0 communication-attempt rows and 0 submission jobs. That proves schema presence, not delivery or retry behavior.
- Worker registry and heartbeat tables exist, but both the registry and heartbeat table currently have 0 rows. Worker recovery/heartbeat success is therefore not runtime-verified.
- Security advisor currently reports informational RLS-without-policy findings on identity-review requests/audit and private-document reviews. Those tables fail closed to direct client access; reviewer operations must remain behind the authenticated Edge Function and service-side transaction. Do not add broad client policies to silence the lint.
- Security advisor also reports leaked-password protection disabled. This remains an Auth configuration gate; it is not safely changed through a database migration.
- Performance advisor reported the composite document/application ownership FK as unindexed. Migration 0094 adds the matching composite index. The next advisor run must confirm whether the finding clears.
- Netlify project metadata returned no usable published deploy ID or published commit SHA. Public-site HTTP checks from this runtime could not resolve the Netlify host. Therefore the live candidate UI deployment and published-commit match are **not verified**.

## Required gates before full end-to-end sign-off

1. Identify two explicitly authorised test candidate accounts and one authorised reviewer account; do not infer authority from email addresses or existing Auth-user count.
2. Complete reviewer-approved identity linking for the two candidates, then exercise login, feed read, tracker create/read/update, durable reload/restart, private upload, signed read expiry/audit, review decisions and candidate-A-to-candidate-B denial.
3. Verify communication consent, email-primary behavior, SMS fallback, urgent-only WhatsApp, idempotent retries, provider callbacks and dead-letter/recovery paths using controlled test providers.
4. Verify worker heartbeat/lease expiry/recovery, safe replay/idempotency, incident evidence and founder alerting.
5. Confirm Netlify's published deploy ID, commit SHA, response status and candidate app bundle match the reviewed source commit.
6. Re-run Supabase security/performance advisors and repository tests; do not bypass branch protection or SSO.

No fake candidate, reviewer, identity link, document, provider outcome or delivery event was inserted. No full E2E completion is claimed.
