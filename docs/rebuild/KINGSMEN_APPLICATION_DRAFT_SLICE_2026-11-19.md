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
- `.github/workflows/kingsmen-application-draft-contract.yml` — targeted validation and Next.js build workflow; no deploy step.

## Source-contract review

The 30 checks were evaluated against the committed migration, API route, UI page, tracker and workflow source on this branch. All 30 passed.

They cover the owner-bound composite key, RLS and table grants, verified Auth-link identity, parent-application ownership, active consent, bounded and allowlisted answer data, optimistic concurrency, idempotent retries, readiness invalidation, minimal audit details, CAO child-record preservation, the bearer/anon-key boundary, absence of service-role use in the web API, all six pathway labels, and the prohibition on provider submission during draft save.

**Verification boundary:** this was a source-contract inspection using the connected GitHub file contents. A GitHub Actions run result and Next.js build result have not been retrieved, so neither is marked passed. No authenticated browser E2E result exists yet.

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
4. Run the database migrations and adversarial tests against a disposable PostgreSQL 17 instance or approved isolated environment.
5. Verify the target's migration state and the exact proposed migration set.
6. Obtain the required staging change-control approval before any live schema mutation.
7. Create approved synthetic test identities and test profile → verified opportunity → parent draft → saved answers → reload → tracker event with two-candidate isolation.
8. Retrieve the actual GitHub Actions result and run an authenticated browser E2E against the intended staging build before release.

The 0109 RPCs are SECURITY DEFINER and callable by authenticated candidates by design, so tests must prove positive owner access, negative cross-candidate access, stale/missing identity rejection, consent revocation, conflicting versions, idempotency-key content reuse rejection, and immutability of provider-receipt/outcome states.

## Change record

- No SQL was executed against the live database in this implementation step.
- No live Edge Function was changed or redeployed.
- No candidate data was created or modified.
- No PR was merged into `main`.
- No staging or production deployment is claimed.
