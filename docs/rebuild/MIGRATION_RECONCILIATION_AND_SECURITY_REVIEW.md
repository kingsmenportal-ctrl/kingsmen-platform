# Migration Reconciliation and Scoped Security Review

**Observed:** 2026-11-19  
**Environment:** Supabase staging, project `euhubhhnumtibbyufghm`  
**Source branch:** `rebuild/kingsmen-one-phase0-2026-11-19`  
**Change posture:** read-only database review plus source-only changes on the rebuild branch. No database DDL, migration application, data writes, or live Edge Function deployment was performed by this review.

## 1. Migration history: do not replay

Live `supabase_migrations.schema_migrations` currently reports:

- **130** ledger entries, covering versions `20261012155326` through `20261029193124`.
- **128** distinct migration names.
- Duplicate name `candidate_application_preparation_readiness_0078` at versions `20261019112452` and `20261019112511`.
- Duplicate name `seed_verified_labour_vacancy_deadlines_0093` at versions `20261029180632` and `20261029180642`.
- The ledger's timestamp ordering places the entry labelled `atomic_payfast_checkout_bundle_0092` (`20261029180233`) before `remove_duplicate_identity_review_open_request_index_0091` (`20261029180243`).

The current repository tree contains **37 SQL files** across `db/migrations/`, `database/migrations/`, and `supabase/migrations/`. The `db/migrations/` directory has a tracked source file through the `0086` sequence, while the live ledger continues through `0095`; several later live migration names do not have matching source files in the tracked migration directories. The directory structure and naming conventions also differ, so a simple filename-to-version comparison cannot safely reconstruct which SQL was applied.

**Conclusion:** the live schema is not reproducible from the currently tracked migration directories alone. Do not reset, rebase, replay or renumber staging migrations. Do not treat the migration ledger as a substitute for the original SQL.

### Required recovery before schema changes

1. Capture a reviewed, restorable schema/data backup using the supported Supabase export path; record timestamp, project ref, and checksum in access-controlled evidence.
2. Retrieve missing migration SQL from Git history, CI artefacts or trusted backups; label recovered files with provenance rather than fabricating replacement SQL.
3. Produce a version-by-version mapping of ledger row, original SQL path and checksum. Mark unrecovered rows explicitly.
4. Compare a schema-only dump of live staging against a fresh disposable database restored from the recovered sources. Do not use reset/rebase against staging as a test.
5. Only after reconciliation, prepare a reviewed forward-only migration for any required change and verify it on a disposable/staging clone before applying.

No backup or restore drill was performed as part of this read-only review.

## 2. RLS and exposed database privileges

Supabase's security advisor reports **17 RLS-enabled public tables without policies**. A direct privilege check found that `anon` and `authenticated` have no SELECT, INSERT, UPDATE or DELETE privileges on those 17 tables. This is consistent with backend-only tables and is not evidence of a direct table-read exposure. Preserve this least-privilege posture; do not add broad policies merely to silence the advisor.

The Auth leaked-password protection advisor is also active. Enable compromised-password protection through the Auth configuration after the settings change is reviewed and verified.

## 3. Six authenticated SECURITY DEFINER RPCs

The six public functions flagged by the live advisor are:

- `get_candidate_cao_choices(uuid)`
- `list_candidate_cao_parents()`
- `prepare_candidate_application_from_master_target(text)`
- `prepare_candidate_manual_portal_submission(uuid)`
- `record_candidate_application_outcome(uuid,text,text,text,text,text)`
- `save_candidate_cao_choices(uuid,jsonb)`

Inspection found explicit verified-link and candidate-ownership checks in the CAO read/write functions. The outcome function checks for an active application reviewer/admin role and reviewer-verified evidence. These functions should remain callable only through the intended role/identity model; the advisor warning alone is not a reason to revoke all six.

**Release-blocking review item:** the two application-preparation RPCs call `kingsmen_security.current_authenticated_candidate_id()`, whose current implementation looks up `candidate_accounts.auth_user_id = auth.uid()` but does not itself require a matching `candidate_auth_identity_links` row with `link_status = 'VERIFIED'`. The preparation RPCs therefore rely on the integrity of the account mapping rather than repeating the verified-link predicate. Before candidate exposure, harden or wrap these RPCs so a missing, pending, or revoked identity link fails closed, and run negative tests for Candidate A attempting Candidate B's target/application. Confirm consent is enforced at each candidate action that processes profile data.

Do not apply this fix directly to the live database yet: the source migration history is incomplete. Recover and checksum the current function definitions, add a forward-only migration and regression cases, then test them on a disposable database before staging application.

## 4. Candidate profile stream: source correction

The rebuild branch introduced the candidate profile page and uses the existing authenticated `candidate-master-profile` Edge Function. Review found that the tracked Edge Function source declared `latestConsent` twice in the request-handler scope. The duplicate declaration has been removed in source commit `1ee4ab97e210096cc428a1872d178726b3a7d7ae`.

The source contract validator has been extended to assert a single declaration, bearer-token validation through Supabase Auth, identity-link lookup, server-side bootstrap, consent withdrawal and non-wildcard CORS. The root migration integrity validator now also scans `database/migrations/`, and the migration integrity check is wired into `npm test`.

These are **source changes only**. The new contract test has not yet been observed passing in CI at the time this report was authored. The corrected profile function has not been deployed to Supabase by this change, and no authenticated browser journey has been recorded. Do not expose the profile slice until CI is green and the staging runtime tests pass.

## 5. Verification checklist for the next gate

- [ ] CI runs the complete root test command and production web/API builds at the latest PR head.
- [ ] Source migration coverage is reconciled to all 130 live ledger rows, with checksums and recovery provenance.
- [ ] Scoped forward-only fix enforces verified identity on both application-preparation RPCs.
- [ ] Candidate A/B isolation tests cover profile, application targets, CAO choices, and private documents.
- [ ] First-time profile bootstrap, save, reload, sign-out and re-login succeed using two independent test accounts.
- [ ] CORS allows only confirmed staging origins; no wildcard origin is used.
- [ ] Leaked-password protection is enabled and verified.
- [ ] Deployment SHA and runtime evidence are captured only after a real deployment and browser run.

## 6. Evidence boundary

Observed facts in this document came from read-only Supabase migration/privilege/function queries and the source tree at the named rebuild branch. This document is not a backup, restore test, approval, deployment record, or claim that the candidate portal is production-ready.
