# Kingsmen Migration Provenance Gap Register

**Audit date:** 19 November 2026  
**Repository:** `kingsmenportal-ctrl/kingsmen-platform`  
**Current rebuild branch:** `rebuild/kingsmen-one-foundation-2026-11-17`  
**Live project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Scope:** Read-only reconciliation of the live migration ledger against tracked SQL sources and two unmerged historical source branches.

## 1. Verified ledger baseline

The current live `supabase_migrations.schema_migrations` ledger contains **130 entries**. The latest is:

- Version `20261029193124`
- Name `candidate_self_service_profile_bootstrap_0095`

The committed reconciliation CSV contains 130 rows, and every row's version/name pair matches a live ledger entry. The latest audit changed the CSV to add `source_ref`, identifying the source branch or commit or recording an explicit inventory gap.

- Manifest: [KINGSMEN_MIGRATION_LEDGER_RECONCILIATION_2026-11-17.csv](KINGSMEN_MIGRATION_LEDGER_RECONCILIATION_2026-11-17.csv)
- Validator: [validate-kingsmen-migration-ledger-reconciliation.mjs](../../scripts/validators/validate-kingsmen-migration-ledger-reconciliation.mjs)
- Manifest validation workflow: [kingsmen-migration-ledger-manifest.yml](../../.github/workflows/kingsmen-migration-ledger-manifest.yml)

## 2. Source inventory by location

| Source classification | Count | What was verified | Remaining limitation |
|---|---:|---|---|
| `EXACT_TIMESTAMP_RECOVERY_FILE` | 62 | Each timestamp-prefixed recovery snapshot exists in the historical recovery directory at PR #254 head `18f71066ac8ff9fb88711c303a3df38833d873c5` and its timestamp matches a live ledger version. | These files are not present in the current rebuild branch or `main`; they are not automatically proven byte-identical to the SQL applied to the live database. |
| `FILENAME_MATCH_REQUIRES_CONTENT_REVIEW` | 36 | A candidate filename exists on at least one checked source branch. | 29 candidates are present in the current rebuild branch. Seven are available only on the two open source PR branches (#209 and #254). None is yet accepted as historical SQL parity solely from its filename. |
| `NO_MATCHING_SQL_SOURCE_FOUND` | 32 | The audit's recorded source inventories did not locate a matching SQL source file. | This is a provenance gap, not proof that no source exists in any external archive, local workstation or unindexed Git history. Do not reconstruct the original migration by guessing from the current schema. |

### Relevant source branches

- [PR #254 — CAO privileges / active-candidate cap](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/254), head `18f71066ac8ff9fb88711c303a3df38833d873c5`, base `ops/backup-restore-safety-current-rc-2026-10-30`. This open PR contains the 62 timestamp-prefixed recovery snapshots and candidate migrations 0088–0098.
- [PR #209 — backend simplification baseline](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/209), head `35871bdfb2484dd951eb956477a543866193a432`, base `main`. This open PR contains the filename candidates for the 36-entry class.

**Important:** these are historical source candidates on unmerged branches, not files present at the current rebuild branch's `release-evidence/recovered-applied-migrations/` path. The CSV now carries source refs explicitly to prevent a reviewer assuming that those paths resolve in the current tree.

## 3. Seven filename candidates missing from the current rebuild tree

These source filenames exist in PR #209 and PR #254 but do not exist in the current rebuild branch's `db/migrations` directory. Review their dependencies and SQL content before copying or adopting them:

| Live ledger entry | Candidate source file |
|---|---|
| `20261029165245 0088_covering_indexes_for_live_foreign_keys` | `db/migrations/0088_covering_indexes_for_live_foreign_keys.sql` |
| `20261029180243 remove_duplicate_identity_review_open_request_index_0091` | `db/migrations/0091_remove_duplicate_identity_review_open_request_index.sql` |
| `20261029180233 atomic_payfast_checkout_bundle_0092` | `db/migrations/0092_atomic_payfast_checkout_bundle.sql` |
| `20261029180632 seed_verified_labour_vacancy_deadlines_0093` | `db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql` |
| `20261029180642 seed_verified_labour_vacancy_deadlines_0093` | `db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql` |
| `20261029181155 harden_payfast_checkout_identity_locks_0094` | `db/migrations/0094_harden_payfast_checkout_identity_locks.sql` |
| `20261029193124 candidate_self_service_profile_bootstrap_0095` | `db/migrations/0095_candidate_self_service_profile_bootstrap.sql` |

The duplicate 0093 entries are not a reason to treat one candidate SQL file as the proven source for both applied entries. Their versions differ while the ledger name repeats; resolve the content/history relationship before making replay or migration-baseline decisions.

## 4. Thirty-two ledger entries with no matching SQL source in the recorded inventory

These entries remain unlocated in the checked canonical migration directories and the PR #254 / PR #209 recovery-source inventories:

| Version | Live ledger name |
|---|---|
| `20261012155914` | `rls_helper_search_path_hardening_0020` |
| `20261012160432` | `foreign_key_index_hardening_0021` |
| `20261012173518` | `n10_commercial_schedule_v1_0022` |
| `20261015151555` | `candidate_auth_private_storage_0023` |
| `20261015151630` | `candidate_owned_application_document_reads_0024` |
| `20261015152102` | `explicit_candidate_identity_binding` |
| `20261015152345` | `require_verified_candidate_identity` |
| `20261015152529` | `candidate_portal_durable_state` |
| `20261015152933` | `harden_candidate_document_storage` |
| `20261015153626` | `revoke_anon_candidate_data_access_0029` |
| `20261015153651` | `revoke_unneeded_candidate_mutations_0030` |
| `20261017155008` | `0060_n06_application_pathway_runtime` |
| `20261017155013` | `0061_n07_provider_review_operations` |
| `20261017155018` | `0062_n08_outcomes_progression` |
| `20261017155024` | `0063_n09_communications_follow_up` |
| `20261017155029` | `0064_n10_packages_payments_refunds` |
| `20261017155618` | `n10_finance_privilege_hardening` |
| `20261017160630` | `n10_atomic_payfast_payment_confirmation` |
| `20261017160636` | `n10_payfast_refund_reconciliation` |
| `20261017160641` | `n10_atomic_finance_workflows` |
| `20261017160751` | `n10_finance_rpc_only_writes` |
| `20261017174940` | `n03_truth_vault_0002_rls_hardening` |
| `20261019082917` | `n06_application_privilege_hardening_0073` |
| `20261019112521` | `authorised_candidate_document_review_0080` |
| `20261022030303` | `reviewer_audit_tables_backend_only` |
| `20261022031206` | `move_candidate_identity_helper_to_private_schema` |
| `20261025004936` | `n16_durable_worker_recovery_202610250001` |
| `20261025004943` | `n16_worker_send_boundary_202610250002` |
| `20261025004952` | `n16_exhausted_lease_recovery_202610250003` |
| `20261029143144` | `canonical_package_benefits_universal_accommodation_20261029` |
| `20261029143414` | `seed_canonical_public_package_cards_20261029` |
| `20261029174204` | `candidate_private_document_vault_workflows_0089` |

**Disposition:** do not replay an unknown migration, and do not create an invented historical SQL file under a previously used version. Search historical branches, workflow artifacts, backups and repository object history. If the original SQL remains unavailable, reconstruct only a separately numbered, forward-only remediation from reviewed live-schema evidence, preserving the distinction between historical unknown and new approved change.

## 5. Duplicate ledger names needing separate resolution

- `candidate_application_preparation_readiness_0078`: versions `20261019112452` and `20261019112511`; both candidate recovery snapshots exist, including a corrected variant. Content and runtime effects still need review.
- `seed_verified_labour_vacancy_deadlines_0093`: versions `20261029180632` and `20261029180642`; the same candidate filename is referenced for both manifest entries. Do not replay or collapse them until transaction history/source content is understood.

The live ledger does not store an applied SQL checksum, so filename equality cannot answer whether a snapshot's bytes match the original applied migration.

## 6. The 0096–0098 candidates are not part of the live applied baseline

The live ledger ends at migration name 0095. These candidates exist only on the open PR #254 source branch and remain review candidates:

- `0096_candidate_application_cao_choice_bridge.sql`
- `0097_revoke_client_non_dml_privileges.sql`
- `0098_enforce_active_candidate_capacity.sql`

The files need a dependency-ordered review against the live schema, active constraints, RLS grants and the later staged 0107–0109 capacity/readiness/draft chain. PR #254 also targets an older backup-safety branch rather than `main`; do not merge it wholesale to obtain these files.

## 7. Safe next sequence

1. Preserve this source-ref-enriched manifest and validate it in CI.
2. For each of the 32 missing sources, search historical Git objects/branches and saved workflow artifacts, keeping found sources immutable and source-ref tagged.
3. Review each duplicate-name pair independently; do not use name-only deduplication.
4. Byte-compare each of the 62 recovered snapshots with the applied migration only where independent evidence can be obtained. The live migration ledger itself has no SQL checksum.
5. Validate candidate files 0088–0098 on an isolated restored database and reconcile their constraints with the current live schema. Do not apply them to staging yet.
6. Obtain and prove a protected backup/restore of staging before any migration, grant change or data mutation.

## Change record

- This register was created from read-only GitHub and Supabase inspections on 19 November 2026.
- It does not assert SQL-content parity for any migration.
- No live database schema or row was modified.
- PR #209 and PR #254 remain unmerged source references; no changes were made to their state.


## 8. Follow-up historical branch scan — 19 November 2026

The original 32-entry “no source found” list in Section 4 was correct for the narrower inventory then checked, but it has been superseded by a broader read-only scan of 241 repository branches. **Thirty of those 32 entries now have historical filename/source candidates; two remain without a matching SQL source in the branches and directories inspected.** The source-ref-enriched CSV is the current machine-readable disposition.

Current classification totals:

| Source classification | Entries | Current disposition |
|---|---:|---|
| `EXACT_TIMESTAMP_RECOVERY_FILE` | 62 | Timestamp matches live ledger on historical PR #254 recovery snapshot; SQL byte parity not established |
| `FILENAME_MATCH_REQUIRES_CONTENT_REVIEW` | 36 | Candidate file is present in current rebuild or one of PR #209/#254 source trees; content review remains open |
| `HISTORICAL_BRANCH_SOURCE_REQUIRES_CONTENT_REVIEW` | 30 | Candidate filename is located on an additional historical branch; source provenance is recorded, but not accepted as applied-SQL parity |
| `NO_MATCHING_SQL_SOURCE_FOUND` | 2 | No matching SQL source was identified in the wider branch scan |

### Remaining two source gaps

| Live ledger version | Live ledger name | Current finding |
|---|---|---|
| `20261029143144` | `canonical_package_benefits_universal_accommodation_20261029` | No matching SQL file located in the migration directories checked across the current branch, PR #209/#254 and the wider package/accommodation/finance branches. The older `0022_n10_commercial_schedule_v1.sql` is a related candidate, not a substitute for this later migration. |
| `20261029143414` | `seed_canonical_public_package_cards_20261029` | No matching SQL file located in the migration directories checked across the current branch, PR #209/#254 and the wider package/accommodation/finance branches. Do not infer the seed SQL from current package rows or reconstruct the original as though recovered. |

### Newly located historical source candidates

The 30 candidate paths are recorded individually in `KINGSMEN_MIGRATION_LEDGER_RECONCILIATION_2026-11-17.csv` in the `source_path` and `source_ref` columns under `HISTORICAL_BRANCH_SOURCE_REQUIRES_CONTENT_REVIEW`. Notable source roots include:

- `fix/staging-migration-rls-restore`: 0020 RLS helper search-path hardening and 0021 FK-index hardening.
- `fix/accommodation-pricing-canonical`: 0022 commercial schedule.
- `draft/pr-a-migration-review`: candidate identity binding and private-document migration group 0023–0030.
- `n06-applications-pathway-execution-2026-10-17`, `n07-provider-review-operations-2026-10-17`, `n08-outcomes-progression-2026-10-17`, `n09-communications-follow-up-2026-10-17`, and `n10-packages-payments-refunds-2026-10-17`: application, outcome, communications and finance sources 0060–0070 and 0073.
- `n02-n03-truth-vault-runtime-proof`: 0002 RLS hardening candidate.
- `feat/authorised-document-review`: 0080 authorised document-review candidate.
- `fix/private-schema-candidate-identity-helper-2026-10-22`: reviewer audit table and private candidate identity-helper migration candidates.
- `feat/n16-worker-recovery-rc1-2026-10-31`: worker recovery sources 202610250001–202610250003.
- PR #254 recovery branch: 0089 private document workflow candidate.

These are migration-source leads, not accepted baselines. Before adopting any source, review file contents, dependency order, the exact live ledger name/version, execution evidence and compatibility with the current schema. Do not replay them.

The updated manifest validator passed after this classification change: https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/44553241494
