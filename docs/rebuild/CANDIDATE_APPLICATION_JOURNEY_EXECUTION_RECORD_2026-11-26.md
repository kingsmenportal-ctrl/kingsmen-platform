# Kingsmen Candidate Application Journey — Execution Record
Last updated: 2026-11-27
Repository: `kingsmenportal-ctrl/kingsmen-platform`
Branch: `feat/candidate-application-journey-batch-2026-11-26`
PR: #358 — https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358
Latest implementation commit at record time: `e42193466d9c986b4249c6d8c29ae71df450d740`

## Operating contract
- Keep implementing; a report is not a substitute for code, tests, fixes and deployment.
- Report frontend, backend/API, database, security, tests, deployment and PR separately.
- Record exact commits and test evidence; never infer runtime success from source checks or CI fixture tests.
- Keep production unchanged until backup, restore, schema provenance, security and change-control gates pass.
- Continue independent implementation while the Oracle execution credentials/runner are deferred.

## Current implementation

### Frontend
- Candidate workbench and application tracker are present. The application draft page supports load, edit, save, reload/resume, version checks, and leave-page unsaved-change warnings.
- On 2026-11-27, `apps/web/src/app/candidate/applications/[applicationId]/page.tsx` was improved to give a clear recovery instruction for `APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT`. It explains that the conflicting edit was not saved, directs the candidate to reload/reconcile and reapply changes, and explicitly states that no provider submission occurred.
- A regression assertion was added in `scripts/staging/test-candidate-application-draft-contract.mjs`.
- Status: implementation present; the newly added conflict-recovery regression is awaiting CI confirmation. Full authenticated candidate journey remains incomplete.

### Backend/API
- `apps/web/src/app/api/candidate/application-draft/route.ts` authenticates via caller bearer token, forwards the candidate JWT with the Supabase anon/publishable key, validates bounded input, disables caching, times out upstream requests and maps version/idempotency conflicts to HTTP 409.
- `apps/web/src/lib/candidate-application-draft-contract.ts` implements bounded JSON, field/date/email checks, answer limits, idempotency-key validation and lifecycle helpers.
- Status: source implementation present; runtime integration against a real restored database is not verified.

### Database and persistence
- Source staging project: Supabase project ref `euhubhhnumtibbyufghm`, organisation `iiyscijqwapbqdxshzbq`. Previous inspection was read-only.
- Candidate identity resolution uses `kingsmen_security.current_authenticated_candidate_id()`, mapping authenticated users through candidate accounts.
- Migration: `supabase/migrations/20261126190000_candidate_application_draft_persistence.sql`.
- The migration defines candidate-owned draft persistence, a composite application/candidate ownership constraint, bounded JSON, forced RLS, no direct table privileges for public/anon/authenticated, authenticated ownership-checking get/save RPCs, optimistic version conflicts, idempotency handling, editable-state gating and readiness invalidation.
- Migration has NOT been applied to staging or production. No staging DDL, grants, RLS or Auth changes were made.
- Verified source backup, timestamp, checksum and retention evidence are still unavailable. The Neon rehearsal project `bitter-mouse-01847035` has zero snapshots and is not a restored copy.
- Status: committed to code; real-database execution remains gated on verified isolated restore and provenance review.

### Security
- Source design checks authenticated identity and candidate/application ownership, forwards the caller JWT, avoids a service-role key in the web API, and revokes direct access to the draft table.
- The prior disposable PostgreSQL CI fixture tested draft save, idempotency, consent and cross-candidate isolation.
- Effective grants/RLS and authenticated candidate isolation have NOT been verified against a restored copy of the real database.
- Status: CI-fixture evidence available; live restored-database security acceptance pending.

### Tests and build evidence
- Commit `09c15b7f29754afc954839133a03353372eb4353` had the following successful workflows:
  - Jarvis Live Runtime: run 2878.
  - Kingsmen CI: run 805.
  - Kingsmen staging RLS API boundary: run 60.
  - Kingsmen application draft contract: run 197.
- Application draft contract run 197 completed the disposable PostgreSQL bootstrap and migration, draft save/idempotency/consent/candidate isolation tests, Next.js build, API auth/input boundary tests, and Chromium browser smoke tests for tracker/draft resume, document flows, candidate draft save/resume, profile save/reload/consent, workbench navigation and source-review flows.
- These checks passed on commit `09c15b7...`; they do not prove restore from the real source database, live Supabase runtime, or deployed production acceptance.
- The subsequent frontend regression fix and assertion are committed through `e42193466d9c986b4249c6d8c29ae71df450d740`. No workflow run for that latest head had been returned at the time of this record update, so its new assertion is not yet marked passed.
- Status: previous head CI green; latest change awaits CI evidence.

### Backup and isolated restore
- The user selected Option E: attempt all available routes in order while continuing implementation in parallel; only isolated disposable restore is authorised, with no production modification and no secrets in chat.
- Gmail/storage searches found no usable PostgreSQL backup archive. The unrelated Manus account export is not a database backup.
- The Neon rehearsal project has no snapshots. The Supabase disposable target is empty and is not a restore.
- Repository backup scripts exist: `scripts/backup/New-KingsmenTruthVaultBackup.ps1` and `scripts/backup/Test-KingsmenTruthVaultRestore.ps1`.
- Connected tools do not currently expose an Oracle/server shell or a GitHub Actions workflow-dispatch/secrets-configuration route. Oracle Cloud Free Tier can serve as the runner once instance access is set up; credentials and server access are deferred by the user for later.
- Required protected environment: `KINGSMEN_DATABASE_URL`, `KINGSMEN_RESTORE_DRILL_DATABASE_URL`, and installed `pg_dump`, `pg_restore`, `psql`. Do not place secret values in chat, source control, or build logs.
- Status: NOT COMPLETED; no source backup has been restored.

### Deployment and pull request
- No deployment of this candidate journey batch has been performed or verified. The correct live frontend target and deployed commit are not yet established.
- PR #358 is open and unmerged: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358
- Latest observed PR head: `e42193466d9c986b4249c6d8c29ae71df450d740`.
- Status: not approved for merge/deployment; runtime acceptance gates remain open.

## Acceptance gates
- [ ] Obtain and verify real source backup identity, timestamp, SHA-256 checksum and retention evidence.
- [ ] Restore backup to isolated disposable infrastructure without blind replay of unresolved application migrations.
- [ ] Reconcile migration provenance and schema on the restored copy.
- [x] Candidate draft persistence/RPC migration committed to repository.
- [x] Previous-head CI PostgreSQL fixture tests and browser smoke tests passed (run 197).
- [ ] Latest UI conflict-recovery regression and assertion pass CI.
- [ ] Apply migration only to the verified isolated restored copy and run authenticated persistence/RLS/ownership tests.
- [ ] Complete full authenticated browser/API journey against the integrated restored runtime.
- [ ] Verify correct deployment target, deploy after gates pass, and run live smoke tests.
- [ ] Record review/change-control and final acceptance results.

## Next execution order
1. Continue candidate journey improvements and checks independently of Oracle access.
2. When Oracle VM/runner access is supplied, create the real protected backup, verify its manifest and restore to isolated infrastructure.
3. Reconcile migration history/schema before executing the new migration on that restored copy.
4. Run authenticated draft persistence, idempotency, optimistic conflict, cross-candidate and effective-privilege tests; fix any failures.
5. Complete the full candidate browser/API journey, then deploy only after approval gates pass.
6. Record the exact workflow IDs, restore evidence, deployed commit and live smoke result.

This is the active evidence register. It does not declare the candidate journey complete.
