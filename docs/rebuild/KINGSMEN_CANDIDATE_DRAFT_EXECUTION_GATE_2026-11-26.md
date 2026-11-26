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
