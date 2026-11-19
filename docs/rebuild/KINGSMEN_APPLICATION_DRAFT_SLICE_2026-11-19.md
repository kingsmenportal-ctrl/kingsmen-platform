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
- `apps/web/src/components/candidate/CandidateApplicationWorkbench.tsx` — an editable parent application now exposes **Open / resume application draft**.
- `scripts/staging/test-candidate-profile-ui.mjs` — mocked browser test for reusable profile fields, all six pathway preferences, reload, explicit consent and consent withdrawal.
- `scripts/staging/test-candidate-workbench-ui.mjs` — mocked browser test for saved target → one Kingsmen parent draft → resume link, with provider submission prohibited.
- `scripts/validators/validate-candidate-application-draft-persistence.mjs` — source-contract validator.
- `scripts/staging/fixtures/application-draft-postgres-bootstrap.sql` and `scripts/staging/test-application-draft-postgres.sql` — isolated PostgreSQL 17 fixture and security/ownership assertions for migration 0109.
- `scripts/staging/fixtures/application-lifecycle-postgres-bootstrap.sql` and `scripts/staging/test-application-lifecycle-postgres.sql` — expanded disposable schema and full `0107 → 0108 → 0109` candidate lifecycle integration test.
- `scripts/staging/test-candidate-application-draft-ui.mjs` — mocked Playwright save/reload/read-only browser smoke test.
- `.github/workflows/kingsmen-application-draft-contract.yml` — source validation, both PostgreSQL test paths, Next.js production build, and three browser smoke tests; no deploy step.
- The new migrations now share `kingsmen_security.current_verified_kingsmen_candidate_id()`: 0107 defines the fail-closed identity helper; 0108 uses and locks the verified link while preparing the parent application; 0109 uses the same helper for draft read/write.
- Migration 0109 also extends the existing application-event allowlist to permit `APPLICATION_DRAFT_SAVED`, and fails closed if the live constraint is absent or has an unexpected shape.

## Source-contract review

At commit `2805dd585eaa109be53fb339e328683c37ecd04d`, all **34 source-contract assertions passed** against the committed migrations, authenticated API route, draft editor, tracker, workbench links, browser tests and workflow.

The contract covers owner-bound parent/draft linkage, RLS and table grants, the shared verified Auth-link identity helper, parent application ownership, active consent, bounded and allowlisted answer data, optimistic concurrency, idempotent retries, readiness invalidation, minimal audit details, event-constraint extension, verified-link locking, CAO child-record preservation, the bearer/anon-key boundary, all six pathways, absence of service-role use in candidate web APIs, prohibition on provider submission during draft save, and the workbench resume link.

## Automated verification — latest complete run

**Passed:** [GitHub Actions run 44563246698](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/44563246698), commit `2805dd585eaa109be53fb339e328683c37ecd04d`.

- Strict `npm ci` install from the committed web lockfile: passed.
- Source-contract assertions: **34/34 passed**.
- Standalone draft persistence PostgreSQL 17 test: passed, covering first save, idempotent retry, content conflict for re-used idempotency key, stale-version conflict, version increment, readiness invalidation, minimal audit details, reload, owner access, cross-candidate read/write rejection, missing identity/profile rejection, locked submission state, revoked-consent rejection and grants.
- Full `0107 → 0108 → 0109` lifecycle chain on a fresh disposable PostgreSQL 17 schema: passed. A synthetic verified opportunity match prepares one Kingsmen parent DRAFT, saves application-specific answers and reloads them; target linkage, expected events and absence of a provider-submission side effect are asserted.
- Next.js production build: passed.
- Mocked Playwright candidate draft browser test: passed for load, edit, save, reload, submitted-state read-only behavior and no provider-submission request.
- Mocked Playwright candidate profile browser test: passed for profile save/reload, all six pathway preferences, consent-required save, and consent withdrawal without deleting the profile.
- Mocked Playwright workbench browser test: passed for preparing one parent application from a saved target, returning and displaying the DRAFT, opening the resume link and making no provider-submission call.

**Verification limit:** database integration uses a deliberately constructed disposable schema fixture with representative constraints and dependencies; it is not a restored clone of the live staging schema. Browser API responses and Supabase configuration are mocked. This proves a green source/contract/full-chain test path, **not live authenticated candidate E2E or final migration safety against the exact staging schema**.

## Live Supabase checks relevant to this slice

On 19 November 2026:
- `candidate_applications` has the unique key `(id, candidate_id)` required by the draft row's ownership-bound foreign key.
- The live application status constraint includes the draft/readiness statuses used by the UI and migration.
- `public.candidate_application_draft_answers`, `public.get_candidate_application_draft(uuid)`, `public.save_candidate_application_draft(uuid,jsonb,integer,text)` and the shared helper `kingsmen_security.current_verified_kingsmen_candidate_id()` do **not** yet exist in the live project.
- `candidate_auth_identity_links` has zero rows, and `candidate_master_profiles` has zero rows. There is therefore no basis for claiming candidate draft E2E has been proven.

## Release gate

**This feature slice is staged for review, not enabled on staging.**

Do not apply migrations 0107–0109 yet. The migration source is explicitly review-only. Before any application:
1. Reconcile and approve migration provenance for the earlier 0096–0098 and source-history gaps.
2. Review 0107–0109 together for dependencies, grants, constraints and security-definer ownership.
3. Capture an approved backup and verify an isolated restore.
4. The full 0107–0109 dependency chain has passed on a purpose-built disposable PostgreSQL 17 schema. Before live application, test against a disposable restore/clone of the reconciled live schema to cover live-specific constraints, triggers, grants and extensions.
5. Verify the target's migration state and the exact proposed migration set.
6. Obtain the required staging change-control approval before any live schema mutation.
7. Create approved synthetic test identities and test profile → verified opportunity → parent draft → saved answers → reload → tracker event with two-candidate isolation.
8. The mocked Playwright draft, profile and workbench tests have passed. Next, run an authenticated browser E2E against an approved staging build after synthetic Auth-to-candidate identity links and reusable profiles are created through the authorised identity process.

The 0109 RPCs are SECURITY DEFINER and callable by authenticated candidates by design, so tests must prove positive owner access, negative cross-candidate access, stale/missing identity rejection, consent revocation, conflicting versions, idempotency-key content reuse rejection, and immutability of provider-receipt/outcome states.

## Change record

- No SQL was executed against the live database in this implementation step.
- No live Edge Function was changed or redeployed.
- No candidate data was created or modified.
- No PR was merged into `main`.
- No staging or production deployment is claimed.
