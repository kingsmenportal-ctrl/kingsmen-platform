# Kingsmen Candidate Draft Execution Gate — 26 November 2026

## Decision

**Runtime execution remains blocked.** Continue repository-level validation and evidence recovery; do not apply application migrations or write to live staging until the isolated restore and runtime security gates pass.

## Fresh live observations

Queried the live Supabase project `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`) using a read-only query on 26 November 2026.

- Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.11; region `eu-west-1`.
- The migration ledger returns 130 records; latest observed entry is `20261029193124 / candidate_self_service_profile_bootstrap_0095`.
- Contrary to an earlier gap-register classification, the two SQL source names previously listed as unlocated are present as ledger rows:
  - `20261029143144 / canonical_package_benefits_universal_accommodation_20261029`
  - `20261029143414 / seed_canonical_public_package_cards_20261029`
- Their presence in the ledger does **not** prove that the original SQL bodies are recovered, byte-identical to applied SQL, or safe to replay.
- Duplicate migration names `candidate_application_preparation_readiness_0078` and `seed_verified_labour_vacancy_deadlines_0093` remain content/history collisions requiring exact source-body reconciliation.

The full current ledger result is available in the live project's migration catalog; no candidate, application, finance, or storage rows were read or changed by this query.

## Existing candidate-draft blockers

The latest catalog evidence documented in [the schema compatibility diff](https://github.com/kingsmenportal-ctrl/kingsmen-platform/blob/audit/candidate-draft-live-catalog-2026-11-26/docs/rebuild/CANDIDATE_DRAFT_SCHEMA_COMPATIBILITY_DIFF_2026-11-26.md) records these blockers: draft-answer table and read/save RPCs absent; verified candidate identity helper absent; current event constraint excludes `APPLICATION_DRAFT_SAVED`; live Candidate A/B runtime isolation and anonymous HTTP denial not tested.

## Restore and cost boundary

- A Supabase development branch is **not** proof of restoring a recent backup.
- The available connected Supabase actions expose project restore and development-branch operations, but do not expose a downloadable backup artifact or a command to restore a specified backup into a named isolated target.
- Do not call the project-level restore operation on staging: it is not an isolated-target restore and risks affecting the target project.
- Do not create a paid Supabase/Neon environment until a real backup artifact and a supported restore path are available and the exact disposable cost is known.
- No backup restore, migration replay, database write, schema change, grant/RLS/Auth change, or deployment was performed in this execution.

## Required sequence

1. Recover exact original SQL bodies for all relevant ledger rows, resolving duplicate-name collisions from trusted historical source snapshots.
2. Acquire a recent encrypted backup through the provider's backup/export mechanism and record its timestamp, source project, checksum, and retention controls.
3. Restore that artifact into a separate disposable database without replaying application migrations; confirm target identity and compare the restored catalog with the recorded live schema.
4. Run the SELECT-only schema inventory and reviewed migration dry-run on that restored database.
5. Execute anonymous denial, Candidate A/B reciprocal read/write isolation, ownership spoofing, identical retry, changed-payload retry, reload/resume, invalid-input, readiness, event immutability, and no-provider-submit tests.
6. Obtain independent security review and recorded change-control approval.
7. Only then prepare and request approval for the smallest forward-only staging migration.

## Status

- Frontend candidate draft UI and mocked browser contracts: present in repository work; live persisted journey not proven.
- Backend live draft persistence contract: blocked by missing objects in the last direct catalog evidence.
- Isolated restore / runtime security tests: not executed.
- Live staging writes / migrations / deployment: none in this execution.
- Runtime readiness: `false`.
