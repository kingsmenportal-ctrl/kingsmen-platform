# N06/N15 candidate opportunity and pathway-preparation batch — 2026-10-23

## Shipped in source and staging

- Candidate opportunity page queries `current_verified_route_opportunities`, not a client-side filter over the base route table. The view is the single source of fail-closed catalogue rules.
- Opportunity cards use the view's `programme_id` and verified-record timestamp fields, preserving the existing account-save flow.
- The view includes only verified, public-safe providers and programmes marked OPEN, with HTTPS sources and an update within 90 days; it excludes programmes with expired verified deadlines in South African time.
- Staging grants `anon` and `authenticated` SELECT on the intentionally public-safe catalogue view. It uses `security_invoker=true`; underlying grants and RLS still apply. No candidate data is included.
- Candidate application preparation Edge Function is ACTIVE v14 with `verify_jwt=true`.
- Tracker creation supplies pathway-specific preparation items for higher education, TVET, SETA/learnerships, internships, apprenticeships and employment. Provider-specific requirements must be confirmed; document items are not universally mandatory by default.
- Candidate tracker progress remains candidate-reported. A candidate-reported submission is not provider receipt, and neither is a provider-confirmed outcome.
- Added migration `0094_n05_document_application_owner_index.sql` to cover the composite (application_id, candidate_id) foreign key for private documents. The staging migration was applied successfully and the index was verified present.

## Live staging checks

- Current verified opportunity view returned 6 eligible records: 0 non-HTTPS, 0 stale (>90 days), 0 non-OPEN.
- Candidate application preparation: ACTIVE v14, `verify_jwt=true`.
- Current staging inventory: 0 verified candidate identity links, 0 trackers, 0 private document rows, 0 document-review rows, 0 identity-review requests and 0 communication attempts. There is no real candidate journey evidence to claim yet.
- Post-migration performance advisor no longer reports the composite document/application ownership FK as unindexed. It still reports a broad unused-index inventory (informational; no indexes were removed).
- Security advisor still reports informational RLS-without-policy findings on identity-review requests/audit and private-document reviews. These tables fail closed to direct client access; reviewer operations must remain behind the authenticated Edge Function and service-side transaction. Do not add broad client policies to silence the lint.
- Security advisor also reports leaked-password protection disabled. This remains an Auth configuration gate; it is not safely changed through a database migration.

## Automated verification on the current source commit

Commit `de54519cd975009d93f956fba70a245fda8a113c` completed these PR workflows successfully:
- Kingsmen One smoke tests: [run #39974382407](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39974382407).
- Kingsmen Release Evidence: [run #39974382396](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39974382396).
- Kingsmen Source Guard: [run #39974382433](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/39974382433).
- The separate Main Branch Protection Evidence job failed because branch protection could not be verified with the workflow's available read-only credential/permissions. The report explicitly did not change branch protection. Do not bypass this gate.

The earlier smoke run recorded 33 tests passed, 0 failed. The current commit's smoke workflow also completed successfully; it is static/repository verification, not the authenticated candidate E2E journey.

## Communications, worker recovery and outcomes

- Communication attempt and submission queue tables have durable idempotency/queue indexes; staging currently has 0 communication-attempt rows and 0 submission jobs. This proves schema presence, not provider delivery, retry or callback behavior.
- Worker registry and heartbeat tables exist, but the registry and heartbeat table currently have 0 rows. Worker recovery/heartbeat success is not runtime-verified.
- Candidate-reported tracker states and checklist evidence remain separate from independently verified provider receipt/outcomes. No provider outcome was fabricated.
- Controlled tests still need to exercise consent, email-primary behavior, SMS fallback, urgent-only WhatsApp, provider callbacks, retry/idempotency, dead-letter recovery, worker heartbeat/lease expiry, safe replay and founder alerting.

## Netlify deployment verification

- Netlify project metadata identifies `kingsmen-portal-staging` and a changing branch-preview alias, most recently `http://6adb7660011b3a9ca76a4d0c--kingsmen-portal-staging.netlify.app`.
- The integration did not return a usable published deploy ID or commit SHA. The available runtime could not resolve the Netlify host for an HTTP check, and Netlify observability returned no request records in the queried 24-hour window.
- Therefore the candidate UI's live HTTP response, deployed asset contents, and published-commit match remain **unverified**. A changed branch alias alone is not proof of a successful deployment.

## Required gates before full end-to-end sign-off

1. Identify two explicitly authorised test candidate accounts and one authorised reviewer account; do not infer authority from email addresses or the existing Auth-user count.
2. Complete reviewer-approved identity linking for both candidates, then exercise login, feed read, tracker create/read/update, durable reload/restart, private upload, signed read expiry/audit, review decisions and candidate-A-to-candidate-B denial.
3. Verify communications and queue behavior with controlled test providers.
4. Verify worker heartbeat/lease expiry/recovery, safe replay/idempotency, incident evidence and founder alerting.
5. Confirm Netlify's published deploy ID, commit SHA, HTTP status and candidate app bundle match the reviewed source commit.
6. Re-run Supabase security/performance advisors and repository tests; resolve the Auth leaked-password-protection configuration gate and obtain a valid read-only branch-protection evidence path.

No fake candidate, reviewer, identity link, document, provider outcome or delivery event was inserted. Full E2E completion is not claimed.
