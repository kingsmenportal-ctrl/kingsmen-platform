# Kingsmen Candidate Application Journey — Execution Record
Date: 2026-11-26
Repository: `kingsmenportal-ctrl/kingsmen-platform`
Branch: `feat/candidate-application-journey-batch-2026-11-26`
PR: #358 — https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358
Latest implementation commit: `654ecd20f03a44058e26ddfd8c353a17f5e8cfe3`
Latest verified CI head: `f8c921fd1f9e88348607c7c3b90032c7c5918634`.

## Required operating contract for Kingsmen work
- Continue implementation rather than substituting a report for work.
- Report frontend, backend/API, database, security, tests, deployment and PR separately.
- Record repository paths, commits and test evidence; never infer runtime success from source checks.
- Finish and verify the end-to-end journey before declaring it complete.
- Carry this record forward in subsequent Kingsmen work.

## Why the previous batch was incomplete
The earlier batch stopped at API/source-level validation and documentation while the persistence RPCs were missing. That did not meet the requested acceptance criteria. The persistence layer is now implemented as a repository migration, but it has not been executed against a database. The verified backup/restore gate and runtime test evidence are still outstanding.

## Implementation status

### Frontend
- Existing candidate workbench and application draft page are present in the branch.
- The page supports loading, editing, saving, reloading and version-conflict messaging through the draft API.
- Full authenticated journey through start, save, reload/resume, readiness validation, submit/status progression and browser E2E has not been demonstrated.
- Status: INCOMPLETE / NOT E2E-VERIFIED.

### Backend/API
- `apps/web/src/lib/candidate-application-draft-contract.ts`: bounded JSON checks, identity-field contract, application answer validation, date/email validation, idempotency and lifecycle helpers.
- `apps/web/src/app/api/candidate/application-draft/route.ts`: authenticated API boundary, caller JWT forwarding, request-size/content validation, no-store response policy, timeout and error mapping; forwards calls to the two persistence RPCs.
- Status: source implementation present; runtime integration not yet verified.

### Database / persistence
- Live Supabase staging project inspected read-only: `euhubhhnumtibbyufghm`, organization `iiyscijqwapbqdxshzbq`, Postgres 17.11.
- The actual schema confirms `candidate_applications(candidate_id, opportunity_id, status, readiness_status, readiness_snapshot, ...)`, `candidate_opportunities`, `candidate_accounts`, and `candidate_master_profiles`.
- The authenticated identity mapping is `kingsmen_security.current_authenticated_candidate_id()`, resolving through `candidate_accounts.auth_user_id = auth.uid()`.
- New migration: `supabase/migrations/20261126190000_candidate_application_draft_persistence.sql`.
  - Creates candidate-owned answer persistence with bounded JSON, version and idempotency fields.
  - Uses a composite application/candidate ownership foreign key.
  - Enables and forces RLS, revokes direct table privileges from PUBLIC/anon/authenticated, and exposes only authenticated get/save RPCs.
  - Checks authenticated candidate identity and application ownership inside security-definer functions.
  - Implements row locking, optimistic version conflicts, idempotent retries, editable-status gating and readiness invalidation.
  - Corrected an idempotency defect on 2026-11-26: reusing a key with a different answer payload now returns `APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT`; only an identical payload may be accepted as a retry. Added the source-contract assertion. This fix is committed, but CI is still pending.
  - Saving a draft does not submit to an external provider.
- Migration NOT applied to staging. No staging DDL, grants, RLS or Auth changes were made.
- No verified PostgreSQL backup archive with source identity, creation time, SHA-256 checksum and retention evidence has been established.
- Neon disposable project `bitter-mouse-01847035` has zero snapshots and is not a restored copy of staging.
- Status: migration implemented in repository; database execution is blocked pending verified backup/isolated restore and provenance review.

### Security
- Source boundaries: caller JWT forwarded; no service-role key in web API; RPCs check auth.uid(), verified candidate identity, application ownership and editable lifecycle state; direct authenticated table access revoked.
- Runtime cross-candidate isolation, RLS behavior, idempotency, version conflicts and privilege behavior have not been tested.
- Status: source design present; runtime security NOT PASSED.

### Tests and build evidence
- Previous commit `8598036eff44d09bce5672f4297258dd2e57e2ce`: Kingsmen CI run 793, Jarvis Live Runtime run 2866, and staging RLS API-boundary run 48 completed successfully. These runs preceded the persistence migration.
- Added `scripts/staging/test-candidate-application-draft-persistence-migration.mjs`, wired into `npm test`; it checks the source-level migration security/behavior contract only.
- CI on head `f8c921fd1f9e88348607c7c3b90032c7c5918634` passed: Kingsmen CI run 799, Jarvis Live Runtime run 2872, staging RLS API boundary run 54, and application draft contract run 191. Run 191's job completed successfully, including steps applying the draft-persistence migration to a disposable PostgreSQL fixture, testing save/idempotency/consent/candidate isolation, building the Next.js app, API auth/input boundaries, and Chromium browser smoke tests for draft save/resume, profile save/reload/consent, application workbench navigation and document flows. This is repeatable CI fixture evidence, not a restore of production/staging data and not a live Supabase execution.
- PostgreSQL migration execution, draft persistence/security fixture tests and browser smoke tests are now available and passed in CI run 191. Live Supabase runtime integration and a full journey against a restored staging copy remain unverified.

### Backup and restore
- No actual source database backup archive has been verified. Gmail search for PostgreSQL dump/backup/manifest attachments returned no matching archive; the connected Neon project still reports zero snapshots.
- The user authorized an isolated disposable restore and use of connected integrations, but no concrete secure storage location or archive identifier has been supplied yet. This remains the exact input needed to retrieve the backup; credentials must not be pasted into chat.
- No isolated restore of staging has been completed.
- Empty Neon project/snapshot absence is explicitly not restore evidence.
- Status: NOT COMPLETED.

### Deployment
- No deployment of this candidate-journey batch has been performed or verified.
- The correct Kingsmen frontend deployment target has not been conclusively identified from the connected hosting results.
- Status: NOT DEPLOYED / LIVE SMOKE NOT RUN.

### Pull request
- PR #358 is open and unmerged: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/358
- Latest observed PR head: `654ecd20f03a44058e26ddfd8c353a17f5e8cfe3`.
- PR description updated to distinguish committed migration from unverified runtime acceptance.
- Status: OPEN; not approved for merge/deployment.

## Acceptance gate
- [ ] Verified source backup identity, timestamp, checksum and retention
- [ ] Isolated backup restore without blind application-migration replay
- [ ] Migration provenance reconciled against the restored schema
- [x] Persistence migration and ownership-checked RPCs committed to the repository
- [x] SQL migration executes successfully against the isolated PostgreSQL CI fixture (run 191)\n- [ ] SQL migration executes successfully on an isolated restored copy of the real staging database
- [x] CI fixture tests for draft save/idempotency/candidate isolation pass\n- [ ] Authenticated save/reload, idempotent retry and optimistic conflict tests pass against a restored staging copy
- [ ] Cross-candidate isolation and effective grants/RLS tests pass
- [x] CI browser smoke tests for draft save/resume, profile save/reload/consent, application workbench navigation and document flows pass\n- [ ] Full authenticated candidate browser journey passes E2E against integrated runtime
- [ ] Correct target deployment and live smoke test pass
- [ ] PR review, merge and change-control decisions recorded

## Next execution order
1. Locate the user-authorized secure backup location/archive; do not substitute an empty project or unrelated export.
2. Restore it to isolated infrastructure without blindly replaying unresolved application migrations.
3. Reconcile schema/migration provenance and execute the new migration on the isolated restore.
4. Run authenticated database security/persistence tests and correct failures.
5. Complete browser/API E2E for the full candidate journey.
6. Deploy only after gates pass and verify the live journey.
7. Record run IDs, restore evidence, deployment URL/ID and final acceptance outcome.

This is an evidence register. It does not declare the candidate application journey complete.
