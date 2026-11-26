# Kingsmen Candidate Draft Execution Gate — 26 November 2026

## Decision

**Runtime execution remains blocked.** Do not apply application migrations or write to live staging until a verified backup has been restored into an isolated target and the runtime security gates pass.

## Fresh live observations

Queried the live Supabase project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`) read-only on 26 November 2026.

- Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.11; region `eu-west-1`.
- Migration ledger: 130 records; latest observed entry `20261029193124 / candidate_self_service_profile_bootstrap_0095`.
- Two SQL source names previously listed as unlocated do appear as ledger rows: `20261029143144 / canonical_package_benefits_universal_accommodation_20261029` and `20261029143414 / seed_canonical_public_package_cards_20261029`. Their exact applied SQL bodies remain unverified.
- Duplicate migration names `candidate_application_preparation_readiness_0078` and `seed_verified_labour_vacancy_deadlines_0093` remain content/history collisions requiring exact source-body reconciliation.
- Four candidate draft runtime objects are absent: `public.candidate_application_draft_answers`, `public.get_candidate_application_draft(uuid)`, `public.save_candidate_application_draft(uuid,jsonb,integer,text)`, and `kingsmen_security.current_verified_kingsmen_candidate_id()`.

No candidate/application/finance/storage rows were read or changed by these catalog checks.

## Isolated target check — blocked, not restored

The Supabase project `kingsmen-isolated-restore-rehearsal-2026-11-26` (`rudthmmycxnzidmrpcpm`) is healthy, but direct checks show:

- `supabase_migrations.schema_migrations` does not exist.
- The public schema contains zero tables.
- The project migration list is empty.

Therefore this is a newly created empty project, **not** a restored copy of Kingsmen staging. It is not suitable for schema comparison or candidate journey runtime testing until a real backup is restored into it.

The Neon project `kingsmen-isolated-restore-rehearsal-2026-11-26` (`bitter-mouse-01847035`) also has no snapshots available. Its default branch was initialized from its own parent data, not from the Supabase staging backup. It is not evidence of a Kingsmen restore.

## Backup, checksum, timestamp and retention

**Not obtained or verified.** The connected providers expose project/branch/snapshot metadata, but no accessible recent Supabase backup artifact or export/download operation was available in this execution. No verified archive means no truthful checksum or backup timestamp can be reported. The new Neon project has a six-hour history-retention setting, but that is not the source backup's retention policy and does not satisfy the requirement.

Do not use the Supabase project-level restore operation against staging as a substitute: it is not a targeted restore of a chosen backup into a separate disposable target. Do not replay migrations to manufacture a purported restored state.

## Runtime security and schema comparison

Not executed because the isolated target has no restored schema/data and no two provisioned non-production candidate identities/tokens. Required tests remain:
- create/save draft; exact idempotent retry and changed-payload conflict;
- reload persisted answers and resume in a fresh session;
- missing/invalid/oversized/unsupported input and stale-version handling;
- readiness rejection before valid evidence and submission;
- status transition and event-history immutability;
- anonymous and expired-session denial;
- reciprocal Candidate A/B read and write isolation, including ownership spoofing;
- verify the victim's answers/status/events remain unchanged after denied requests.

The repository runbook is [CANDIDATE_DRAFT_RESTORE_AND_RUNTIME_SECURITY_REHEARSAL.md](https://github.com/kingsmenportal-ctrl/kingsmen-platform/blob/test/candidate-draft-restore-security-gates-2026-11-26/docs/rebuild/CANDIDATE_DRAFT_RESTORE_AND_RUNTIME_SECURITY_REHEARSAL.md). It explicitly requires an isolated restored target and marks the rehearsal as not executed.

## Independent review and change control

PR [#357](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/357) is open and has no submitted reviews. The repository owner is the connected GitHub identity; I cannot represent an independent security reviewer or self-approve change control. No independent sign-off or approved change record exists in evidence. Migration replay and staging writes remain unauthorized.

## Current status

- Frontend: repository-level/mock contract only; live persisted journey not proven.
- Backend: draft persistence contract missing from live staging.
- Backup acquisition and checksum: blocked.
- Isolated restore: not performed; both available candidate targets are empty/unrelated.
- Schema compatibility comparison: blocked until restore.
- Runtime security suite: not executed.
- Independent review/change-control: pending.
- Live staging writes, schema changes, Auth/RLS/grant changes, migration replay, deployment: none in this execution.
- `restoreRehearsalPassed=false`
- `runtimeSecurityPassed=false`
- `candidateDraftRuntimeReady=false`
- `migrationReplayAuthorized=false`


## CI failure triage — 26 November 2026, 15:34 UTC

The latest observed PR #357 CI run (`Kingsmen CI`, run 783, merge commit `9ae434c0d9f1a98936361e9627e27347f062a0a7`) failed during focused repository tests before later build/validation steps could run. The failure is a JavaScript parse error in `scripts/staging/test-kingsmen-restored-schema-inventory.mjs`: escaped backticks before the assertion message produced invalid source syntax.

Corrected that test in commit `25f52ebc7da070b0c09fcf03c081f366339c9050` by restoring valid template literals and block structure. A subsequent CI run (785) passed on commit `7ac1a34645ebde4ec783e962423d7f1e287feedd`. That run did not test later documentation or review-fix commits. The current branch head must be checked separately before marking its CI status green.

This correction fixes a repository test syntax defect only. It does not change staging, restore a backup, validate the live candidate journey, or authorize migration replay.

## Execution ledger refresh

- Repository test fix: committed on PR #357; CI re-run/pass not yet observed.
- Independent reviewer: `ndabenhlemvelo-arch` is listed as the requested reviewer; review submission remains pending.
- Backup/restore, schema reconciliation, and runtime candidate tests: still not executed.
- Frontend: contract tests only; no verified live end-to-end candidate journey.
- Backend: four draft persistence objects still absent from the live staging catalog; no DDL or data writes performed.

## Execution ledger refresh — CI and backup artifact search

Observed GitHub Actions run `45850284839` for PR commit `7ac1a34645ebde4ec783e962423d7f1e287feedd` (not the current branch head):

- `Kingsmen CI` run 785 completed successfully. Its `test-and-build` job passed focused repository tests, status-register validation, migration-provenance snapshot validation, security-advisor snapshot validation, branch-protection checks, API build, and web application build.
- The corresponding staging RLS/API-boundary, candidate-draft contract, and Jarvis Live Runtime workflows also completed successfully.
- This is repository/workflow validation only. It does not establish that a real backup exists, that restore ran, or that the candidate draft runtime is available in staging.
- The workflow produced no artifacts for run 785.

Backup artifact search:
- Searched the connected Gmail mailbox for backup/archive attachment names and Kingsmen staging database backup references. No PostgreSQL dump, SQL export, or backup manifest was found in those results.
- One unrelated Manus account-export attachment exists; it is not a Kingsmen PostgreSQL backup and is not used as restore input.
- No backup archive was opened, altered, or represented as database evidence.

Current decision remains unchanged: `restoreRehearsalPassed=false`, `runtimeSecurityPassed=false`, `candidateDraftRuntimeReady=false`, `migrationReplayAuthorized=false`. The remaining prerequisite is an actual Kingsmen database archive (or authorized backup-provider access that can retrieve one), plus its verifiable source metadata and retention details. Do not substitute the Manus account export, an empty database, or migration replay.


## Independent review follow-up and schema inventory correction

On the current PR, the connected `ndabenhlemvelo-arch` account submitted a review requesting changes. It identified that a static reference to `supabase_migrations.schema_migrations` can fail at parse/planning time even when guarded by `to_regclass`, and that the CI note overstated which commit had been tested.

Implemented follow-up fixes:
- Commit `76ecaa71c4c230654f5c0385576927b1a2446ec4`: query the optional migration ledger through fixed, read-only `query_to_xml` plus `XMLTABLE`, avoiding a statically bound reference when the ledger relation is absent.
- Commit `d9a021ec3867b5dd8825c77f6f796dac299211fd`: extend the inventory contract test to assert the dynamic ledger path and missing-relation guard.
- The CI evidence above remains scoped to `7ac1a34645ebde4ec783e962423d7f1e287feedd`. No passing CI result has yet been observed for these follow-up commits.

Approval remains withheld pending CI validation and the actual backup/restore/runtime evidence. A repository review is not a database change-control approval.
