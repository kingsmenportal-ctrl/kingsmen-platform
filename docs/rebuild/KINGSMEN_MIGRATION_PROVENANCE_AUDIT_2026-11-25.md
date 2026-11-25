# Kingsmen Staging Migration Provenance Audit

**Snapshot date:** 25 November 2026  
**Scope:** read-only comparison of the staging migration ledger and the SQL migration files tracked on the selected rebuild branch.  
**Result:** **RECONCILIATION REQUIRED — DO NOT REPLAY MIGRATIONS FROM THIS REPORT**

## Executive findings

| Evidence item | Count | Interpretation |
|---|---:|---|
| Applied records in live Supabase migration ledger | 130 | Live staging ledger returned by Supabase on the snapshot date |
| Tracked SQL migration files in the three scanned source directories | 41 | Source inventory from the rebuild branch tree |
| Normalized exact name matches | 32 | Naming matches after moving a leading numeric source prefix to the same suffix convention used by many ledger names |
| Core-only candidate matches | 2 | Similar name after ignoring a numeric sequence; requires human review |
| Applied ledger records without a source-name match | 96 | Unmapped, not automatically proven missing or deleted |
| Source files without a ledger-name match | 7 | May be pending, renamed or not applied; requires explicit reconciliation |
| Duplicate migration names in the live ledger | 2 | Two different names each appear at two versions |

The machine-readable snapshot records all 130 ledger entries, all 41 source-file paths and Git blob hashes, per-record match classifications, and the duplicate-name details. It contains migration metadata only; this audit did not read candidate data rows.

## Exact issues to resolve

### 1. Applied ledger records without a matched tracked source name

96 records have no normalized name match in the tracked SQL files from `db/migrations/`, `database/migrations/` and `supabase/migrations/`. Representative examples include:

- `20261012155914` — `rls_helper_search_path_hardening_0020`
- `20261012160432` — `foreign_key_index_hardening_0021`
- `20261012173518` — `n10_commercial_schedule_v1_0022`
- `20261015151555` — `candidate_auth_private_storage_0023`
- `20261015151630` — `candidate_owned_application_document_reads_0024`
- `20261015152102` — `explicit_candidate_identity_binding`
- `20261015152345` — `require_verified_candidate_identity`
- `20261015152529` — `candidate_portal_durable_state`
- `20261015152933` — `harden_candidate_document_storage`
- `20261015153626` — `revoke_anon_candidate_data_access_0029`
- `20261015153651` — `revoke_unneeded_candidate_mutations_0030`
- `20261017062557` — `n11_payfast_provider_idempotency_0036`

The complete list is in [the JSON snapshot](../../manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json). Do not infer that all are deleted SQL files. They may have come from older commits, legacy migration naming, generated/deployed-only changes, or source directories no longer present. The next step is to inspect Git history and deployment evidence and create an explicit, reviewed alias map.

### 2. Duplicate live migration names

- `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`
- `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`

A duplicated migration name is not by itself proof of a failed database; it is an audit flag. Determine why each name was recorded twice and whether the SQL/actions differed before rebuilding a canonical migration history.

### 3. Source files without a matched ledger entry

- `database/migrations/000004_jarvis_postgresql_truth_vault.sql`
- `db/migrations/0083_retire_legacy_accommodation_checkout.sql`
- `db/migrations/0107_application_capacity_entitlements_20261101.sql`
- `db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql`
- `db/migrations/0109_candidate_application_draft_persistence_20261101.sql`
- `db/migrations/0110_n15_source_review_decision_atomicity.sql`
- `supabase/migrations/20261016151400_payfast_finance_tx.sql`

Four files numbered 0107–0110 are source candidates for application-capacity/readiness/draft-persistence and N15 source-review work. Their absence from the name-matched live ledger is consistent with un-applied candidate migrations, but that is **not yet verified**. The other source-only files also require source/deployment history review. Do not apply them to staging just to make counts line up.

### 4. Core-only candidates

- `n11_ai_decision_matching_0009` may correspond to `db/migrations/0084_n11_ai_decision_matching.sql`, but the numeric sequence differs.
- `rls_security_boundary_0019` may correspond to `db/migrations/0009_rls_security_boundary.sql`, but the numeric sequence differs.

These are review candidates, not confirmed mappings.

## Safe resolution sequence

1. Export and preserve the full live migration ledger (already snapshotted in the linked manifest).
2. Use Git history to locate SQL source for each unmatched ledger record; record original path, commit SHA, file blob SHA and ledger version/name.
3. Compare ambiguous migration bodies against available deployment artifacts or backups, where those are available. Do not reconstruct SQL from a guessed filename.
4. Review the duplicate ledger entries by exact version and original deployment context.
5. Classify every source-only migration as pending, superseded, applied under an alias, or obsolete, with evidence.
6. Have the founder/reviewer approve the alias map and release strategy before any production/staging schema change.
7. Only then create a fresh canonical migration and verify it in a disposable PostgreSQL instance before any authorized staging application.

## Integrity and safety

- This snapshot was read-only: no SQL schema changes, data writes, migration application or Edge Function deployment were performed.
- The report distinguishes normalized name matches from ambiguous core-only matches.
- The validator recomputes each tracked migration file's Git blob SHA; if source files change, recapture and review this snapshot rather than silently treating it as current.
- Passing this source inventory validator confirms only snapshot consistency, **not database safety or authorization to replay migrations**.

## Files

- [Machine-readable staging/source snapshot](../../manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json)
- [Latest audit summary](../../reports/rebuild/kingsmen-staging-migration-provenance-latest.json)
- [Validator](../../scripts/validators/validate-kingsmen-migration-provenance.mjs)
- [Overall Kingsmen status and timeline](./KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md)
