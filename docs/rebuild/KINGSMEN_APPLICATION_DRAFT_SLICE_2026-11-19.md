# Kingsmen One — Application Draft Slice Status

**Date:** 19 November 2026  
**Branch:** `rebuild/kingsmen-one-foundation-2026-11-17`  
**Scope:** Candidate application-answer editor and persistence contract; no staging database writes.

## Implemented on the rebuild branch

This slice reuses the existing candidate parent-application model and the reviewed draft persistence source from PR #292. It does not introduce another application database or a separate backend service.

New or staged source:
- `db/migrations/0107_application_capacity_entitlements_20261101.sql` — review-only capacity/entitlement migration.
- `db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql` — review-only verified-source, eligibility and deadline gate.
- `db/migrations/0109_candidate_application_draft_persistence_20261101.sql` — review-only application-answer persistence and RPCs.
- `apps/web/src/app/api/candidate/application-draft/route.ts` — authenticated, bounded request proxy to the candidate-owned RPCs using the public anon key and caller bearer.
- `apps/web/src/app/candidate/applications/[applicationId]/page.tsx` — draft editor with load, resume, save, optimistic version and retry/idempotency behaviour.
- `apps/web/src/lib/candidate-session.ts` and `apps/web/src/lib/read-limited-json.ts` — shared session-token accessor and bounded JSON-body reader for this slice.
- `apps/web/src/components/candidate/CandidateApplicationTracker.tsx` — editable parent applications now link to the draft editor.
- `scripts/validators/validate-candidate-application-draft-persistence.mjs` — source-contract validator.
- `scripts/staging/fixtures/application-draft-postgres-bootstrap.sql` and `scripts/staging/test-application-draft-postgres.sql` — disposable PostgreSQL 17 fixture and security/ownership integration checks for migration 0109.
- `scripts/staging/test-candidate-application-draft-ui.mjs` — mocked Playwright save/reload/read-only browser smoke test.
- `.github/workflows/kingsmen-application-draft-contract.yml` — targeted source validation, PostgreSQL fixture, Next.js build and browser smoke workflow; no deploy step.

## Source-contract review

The 30 checks were evaluated against the committed migration, API route, UI page, tracker and workflow source on this branch. All 30 passed.

They cover the owner-bound composite key, RLS and table grants, verified Auth-link identity, parent-application ownership, active consent, bounded and allowlisted answer data, optimistic concurrency, idempotent retries, readiness invalidation, minimal audit details, CAO child-record preservation, the bearer/anon-key boundary, absence of service-role use in the web API, all six pathway labels, and the prohibition on provider submission during draft save.

**Automated verification recorded:**
- At commit `2422d5559328dee2244415e9ca5d8667899a1ab1`, the focused GitHub Actions run passed: strict web dependency install, 30 source-contract checks, fixture bootstrap, migration 0109 application to disposable PostgreSQL 17, all SQL integration assertions, and the Next.js production build. Run: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/44546554282
- The SQL contract test covers first save, idempotent retry, idempotency-key content conflict, stale-version conflict, version increment, readiness invalidation, minimized audit details, reload, own-record access, cross-candidate read/write rejection, missing verified identity/profile rejection, locked submitted state, revoked consent rejection, and table/function grants.
- The browser smoke test passed at commit `b6e1b65ce01499ac06ff3217126bc1a52a86d5fd`: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/44548477624
- Playwright verified the candidate can load an existing draft, save application-specific answers with an expected version and idempotency key, reload the saved answer from the mocked API, and view a submitted-state application as read-only.
- The browser log explicitly confirmed that no provider-submission endpoint was called. The API responses and Supabase configuration were test-only mocks; this is browser UI proof, not live-staging candidate E2E.
- The focused workflow now uses its disposable PostgreSQL 17 service container's own `psql` client and pins the browser job to Ubuntu 24.04.

**Verification boundary:** the SQL test applies migration 0109 against a minimal disposable schema contract; it does not establish that migrations 0107–0109 can safely be applied together to the live schema. There is still no authenticated live-staging browser E2E result.

## Live Supabase checks relevant to this slice

On 19 November 2026:
- `candidate_applications` has the unique key `(id, candidate_id)` required by the draft row's ownership-bound foreign key.
- The live application status constraint includes the draft/readiness statuses used by the UI and migration.
- `public.candidate_application_draft_answers`, `public.get_candidate_application_draft(uuid)`, `public.save_candidate_application_draft(uuid,jsonb,integer,text)` and `kingsmen_security.current_verified_application_candidate_id()` do **not** yet exist in the live project.
- `candidate_auth_identity_links` has zero rows, and `candidate_master_profiles` has zero rows. There is therefore no basis for claiming candidate draft E2E has been proven.

## Release gate

**This feature slice is staged for review, not enabled on staging.**

Do not apply migrations 0107–0109 yet. The migration source is explicitly review-only. Before any application:
1. Reconcile and approve migration provenance for the earlier 0096–0098 and source-history gaps.
2. Review 0107–0109 together for dependencies, grants, constraints and security-definer ownership.
3. Capture an approved backup and verify an isolated restore.
4. Migration 0109 has passed a standalone disposable PostgreSQL 17 contract test. Before live application, test the full 0107–0109 dependency chain and its compatibility with the reconciled live schema in a disposable PostgreSQL 17 environment.
5. Verify the target's migration state and the exact proposed migration set.
6. Obtain the required staging change-control approval before any live schema mutation.
7. Create approved synthetic test identities and test profile → verified opportunity → parent draft → saved answers → reload → tracker event with two-candidate isolation.
8. Confirm the current Playwright workflow result, then run an authenticated browser E2E against the intended staging build after an approved synthetic Auth-to-candidate identity is available.

The 0109 RPCs are SECURITY DEFINER and callable by authenticated candidates by design, so tests must prove positive owner access, negative cross-candidate access, stale/missing identity rejection, consent revocation, conflicting versions, idempotency-key content reuse rejection, and immutability of provider-receipt/outcome states.

## Change record

- No SQL was executed against the live database in this implementation step.
- No live Edge Function was changed or redeployed.
- No candidate data was created or modified.
- No PR was merged into `main`.
- No staging or production deployment is claimed.
