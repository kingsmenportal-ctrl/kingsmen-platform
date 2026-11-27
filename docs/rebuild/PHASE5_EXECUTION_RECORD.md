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

## Communications rerun — 2026-11-27

The prior failure was caused by running the communications bootstrap after the finance bootstrap on one branch. Both fixtures define overlapping baseline tables and are standalone fixtures, not sequential migrations. The corrected test procedure uses a fresh, separate disposable branch for communications rather than suppressing schema checks or changing the migration preflight.

- Disposable Neon branch: `phase5-comms-clean-2026-11-27` (`br-super-sunset-bhvbjgbk`)
- Parent: `br-young-surf-bhthqivn` in rehearsal project `bitter-mouse-01847035`; this is still not a verified restore of the source Kingsmen database.
- Communications bootstrap fixture: PASS — 8 SQL statements executed.
- Communications event/outbox migration: PASS — 20 SQL statements executed; the preflight remained enabled.
- Communications SQL integration test: PASS — all 3 SQL statements executed; test returned: `PASS: consented events enqueue idempotently; worker claims are atomic, mock outcomes are not delivery, and retry exhaustion is recorded.`
- The SQL test exercised both the document-review event and the transition to server-verified `COMPLETE` payment, preference/opt-out gating, idempotent payment updates, non-disclosure of reviewer notes/evidence, service-role-only worker RPC grants, queue claims, simulated outcomes, retry and terminal failure. No live email was sent; mock outcomes were not marked `SENT`.
- The document-review Edge Function source was inspected: caller bearer authentication, verified identity-link requirement, active candidate check, private bucket validation, owner-scoped document queries, short-lived signed read links and audit-before-return are present in the inspected code. These are source findings, not an authenticated runtime E2E pass.
- The PayFast ITN validator source was inspected: it checks merchant reference, signature, amount, duplicate receipt, source/IP verification and `COMPLETE` status before accepting. No real PayFast sandbox round-trip was performed.

## Updated acceptance state

- [x] Finance fixture, least-privilege migration and SQL test passed on a disposable Neon branch.
- [x] Communications fixture, migration preflight and SQL integration/state-machine tests passed on a separate clean disposable Neon branch.
- [x] Document-review event and verified-payment notification enqueue paths exercised in SQL, including consent, idempotency and mock-only delivery semantics.
- [x] Source inspection performed for private-document access boundary and PayFast ITN validation logic.
- [ ] Authenticated document upload/review/download and signed-link expiry end-to-end runtime test.
- [ ] PayFast provider sandbox transaction and actual provider-authenticated ITN round-trip.
- [ ] Actual email-provider delivery, bounce and unsubscribe round-trip.
- [ ] Verified backup and isolated restore of the real Kingsmen database; staging migration provenance remains unresolved.
- [ ] Run CI against the new record commit and reconcile all release gates before considering merge/deployment.

## External runtime and backup gate verification — 2026-11-27

Read-only inspection of the connected Supabase staging project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`) confirmed:

- `candidate-private-documents` is ACTIVE, version 17, with JWT verification enabled.
- `payfast-sandbox` is ACTIVE, version 10. Its source reports that a GET health response exposes only whether required configuration is missing; this session could not invoke the Edge Function URL through an available runtime tool.
- The private document bucket `kingsmen-candidate-documents` exists, is private, is limited to 10 MiB, and allows only PDF/JPEG/PNG.
- The connected staging schema contains the document, finance, PayFast ITN, communication-preference and notification-outbox tables. Relevant upload/finalize/read-audit and sandbox payment RPCs exist.
- The private document bucket currently contains zero objects, so there is no existing staging document to use for a reviewer/download/expiry journey without creating an authenticated test identity and test record.
- Supabase migration ledger has 130 rows. This is a count only; it does not resolve the previously identified source migration provenance mismatches.
- Neon rehearsal project `bitter-mouse-01847035` reports zero snapshots. Its branches are rehearsal fixtures, not a verified backup of the Kingsmen source database.

## Runtime execution blockers — must not be represented as passes

1. **Authenticated document journey:** requires a dedicated staging test candidate, confirmed candidate-auth identity link, and a reviewer identity authorized by the staging policy. No credentials or approved test identity are available in this session. Anonymous requests and source checks cannot prove upload/review/download/expiry end to end.
2. **PayFast sandbox round-trip:** requires active sandbox merchant credentials and an eligible verified staging candidate/plan. Secret values are intentionally not read or exposed. The checkout and ITN handler are deployed, but no provider-confirmed transaction or authenticated provider ITN was executed here.
3. **Email provider delivery/bounce/unsubscribe:** the SQL outbox is tested, but no provider-specific credentials, webhook signing secret, controlled recipient, or provider delivery/bounce/unsubscribe event was available. No email was sent.
4. **Backup/restore:** no verified source backup archive or source identity/checksum/creation timestamp was found in the connected Neon rehearsal project. Creating a branch from staging or replaying migrations would not constitute a backup-based restore and would not resolve provenance. No restore was attempted.

The requested live checks remain blocked by these missing inputs. No secrets were printed, no external payment was initiated, no email was sent, and no production database was modified. Do not mark Phase 5 or launch readiness complete until these runtime proofs are captured on the correct isolated staging/restore targets.



## Automated provisioning attempt and hard gates — 2026-11-27

The connected tooling was inspected for safe automation of staging Auth users, provider secrets, and a source backup. The currently available Supabase connector supports read-only SQL, function inspection/deployment, and branch operations, but exposes no Supabase Auth-admin user provisioning, secret-manager write, database-backup export, or arbitrary Edge Function invocation operation. The connected Neon tooling can create snapshots/branches, but a snapshot of the rehearsal project or staging project would not be a source backup of the real Kingsmen database. No substitute artifact or identity was fabricated.

### Execution boundaries
- **Backup:** require a source-owned archive or authorized source storage locator, immutable source database/project identity, creation timestamp, and SHA-256. Restore into a new isolated target with application migrations disabled; record schema inventory and checksums before/after. Never use the rehearsal branch as the source.
- **Candidate/reviewer:** create through the staging Supabase Auth admin path with unique non-production test addresses; confirm identities through the real auth flow, and grant reviewer capability through the existing staging authorization policy—not by writing role claims directly or bypassing RLS. No admin-user creation endpoint is available through the connected tool set in this session.
- **PayFast:** add merchant ID, merchant key, passphrase, and sandbox mode only in the staging function secret store; never commit them. Use a staging candidate with an eligible plan and a provider-generated sandbox ITN; validate signature/amount/reference and replay/idempotency behavior. No secret-store write or function invocation capability is exposed by the connected tools here.
- **Email:** configure a provider account/API key and webhook signing secret only in the staging secret store; use an explicitly controlled recipient. Verify provider acceptance, delivered/bounce event signature, unsubscribe/opt-out persistence, suppression of later sends, idempotent webhook replay, and that test/mock delivery never becomes SENT without provider evidence. No provider credentials or controlled recipient were available, and no email was sent.
- **Documents:** create a real staging Auth session for the candidate and reviewer, then test upload -> finalize -> reviewer decision -> candidate download -> signed URL expiry/denial, with cross-user denial, oversized/invalid MIME rejection, and audit event assertions. Source/SQL checks are not a substitute for this runtime proof.

### Current release decision
These gates remain **BLOCKED**, not passed. No production resources were modified, no live payment was initiated, no message was sent, no credentials were exposed, and no backup restore was attempted. The next useful external action is to place the authorized source backup in a connected storage location and configure the required staging secrets/identities through their native admin consoles; after those prerequisites exist, run the runtime tests and attach raw redacted evidence to this record.
