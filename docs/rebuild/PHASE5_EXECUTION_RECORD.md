# Phase 5 — Documents, Finance and Communications Execution Record

Last updated: 2026-11-27
Repository: `kingsmenportal-ctrl/kingsmen-platform`
Implementation branch: `feat/candidate-application-journey-batch-2026-11-26`
Related pull request: [#358](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358)
Evidence commit inspected: `e42193466d9c986b4249c6d8c29ae71df450d740`

## Status

**Phase 5: partially implemented; not accepted as complete.** Source contracts and CI fixtures are present for document access, canonical package pricing, finance least-privilege boundaries, operator finance authorization and event-driven communications. Real restored-database verification and live provider verification remain blocked. This record does not claim deployment or production verification.

## Implemented in source

### Documents
- Candidate document UI describes private PDF/JPEG/PNG uploads, 10 MiB limit, short-lived upload capability and temporary read links.
- Candidate upload/read/status web routes proxy through the existing private-document Edge Function; reviewer queue, decisions and reviewer download URL routes are present.
- Proxy contract requires caller bearer authentication, bounded/allowlisted request bodies, no-store responses, timeouts, public anon key only, and no service-role credential in the web route.
- Candidate-reported upload is explicitly distinct from human reviewer verification; provider receipts are not automatically verified.

Evidence: `apps/web/src/app/candidate/documents/page.tsx`, `apps/web/src/lib/private-document-proxy.ts`, `apps/web/src/app/api/candidate/documents/*`, `apps/web/src/app/api/founder/documents/review/*`, `apps/web/src/components/operator/DocumentReviewConsole.tsx`, `scripts/staging/test-document-proxy-boundary.mjs`.

### Finance
- Canonical plan codes and prices are represented in API finance types/catalog and the package UI; contract checks cover eight plans and the Foundational Accord accommodation allowance.
- A versioned finance least-privilege migration and disposable SQL fixture test cover finance, payment and communication tables.
- Finance operator API requires authenticated active finance/admin reviewer authorization before service-role reads.
- Refund mutations remain disabled because the live refund/order schema mapping is unresolved.
- Browser return/redirect is not accepted as payment proof; live payment activation remains disabled.

Evidence: `apps/api/src/finance/finance-types.ts`, `apps/api/src/finance/pricing-catalog.ts`, `apps/web/src/app/packages/page.tsx`, `supabase/migrations/20261127130000_phase5_finance_least_privilege.sql`, `scripts/staging/test-phase5-finance-privileges-contract.mjs`, `scripts/staging/test-phase5-pricing-catalog.mjs`, `scripts/staging/test-phase5-finance-operator-boundary.mjs`.

### Communications
- Versioned event/outbox migration defines idempotent document-review and verified-payment notification enqueue contracts.
- Worker code uses an authenticated worker boundary, bounded request handling, retryable queue claims and mock provider mode; source contract explicitly prevents mock delivery from asserting a real send.
- Production messaging remains disabled unless the explicit live-messaging switch and approved configuration are present.

Evidence: `supabase/migrations/20261127140000_phase5_communications_event_outbox.sql`, `supabase/functions/communications-outbox-worker/index.ts`, `scripts/staging/test-phase5-communications-outbox-contract.mjs`.

## CI evidence observed

On commit `e42193466d9c986b4249c6d8c29ae71df450d740`, the connected GitHub Actions integration returned these completed-success runs:
- [Kingsmen CI #806](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45996797444)
- [Jarvis Live Runtime #2879](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45996797489)
- [Staging RLS API boundary #61](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45996797459)
- [Application draft contract #198](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/45996797831)

These results establish CI success for that exact commit and workflows; they do not prove that the finance/communications migrations were executed against a real restored database, that PayFast sandbox accepted a transaction, that email was delivered, or that the candidate/reviewer/payment journey is production-verified. Recheck CI after further changes.

## Database, security and release gates

- `20261127130000_phase5_finance_least_privilege.sql` and `20261127140000_phase5_communications_event_outbox.sql` are source migrations; they have not been applied to staging or production.
- The actual backup and isolated restore remain unverified. Staging migration provenance remains unresolved, so no replay or live DDL is authorized.
- Real PayFast sandbox credentials/provider round-trip have not been verified in this record.
- Real email provider delivery, bounce webhooks and unsubscribe round-trip have not been verified in this record.
- Reviewer/finance role isolation, signed-link expiry and full end-to-end journey still require isolated restored-schema and authenticated runtime evidence.
- No merge or deployment is claimed here. Live payments and production messaging remain disabled.
- Do not mark Phase 5 complete until migration tests execute against a disposable PostgreSQL database, relevant runtime security tests pass, provider sandbox/delivery checks are evidenced, and all release gates are reconciled.

## Acceptance checklist

- [x] Source-level private-document proxy and reviewer route contracts exist.
- [x] Canonical package/pricing source contract exists.
- [x] Finance least-privilege migration and SQL fixture contract exist.
- [x] Finance operator authorization contract exists; refund mutations fail closed.
- [x] Communications event/outbox and mock-provider boundary contracts exist.
- [x] Exact-commit CI runs listed above completed successfully.
- [ ] Execute finance and communications migrations plus SQL integration tests in a disposable PostgreSQL environment.
- [ ] Verify candidate and reviewer document access, reviewer actions, and signed URL expiry end-to-end.
- [ ] Verify PayFast sandbox checkout and server-side ITN authenticity/amount/merchant/idempotency checks.
- [ ] Verify actual notification provider delivery, retries, bounces and opt-outs.
- [ ] Verify integrated candidate/operator journey against a verified isolated restore.
- [ ] Update release manifest with evidence and pass all applicable gates.
- [ ] Obtain required release approval before merge/deployment or enabling live providers.

## Next execution target

Repair any current PR-head CI regressions, then run the Phase 5 finance and communications SQL tests against a disposable PostgreSQL database without touching staging or production. In parallel, inspect the current private-document Edge Function and payment ITN handler against the required authorization and provider contracts. Keep the restore/provenance gate intact.


## Disposable PostgreSQL execution — 2026-11-27

An isolated Neon branch was created in the existing rehearsal project:
- Project: `kingsmen-isolated-restore-rehearsal-2026-11-26` (`bitter-mouse-01847035`)
- Disposable branch: `phase5-sql-test-clean-2026-11-27` (`br-hidden-paper-bhnilnhk`)
- Parent: `br-young-surf-bhthqivn`
- This is a test branch of the rehearsal project, not a verified restore of the real Kingsmen database.

Observed execution:
- Finance fixture: PASS — 48 SQL statements executed.
- Finance least-privilege migration: PASS — 6 SQL statements executed.
- Finance SQL integration test: PASS — 2 SQL test blocks executed.
- Communications fixture: BLOCKED — it collides with tables already created by the finance fixture (`candidate_communication_preferences` already exists). A separate clean branch was used to avoid treating partial fixture setup as success.
- Communications migration: BLOCKED — its explicit preflight raised `PHASE5_COMMUNICATION_SCHEMA_INCOMPLETE`, naming missing `candidate_private_document_reviews`, `candidate_private_documents`, `communication_templates`, `notification_delivery_attempts`, and `notification_outbox`. The communications SQL test was not run.

Required repair: make the finance and communications disposable fixtures composable or run each against independent clean branches, then supply the complete existing document/outbox schema needed by the communications migration and rerun migration plus SQL tests. Do not remove the migration preflight or weaken the test. No source database or production schema was changed by these test calls.

## Updated acceptance state

- [x] Finance migration and SQL privilege test executed on a disposable Neon branch.
- [ ] Communications migration and SQL integration test — blocked by incomplete/overlapping fixture schema; exact error above.
- [ ] Full document-review and payment-notification end-to-end journeys — not yet runtime-verified.
- [ ] Verified backup and isolated restore of the real Kingsmen database — still unavailable; the Neon rehearsal branch is not a substitute.
