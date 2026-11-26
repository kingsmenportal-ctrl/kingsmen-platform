# Kingsmen Candidate Application Journey — Execution Record
Date: 2026-11-26
Repository: `kingsmenportal-ctrl/kingsmen-platform`
Branch: `feat/candidate-application-journey-batch-2026-11-26`
PR: #358 — https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358
Latest verified head: `929959bfa5023130d0fb445bfa63476fc3f4c29f`

## Required reporting contract for all Kingsmen work
For every Kingsmen-related conversation and implementation batch:
1. Continue implementation rather than substituting a status report for work.
2. Distinguish frontend, backend/API, database, security, tests, deployment, and PR status.
3. Record each change with repository path, commit/PR, test evidence, and any blocker.
4. Never claim runtime persistence, security, restore, or deployment success from source-only checks.
5. Complete the end-to-end user journey and verify the deployed behavior before declaring it complete.
6. Carry this register forward in future Kingsmen work; update this file when progress changes.

## Why persistence, security and deployment were not completed earlier
The previous batch was incorrectly scoped to source-level draft validation and a release package. It did not implement the missing database persistence layer or run an authenticated end-to-end journey. This was insufficient against the stated acceptance criteria. The blocker was not that validation was impossible: staging was inspected and the required RPCs were absent. The safe next step is to produce and verify a real database backup, restore it to isolated infrastructure, reconcile the exact schema and identity model, then implement and test a compatible migration. That process has not been completed, so production deployment cannot honestly be marked complete.

## Implementation record
### Frontend
- Existing candidate workbench and application draft page exist in the branch.
- Full user-facing journey (start, edit, save, reload/resume, validate, submit, status progression) has NOT been verified end-to-end.
- Status: INCOMPLETE.

### Backend/API
- `apps/web/src/lib/candidate-application-draft-contract.ts`: bounded JSON safety, core identity-field validation, application answer limits, date/email validation, idempotency and lifecycle helpers.
- `apps/web/src/app/api/candidate/application-draft/route.ts`: calls authenticated Supabase RPCs using the caller JWT; now validates application answer data before saving.
- Status: API validation implemented; persistence runtime is NOT verified.

### Database / persistence
- Supabase staging project: `euhubhhnumtibbyufghm`, organization `iiyscijqwapbqdxshzbq`, healthy Postgres 17.11.
- Inspection returned no matching functions for `get_candidate_application_draft(uuid)`, `save_candidate_application_draft(uuid,jsonb,integer,text)`, or `kingsmen_security.current_verified_kingsmen_candidate_id()`.
- No verified PostgreSQL backup archive plus source identity, creation timestamp, SHA-256 checksum, and retention evidence has been established.
- Neon disposable project `bitter-mouse-01847035` returned zero snapshots; it is not a restored staging database.
- No migrations, DDL, grants, RLS or Auth changes were applied to staging.
- Status: BLOCKED pending real backup/isolated restore and verified canonical schema/identity mapping.

### Security
- API route requires bearer authorization, forwards caller JWT rather than a service-role key, bounds request body, avoids cache storage, and forwards expected-version/idempotency values to RPCs.
- Actual database ownership enforcement, RLS behavior, cross-candidate isolation, version-conflict behavior, and authenticated runtime behavior are NOT verified because the expected persistence RPCs are absent.
- Status: SOURCE-LEVEL BOUNDARIES PRESENT; RUNTIME SECURITY NOT PASSED.

### Tests and build evidence
GitHub Actions run 792 / run ID `45856315812` for head `929959bfa5023130d0fb445bfa63476fc3f4c29f` completed successfully:
- Focused repository tests: passed
- Project status register validation: passed
- Staging migration provenance snapshot validation: passed
- Staging security advisor snapshot validation: passed
- Branch protection policy tests: passed
- API build: passed
- Web application build: passed
These checks do not constitute a real database restore, authenticated persistence test, end-to-end browser test, or production deployment.

### Deployment
- No deployment for this candidate-journey batch was performed or verified.
- An unrelated Netlify project was returned by a broad name search; it is not evidence that the Kingsmen candidate application is deployed.
- Status: NOT VERIFIED / NOT DEPLOYED FOR THIS BATCH.

### Pull request
- PR #358 remains open and unmerged.
- Head: `929959bfa5023130d0fb445bfa63476fc3f4c29f`.
- CI run 792 passed.
- Status: OPEN.

## Acceptance gate — not yet passed
- [ ] Verified source backup, timestamp, checksum, and retention evidence
- [ ] Isolated restore rehearsal without blind migration replay
- [ ] Schema and migration provenance reconciled
- [ ] Persistence functions implemented against verified identity/application schema
- [ ] Database security/RLS and cross-candidate isolation tests pass
- [ ] Candidate journey works through save, reload/resume, validation and submission
- [ ] Browser/API end-to-end tests pass
- [ ] Correct target deployment completed and live smoke test passes
- [ ] PR review/merge/change-control decisions recorded

## Next execution order
1. Locate and verify the actual database backup artifact; do not substitute an empty project or an unrelated export.
2. Restore it to isolated infrastructure and document restore evidence.
3. Inspect canonical candidate identity/application relationships and migration provenance.
4. Implement persistence migration/RPCs and RLS tests against the verified schema.
5. Complete the UI flow and authenticated E2E tests.
6. Deploy to the correct target only after all gates pass; verify live journey.
7. Update this record with commit SHAs, test URLs/run IDs, restore evidence, deployment ID/URL and final acceptance result.

This register is an evidence record, not a declaration that the journey is complete.
