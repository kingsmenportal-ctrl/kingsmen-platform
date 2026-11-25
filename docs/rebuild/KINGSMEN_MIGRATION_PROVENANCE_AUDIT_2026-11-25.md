# Kingsmen Staging Migration Provenance Audit

**Snapshot date:** 25 November 2026  
**Scope:** read-only comparison of the live Supabase migration ledger with the selected rebuild branch and seven relevant historical feature/release branches.  
**Result:** **RECONCILIATION REQUIRED — DO NOT REPLAY MIGRATIONS FROM THIS REPORT**

## Executive findings

| Evidence item | Count | Interpretation |
|---|---:|---|
| Applied migration ledger records in staging | 130 | Live Supabase migration ledger at snapshot time |
| SQL migration files on the selected rebuild branch | 41 | Current implementation branch only |
| Current-branch normalized exact name matches | 32 | Candidate match using the repo's numeric-prefix/suffix naming convention |
| Current-branch core-only candidates | 2 | Similar migration core name, but different sequence |
| Ledger records without a source name on the rebuild branch | 96 | Not proof that the source is deleted; historical branches may carry it |
| Source SQL files on rebuild branch without a matching ledger name | 7 | May be pending, renamed, superseded, or applied under another name |
| Historical branches scanned | 8 | Rebuild branch plus seven feature/release branches |
| Raw migration-file entries across those branches | 414 | Includes repeated versions of the same source across branches |
| Unique path + Git blob-hash entries found historically | 86 | Captures differing file bodies at the same path as distinct source evidence |
| Unique migration paths found historically | 83 | Filename/path count irrespective of branch |
| Ledger records with a historical core + sequence candidate | 40 | Candidate source name with a matching logical sequence |
| Ledger records with a historical core-only candidate | 27 | Candidate source name with missing/different sequence |
| Ledger records with no source-name candidate in the historical sweep | 63 | Requires recovery from commits/deployment evidence or direct schema provenance |
| Duplicate names in the live ledger | 2 | Two names each recorded at two versions |
| Exact deployed SQL-body-to-ledger provenance proven by this audit | 0 | Filename matching is not body/deployment proof |

**Interpretation:** the original 96-record gap was scoped to the selected rebuild branch only. The broader history sweep found source-name candidates for 67 of the 130 ledger records; it did not prove that those candidate SQL bodies are exactly the SQL that ran in staging. The remaining 63 live records have no candidate by filename/core-name among the eight branches scanned. None of these figures authorizes migration replay.

## Why simple migration matching is unsafe

Kingsmen's historical branches reuse numeric migration sequences for different SQL files/features, especially within the 0087–0096 range. For example, some branches use that range for unified master-application lifecycle changes, while other branches use it for database security, PayFast checkout and document workflows. The same sequence number is therefore not a safe migration identity.

Other name differences are consistent with renames: Git history shows `0009_n11_ai_decision_matching.sql` was renamed to `0084_n11_ai_decision_matching.sql`. Timestamp-prefixed Supabase migration filenames may also differ by several minutes from the migration ledger's recorded version. Those observations provide useful lineage candidates, not proof of exact deployment equivalence.

The snapshot therefore keeps **two distinct views**:

- **Current rebuild branch:** exact name-normalization and current file inventory.
- **Historical branch sweep:** core/sequence name candidates plus historical branch, path, blob hash and candidate branches.

Both are stored in the machine-readable snapshot. Neither view reads candidate records or modifies database state.

## Duplicate ledger names

Two migration names appear more than once in the live ledger:

- `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`.
- `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`.

These duplicates are audit findings, not on their own proof of a failed database. Inspect exact version, historical commit, source body and recorded deployment context before building a canonical lineage map.

## Current-branch source-only migrations

The following files are tracked on the selected rebuild branch but do not have a matching name in the live staging ledger:

- `db/migrations/0107_application_capacity_entitlements_20261101.sql`
- `db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql`
- `db/migrations/0109_candidate_application_draft_persistence_20261101.sql`
- `db/migrations/0110_n15_source_review_decision_atomicity.sql`
- `db/migrations/0083_retire_legacy_accommodation_checkout.sql`
- `database/migrations/000004_jarvis_postgresql_truth_vault.sql`
- `supabase/migrations/20261016151400_payfast_finance_tx.sql`

Some of these also appear in other branches. The 0107–0110 files contain review/provenance warnings, and older branches carry multiple alternate 0087–0096 chains. Do not apply or copy these files just to reduce a count gap. First determine whether each is applied under a different name, intentionally pending, obsolete, or part of a branch-specific architecture that was never adopted.

## Read-only method and limitations

The snapshot uses:

1. The staging migration-ledger records exposed by the connected Supabase project.
2. Recursive Git trees and Git blob SHA values for the SQL files in these eight branches.
3. Normalized filename-core and sequence comparison to identify candidate source names.
4. Duplicate-name and source-only inventory checks.

The tool did **not** retrieve or compare the exact SQL body stored/executed by Supabase for every ledger record. A Git blob SHA proves the identity of a tracked source file, not that this file was applied. Current schema state can help corroborate a candidate but should not substitute for deployment history.

## Safe resolution sequence

1. Preserve this ledger snapshot and the exact source-tree/blob evidence.
2. For each of the 130 entries, assemble a lineage row with ledger version/name, candidate source path, Git blob SHA, commit SHA, relevant branch, and the source of the claim that it was applied.
3. Compare current/historical candidate bodies and use deployed SQL or backups/schema evidence when Git history is insufficient.
4. Resolve duplicate ledger names by examining their exact versions and deployment contexts.
5. Classify every source-only migration as applied under an alias, pending, superseded, obsolete or unresolved.
6. Have the responsible reviewer/founder approve the lineage map and forward migration plan.
7. If a schema adjustment is eventually required, create a new forward-only migration, test it against a disposable PostgreSQL instance, and only then seek explicit approval for staging application.

## Integrity and safety

- Snapshot type: read-only. No DDL, candidate-row writes, migration application, Edge Function deployment or release-gate change occurred.
- Current source files are stored with their Git blob SHA, and the validator recomputes those hashes from the checked-out bytes.
- Historical candidates are stored with branch tree SHA, source path, source blob SHA and branches on which the source was observed.
- Name matching is a recovery aid. It does not assert exact SQL-body provenance or authorize replay.

## Files

- [Machine-readable staging/source snapshot](../../manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json)
- [Latest audit report](../../reports/rebuild/kingsmen-staging-migration-provenance-latest.json)
- [Snapshot validator](../../scripts/validators/validate-kingsmen-migration-provenance.mjs)
- [Overall Kingsmen status and timeline](./KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md)
