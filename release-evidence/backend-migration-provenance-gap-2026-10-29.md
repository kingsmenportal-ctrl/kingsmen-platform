# Kingsmen staging migration provenance gap — 2026-10-29

## Exact scope and evidence

- Repository commit audited: `79e9ea58a96dc59398b25b907aad58624afca621` (PR #209 head at audit time).
- Supabase project: `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`).
- Applied Supabase migration ledger entries: **122**.
- Checked-in files under `db/migrations/`: **36** (includes pending `0087`, so not all are applied).
- SQL files anywhere in the repository tree: **62** (includes seeds, schema fragments and release-evidence queries; these are not automatically authoritative migration bodies).
- Ledger entries without a matching checked-in migration body by canonical migration number/name: **89**.
- A duplicate migration name exists: `candidate_application_preparation_readiness_0078` at ledger versions `20261019112452` and `20261019112511`. These are separate applied versions; they must not be collapsed based on the shared label.

## Missing authoritative bodies in the current repository

The following applied ledger entries have no matching canonical migration body in `db/migrations/` at this commit. This is a source-provenance gap, not proof that the live schema is absent. Do not recreate these by guessing from their names or re-run them.

- `20261012155744` — `rls_security_boundary_0019`
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
- `20261017062602` — `n11_payfast_retryable_rejected_itn_0037`
- `20261017062700` — `candidate_sessions_0038_legacy_compatible`
- `20261017062706` — `candidate_credentials_0039`
- `20261017062711` — `candidate_auth_identity_link_0040`
- `20261017082458` — `kingsmen_ecosystem_marketplace_0041`
- `20261017082554` — `public_verified_opportunity_read_0042`
- `20261017082751` — `marketplace_rls_performance_hardening_0043`
- `20261017083209` — `candidate_saved_routes_0044`
- `20261017084704` — `marketplace_review_event_audit_0056`
- `20261017085001` — `marketplace_https_url_constraints_0057`
- `20261017085438` — `marketplace_public_dns_url_constraints_0058`
- `20261017155008` — `0060_n06_application_pathway_runtime`
- `20261017155013` — `0061_n07_provider_review_operations`
- `20261017155018` — `0062_n08_outcomes_progression`
- `20261017155024` — `0063_n09_communications_follow_up`
- `20261017155029` — `0064_n10_packages_payments_refunds`
- `20261017155618` — `n10_finance_privilege_hardening`
- `20261017160630` — `n10_atomic_payfast_payment_confirmation`
- `20261017160636` — `n10_payfast_refund_reconciliation`
- `20261017160641` — `n10_atomic_finance_workflows`
- `20261017160751` — `n10_finance_rpc_only_writes`
- `20261017174940` — `n03_truth_vault_0002_rls_hardening`
- `20261019082917` — `n06_application_privilege_hardening_0073`
- `20261019095926` — `candidate_workspace_persistence_v1`
- `20261019101601` — `candidate_identity_review_requests_v1`
- `20261019112437` — `candidate_identity_review_decision_workflow_0076`
- `20261019112445` — `candidate_application_tracker_0077`
- `20261019112452` — `candidate_application_preparation_readiness_0078`
- `20261019112511` — `candidate_application_preparation_readiness_0078`
- `20261019112516` — `candidate_private_document_vault_0079`
- `20261019112521` — `authorised_candidate_document_review_0080`
- `20261019112627` — `candidate_document_preparation_detach_and_fk_indexes_0081`
- `20261020031028` — `n12_candidate_private_document_review`
- `20261022030303` — `reviewer_audit_tables_backend_only`
- `20261022031206` — `move_candidate_identity_helper_to_private_schema`
- `20261022042942` — `candidate_identity_review_submission_rpc`
- `20261022043212` — `serialize_candidate_identity_review_submissions`
- `20261022183219` — `revoke_client_candidate_identity_link_table_access`
- `20261022184513` — `identity_review_server_side_submission_route`
- `20261022184626` — `identity_review_submission_audit_schema_compat`
- `20261022194413` — `expand_sa_official_source_catalog`
- `20261022202953` — `n09_communications_backend_only`
- `20261023040341` — `cross_module_application_outcome_truth_guards`
- `20261023132336` — `revoke_client_execute_application_outcome_guard_functions`
- `20261023133631` — `20261023170000_application_linked_private_document_evidence`
- `20261023135605` — `20261023180000_seed_verified_labour_vacancies`
- `20261023142155` — `20261023190000_route_availability_expiry_guards`
- `20261023142549` — `20261023200000_route_availability_sa_timezone`
- `20261023144551` — `n15_current_verified_opportunity_feed`
- `20261023145002` — `n15_public_safe_opportunity_feed`
- `20261023145908` — `n05_document_application_owner_index`
- `20261023152823` — `n11_ai_evidence_and_review_guards`
- `20261023164135` — `0020_n07_durable_outbox_leases_retry`
- `20261025004936` — `n16_durable_worker_recovery_202610250001`
- `20261025004943` — `n16_worker_send_boundary_202610250002`
- `20261025004952` — `n16_exhausted_lease_recovery_202610250003`
- `20261025090643` — `n17_founder_brief_access_hardening`
- `20261025090832` — `n17_founder_report_access_hardening`
- `20261025101411` — `payfast_sandbox_atomic_settlement`
- `20261025105336` — `identity_review_least_privilege_role`
- `20261025105411` — `identity_review_role_code_constraint`
- `20261025105520` — `identity_review_audit_actor_role`
- `20261025110908` — `unified_candidate_master_application`
- `20261025110918` — `unified_candidate_master_application_rpc`
- `20261025111050` — `unified_master_application_source_confidence_guard`
- `20261025111404` — `candidate_identity_review_private_evidence`
- `20261025112103` — `candidate_identity_review_followup_status`
- `20261025112853` — `master_target_to_application_lifecycle_bridge`
- `20261025113010` — `master_target_pathway_consistency_guard`
- `20261025113119` — `candidate_manual_portal_handoff`
- `20261025113510` — `freeze_linked_master_application_targets`
- `20261025113726` — `link_reviewed_documents_to_application_evidence`
- `20261025113938` — `verified_submission_and_outcome_workflow`
- `20261025114110` — `lock_document_review_rpc_to_service_role`
- `20261029143144` — `canonical_package_benefits_universal_accommodation_20261029`
- `20261029143414` — `seed_canonical_public_package_cards_20261029`

## Live schema inventory (read-only)

| Object class | Count |
|---|---:|
| Public base tables | 230 |
| Public functions | 41 |
| Public non-internal triggers | 20 |
| Public constraints | 1,034 |
| Public indexes | 733 |
| Public RLS policies | 287 |

These counts are a point-in-time inventory, not semantic parity. Exact function bodies, trigger definitions, constraints, indexes, RLS predicates, grants and object ownership must be compared individually against the recovered migration sequence and repository definitions.

## Exact-head CI result

All three pull-request-triggered workflows completed successfully on this commit:

- Jarvis Live Runtime — run `40910045994`, job `validate`: success.
- Kingsmen Source Guard — run `40910045841`, job `source-guard`: success, including migration-integrity and authenticated-staging-E2E source-contract regression tests.
- Kingsmen Release Evidence — run `40910046314`, job `Build, validate, and smoke-test`: success, including repository tests, API build, Next.js build and local API health smoke tests.

This validates repository CI at this SHA. It does **not** prove the live database matches the repository, nor that an authenticated candidate/reviewer journey passes. PR #209 remains draft and has no submitted review.

## Safe reconciliation rule

1. Recover each missing body from an authoritative historical artifact: original committed blob/PR patch, immutable deployment artifact, backup, or recorded migration SQL export. Store exact bytes and SHA-256 provenance.
2. For each ledger version, record its original version, name, body hash, authoritative source, and whether the body is exact, reconstructed, or unavailable. Never label a reconstruction as original.
3. Compare ordered effects to the live catalog: columns/types/defaults/nullability; PK/FK/unique/check constraints; indexes and predicates; functions and grants; triggers; RLS enabled/forced state and complete policy expressions; storage policies; RPC exposure and function search paths.
4. Test the proposed canonical baseline on a disposable database restored from staging backup. Verify migrations apply in order and the final catalog semantically matches the staging snapshot.
5. Use only guarded, forward-only corrective migrations for genuine drift. Do not edit/replay applied migrations and do not apply migration `0087` until independent review and full parity checks pass.
6. Do not retire an application or identity path until real authenticated candidate A/B isolation and least-privilege reviewer decision/audit tests pass against staging.

## Not yet proven

- Original SQL bodies for the 89 missing ledger entries.
- Full catalog-level semantic parity between repository and live staging.
- Backup/restore drill against the current staging snapshot.
- Authenticated candidate registration/profile persistence and Candidate A/B isolation.
- Authenticated identity-review request/evidence/reviewer decision/audit.
- Safe retirement of legacy application or identity paths.
- Staging deployment of PR #209 or migration `0087`.
