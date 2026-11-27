# Phase 5 — Documents, Finance and Communications Execution Record

**Date:** 27 November 2026  
**Status:** IMPLEMENTATION IN PROGRESS — not release-complete  
**Repository:** https://github.com/kingsmenportal-ctrl/kingsmen-platform  
**Branch:** `feat/candidate-application-journey-batch-2026-11-26`  
**Source implementation head with successful build/browser validation:** `6156082f4185e6779f3476e92fb05c40d03dfb55`  
**Current branch head at this update:** `5c4c0b5bb055f4f6a4fdc2586da239658762d59f` (subsequent commits correct regression-test assertions; latest rerun pending)  
**Pull request:** https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358

## Implemented in source

### Documents
- Added a server-side document API proxy for candidate upload capability, download URL and document list operations. It forwards the caller's bearer token with the public anon key; bounds JSON request bodies; allowlists payload fields; uses no-store responses and an upstream timeout; does not use a service-role credential.
- Replaced the founder document-review route placeholder with authenticated proxy calls to the existing `candidate-private-documents` Edge Function.
- Added an operator document-review console with a review queue, start-review / verify / request-correction / reject decisions, required note and evidence reference for final decisions, and user-initiated temporary HTTPS reviewer links.
- Candidate receipt uploads remain candidate-reported; candidate upload does not grant verification.
- Fixed the browser test so mock API/storage routes cover the second receipt page and wait for authoritative server finalisation instead of treating the preflight filename as completed upload.

### Finance and payment
- Expanded the TypeScript finance catalog to the eight current plan codes and aligned prices/entitlements with the database catalog and package interface.
- Removed the incorrect claim that every paid package includes accommodation routes; the Foundational Accord alone has eight accommodation routes in the canonical catalog.
- Added a finance operator read-only reconciliation page and server API. The API validates the caller session, checks an active `FINANCE_REVIEWER` or `PLATFORM_ADMIN` role before service-role reads, and disables caching. It cannot enable live payments or messaging.
- Added `supabase/migrations/20261127130000_phase5_finance_least_privilege.sql` to revoke direct table privileges (including non-RLS privileges such as TRUNCATE) from `anon` and `authenticated` on finance/payment and candidate-communication tables. The migration includes a schema preflight and is tested in an isolated PostgreSQL fixture.
- **Refund mutation remains deliberately disabled.** The live schema contains both `finance_refund_requests` / `finance_orders` and the legacy `candidate_refund_requests` / `candidate_service_orders`. The current `n10_review_refund_request` RPC operates on the legacy pair, while PayFast finance uses the newer finance tables. Enabling approval actions before this is reconciled would risk reviewing the wrong order model.

### Communications
- Added `supabase/migrations/20261127140000_phase5_communications_event_outbox.sql`: consent-gated email outbox events for document review decisions and verified payments, using reusable templates, idempotency keys, generic content that does not include reviewer notes/evidence, and an explicit `QUEUED` state.
- Added atomic outbox claim and attempt-recording RPCs. The state machine distinguishes `QUEUED`, `LOCKED`, `SIMULATED`, `SENT` and `FAILED`; retryable failures are requeued with backoff and terminal failure follows the third attempt.
- Added `supabase/functions/communications-outbox-worker/index.ts`, protected by the Supabase service JWT plus a separate worker token. It runs only in mock mode; live sending is disabled. Mock acceptance is recorded as `SIMULATED`, never as `SENT` or delivered.
- Added isolated SQL tests for consent/opt-out, idempotent document/payment event enqueue, non-delivery semantics, worker claims, retry and terminal failure.

## Validation evidence

Latest code validation:
- **Application draft contract completed successfully on source implementation commit `6156082f4185e6779f3476e92fb05c40d03dfb55`**: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46010379571. This run built the Next.js application and passed the authenticated document proxy boundary, exact candidate-draft migration/handoff SQL test, isolated finance least-privilege migration test, isolated communications outbox/claim/retry SQL test, and Chromium candidate/document journeys.
- Jarvis Live Runtime passed on current source: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46010643149
- Staging RLS API boundary passed on current source: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46010643134
- Current Kingsmen CI: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46010643241 (in progress at this record update)
- Current application draft contract rerun: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46010643103 (in progress at this record update)
- The preceding Kingsmen CI failure on `6156082...` was a malformed regular expression in the new finance-operator static test, not an application build failure. The assertion was corrected; the current CI rerun must pass before merge.

On commit `04f1ea9ac7fa96a07ac1efc3fb964f66824e87f7`, the root CI, staging RLS boundary and Jarvis Live Runtime completed successfully:
- https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46009741629
- https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46009741663
- https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/46009741769

The successful application draft contract run above is the first complete run covering both new Phase 5 SQL migrations and the full candidate/document browser suite. The current source changes after that validated implementation head are regression-test assertion corrections; their final CI reruns are pending.

## Verified external/runtime findings and blockers

1. **No real backup/restore has been completed.** No migration was applied to staging or production. The actual source backup, checksum manifest and isolated restored target remain prerequisites.
2. **Live privilege exposure requires action.** Read-only staging catalog inspection found direct `anon` / `authenticated` table privileges on finance and candidate-communication tables, including privileges RLS does not control. The new hardening migration removes these grants in source and passes isolated fixture tests, but is not applied to the live database.
3. **No active finance reviewer role was found in the live `platform_reviewers` catalog.** The finance API therefore fails closed for current users until an authorized role is provisioned through the approved access process.
4. **Refund/order schema drift is unresolved.** Do not enable refund approval until the canonical order/refund model and audited RPC are reconciled on the verified restored schema.
5. **Live payment sandbox verification has not been performed in this batch.** PayFast sandbox source exists; no real sandbox credentials/transaction were exercised. Live payments remain disabled.
6. **Real email provider delivery has not been verified.** Event enqueue and mock-worker state transitions are implemented; no provider has been configured or sent a real message. Production messaging remains disabled.
7. **No deployment was performed or verified.** Source code and CI fixtures are not proof of deployed Edge Functions or live runtime behavior.

## Acceptance checklist

| Acceptance criterion | Evidence / state |
|---|---|
| Candidate private upload, ownership and temporary download flow | Existing private-document Edge Function plus authenticated web proxy; latest browser regression rerun pending |
| Reviewer queue and verify / correction / reject workflow | Operator review console and role-enforced Edge Function; latest Next build/browser rerun pending |
| Direct finance/client table privileges removed | Versioned migration + isolated PostgreSQL privilege test passed on prior workflow run; live migration not applied |
| Canonical package pricing and entitlement catalog aligned | Catalog and UI contract test included in root CI; latest HEAD root CI pending |
| PayFast sandbox, ITN authenticity and entitlement activation verified | Existing server-side implementation; real sandbox test not run in this batch |
| Document/payment events enqueue email only with transactional consent | Versioned triggers/templates + isolated PostgreSQL test passed on prior workflow run |
| Outbox idempotency, atomic claims, retries and delivery distinction | Versioned RPCs + isolated SQL state-machine test passed on prior workflow run |
| Real email delivery, bounce handling and provider retries | Mock state machine only; real provider adapter/configuration not verified |
| Refund request/review workflow integrated with PayFast order model | Blocked by live schema/RPC mismatch; approval actions intentionally disabled |
| Database migration validated on real restored schema | Blocked: backup/restore unavailable; only isolated fixtures tested |
| PR, build and latest CI evidence current | PR #358 open/unmerged; latest HEAD workflows pending |
| Production deployment and smoke test | Not performed; live payments and messaging remain disabled |

## Next execution target

1. Finish and repair the latest HEAD CI/browser run, including the new finance operator build.
2. Obtain and verify the actual database backup, then restore it to isolated disposable infrastructure without blind migration replay.
3. Reconcile migration provenance, direct grants/RLS, finance/refund schema drift and reviewer-role policy against that restored schema.
4. Run PayFast sandbox checkout/ITN and entitlement tests using approved sandbox configuration; verify mock outbox retries and, after provider approval, test provider delivery/bounce paths.
5. Apply approved migrations only to the verified isolated restore, then complete change-control and release gates before any staging/production deployment.

**Phase 5 is not declared complete.** Source implementation is materially advanced, but the restore, schema reconciliation, sandbox, provider-delivery and latest CI gates remain open.
