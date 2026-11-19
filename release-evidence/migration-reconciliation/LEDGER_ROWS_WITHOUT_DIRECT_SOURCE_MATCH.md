# Live migration ledger rows without a direct source filename match

**Observed:** 2026-11-19  
**Supabase project:** `euhubhhnumtibbyufghm`  
**Ledger snapshot:** 130 rows; latest `20261029193124 candidate_self_service_profile_bootstrap_0095`  
**Search:** seven current/historical branch trees; direct 14-digit filename prefix or normalized migration-name comparison. This is a filename evidence scan, not proof that no SQL source exists anywhere.

The following rows did not have a direct filename match in the scanned source snapshots. A row may still have a historical SQL candidate under a divergent name; such a candidate needs content comparison and provenance review before it is accepted as the applied source.

| Ledger version | Ledger migration name | Review status |
|---|---|---|
| `20261012155914` | `rls_helper_search_path_hardening_0020` | No direct filename match; search recovered migration history |
| `20261012160432` | `foreign_key_index_hardening_0021` | No direct filename match; compare existing FK-index source and applied evidence |
| `20261012173518` | `n10_commercial_schedule_v1_0022` | No direct filename match; source recovery required |
| `20261017155008` | `0060_n06_application_pathway_runtime` | No direct filename match; source recovery required |
| `20261017155013` | `0061_n07_provider_review_operations` | No direct filename match; source recovery required |
| `20261017155018` | `0062_n08_outcomes_progression` | No direct filename match; source recovery required |
| `20261017155024` | `0063_n09_communications_follow_up` | No direct filename match; source recovery required |
| `20261017155029` | `0064_n10_packages_payments_refunds` | No direct filename match; source recovery required |
| `20261017155618` | `n10_finance_privilege_hardening` | No direct filename match; source recovery required |
| `20261017160630` | `n10_atomic_payfast_payment_confirmation` | No direct filename match; source recovery required |
| `20261017160636` | `n10_payfast_refund_reconciliation` | No direct filename match; source recovery required |
| `20261017160641` | `n10_atomic_finance_workflows` | No direct filename match; source recovery required |
| `20261017160751` | `n10_finance_rpc_only_writes` | No direct filename match; source recovery required |
| `20261017174940` | `n03_truth_vault_0002_rls_hardening` | No direct filename match; source recovery required |
| `20261019082917` | `n06_application_privilege_hardening_0073` | No direct filename match; source recovery required |
| `20261019112521` | `authorised_candidate_document_review_0080` | No direct filename match; source recovery required |
| `20261022030303` | `reviewer_audit_tables_backend_only` | No direct filename match; source recovery required |
| `20261022031206` | `move_candidate_identity_helper_to_private_schema` | No direct filename match; source recovery required |
| `20261025004936` | `n16_durable_worker_recovery_202610250001` | No direct filename match; source recovery required |
| `20261025004943` | `n16_worker_send_boundary_202610250002` | No direct filename match; source recovery required |
| `20261025004952` | `n16_exhausted_lease_recovery_202610250003` | No direct filename match; source recovery required |
| `20261029143144` | `canonical_package_benefits_universal_accommodation_20261029` | No source SQL found in scanned snapshots |
| `20261029143414` | `seed_canonical_public_package_cards_20261029` | No source SQL found in scanned snapshots |
| `20261029174204` | `candidate_private_document_vault_workflows_0089` | Possible alternate-name candidate: `db/migrations/0089_secure_candidate_private_document_vault_workflows.sql`; content equivalence not verified |
| `20261029180632` | `seed_verified_labour_vacancy_deadlines_0093` | Possible alternate-name candidate: `db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql`; exact applied bytes not verified |
| `20261029180642` | `seed_verified_labour_vacancy_deadlines_0093` | Duplicate migration name; same candidate file as above, but second execution body's identity is unproven |

## Guardrails

- These 26 rows are unresolved by filename scanning, not proof of absent SQL in every archive or branch.
- The two duplicate 0093 ledger rows must remain distinct until their source bodies and execution history are reconciled.
- Do not put proposed migrations 0096–0106 into active migration directories or apply them as part of this recovery.
- Do not edit `supabase_migrations.schema_migrations` to fabricate history.
- Before applying any new migration, obtain a restorable backup, compare live schema to a disposable clone, run the reviewed forward-only migration there, and capture checksums and logs.
