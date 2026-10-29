# Recovered applied-migration bodies — provenance index

These SQL files are archival evidence only, stored outside the runnable migration directories. They were reconstructed from added-file patches in the listed historical pull requests and mapped to the staging migration ledger by migration name/version. They must **not** be applied or replayed from this directory.

Important distinction: the listed Git blob SHA fingerprints the archived recovered file in this repository; it is **not** a checksum captured at the original staging execution time. The patch is a strong historical source, but original executed bytes are not independently proven unless a database/deployment artifact checksum is found.

| Staging ledger version | Recovered body file | Source PR | Archived Git blob SHA |
|---|---|---:|---|
| `20261019095926` | [`20261019095926_candidate_workspace_persistence_v1.sql`](./recovered-applied-migrations/20261019095926_candidate_workspace_persistence_v1.sql) | #120 | `29d2dcc4dc6f8774c37a32a9916091bf31f1dd33` |
| `20261019101601` | [`20261019101601_candidate_identity_review_requests_v1.sql`](./recovered-applied-migrations/20261019101601_candidate_identity_review_requests_v1.sql) | #120 | `b04e9ebe99a6b77ea4a33bcc56ea4c36a92c8d65` |
| `20261019112437` | [`20261019112437_candidate_identity_review_decision_workflow_0076.sql`](./recovered-applied-migrations/20261019112437_candidate_identity_review_decision_workflow_0076.sql) | #120 | `4b7aa23cf677146a50c79a911312df8039dc0e4a` |
| `20261019112445` | [`20261019112445_candidate_application_tracker_0077.sql`](./recovered-applied-migrations/20261019112445_candidate_application_tracker_0077.sql) | #120 | `cc497c66237518285aeac8e7149ac5ad152fab25` |
| `20261019112452` | [`20261019112452_candidate_application_preparation_readiness_0078.sql`](./recovered-applied-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql) | #120 | `9fdabdde36c981ae305e57df589c168471b7d974` |
| `20261019112516` | [`20261019112516_candidate_private_document_vault.sql`](./recovered-applied-migrations/20261019112516_candidate_private_document_vault.sql) | #121 | `ce637183e10077e54a9e1cd38f8b0641e23f9f9e` |
| `20261019112627` | [`20261019112627_candidate_document_preparation_detach_and_fk_indexes.sql`](./recovered-applied-migrations/20261019112627_candidate_document_preparation_detach_and_fk_indexes.sql) | #121 | `5713c8821777223349b882e4e9e20af63fac3256` |
| `20261020031028` | [`20261020031028_n12_candidate_private_document_review.sql`](./recovered-applied-migrations/20261020031028_n12_candidate_private_document_review.sql) | #134 | `12a0476777b46ec3824104524b86a5f4127bb629` |
| `20261022042942` | [`20261022042942_candidate_identity_review_submission_rpc.sql`](./recovered-applied-migrations/20261022042942_candidate_identity_review_submission_rpc.sql) | #140 | `0963c379243ddf76a11777e3c5b04fd3e0029ecf` |
| `20261022043212` | [`20261022043212_serialize_candidate_identity_review_submissions.sql`](./recovered-applied-migrations/20261022043212_serialize_candidate_identity_review_submissions.sql) | #142 | `6f53510a41192cc8e31c89a649bf392cc7bf0407` |
| `20261022183219` | [`20261022183219_revoke_client_candidate_identity_link_table_access.sql`](./recovered-applied-migrations/20261022183219_revoke_client_candidate_identity_link_table_access.sql) | #143 | `d7eb5abd546d893ddd20c2b3c1fdfb1afcfd51e3` |
| `20261022184513` | [`20261022184513_identity_review_server_side_submission_route.sql`](./recovered-applied-migrations/20261022184513_identity_review_server_side_submission_route.sql) | #143 | `232bb290644c96b95fd078b42b9374e9df0e3f91` |
| `20261022184626` | [`20261022184626_identity_review_submission_audit_schema_compat.sql`](./recovered-applied-migrations/20261022184626_identity_review_submission_audit_schema_compat.sql) | #143 | `fb300f77805217786aab36d2fd709c74e37bfcfd` |
| `20261022194413` | [`20261022194413_expand_sa_official_source_catalog.sql`](./recovered-applied-migrations/20261022194413_expand_sa_official_source_catalog.sql) | #134 | `77c439d9fe565f93ba66196d5e7f0503e9a9aa75` |
| `20261022202953` | [`20261022202953_n09_communications_backend_only.sql`](./recovered-applied-migrations/20261022202953_n09_communications_backend_only.sql) | #134 | `991459940a4c3f0d24e78d3183b7e4c455370f34` |
| `20261023040341` | [`20261023040341_cross_module_application_outcome_truth_guards.sql`](./recovered-applied-migrations/20261023040341_cross_module_application_outcome_truth_guards.sql) | #134 | `7e9ad6c5f0641f57200fc953af3eecaa8cc9cca5` |
| `20261023132336` | [`20261023132336_revoke_client_execute_application_outcome_guard_functions.sql`](./recovered-applied-migrations/20261023132336_revoke_client_execute_application_outcome_guard_functions.sql) | #175 | `65be42678f2722726a2477edaa76d9621629fdcd` |
| `20261023133631` | [`20261023133631_application_linked_private_document_evidence.sql`](./recovered-applied-migrations/20261023133631_application_linked_private_document_evidence.sql) | #175 | `f7d244b350ad8218c9c0c064609db9e750f79103` |
| `20261023135605` | [`20261023135605_seed_verified_labour_vacancies.sql`](./recovered-applied-migrations/20261023135605_seed_verified_labour_vacancies.sql) | #175 | `66079bd74132b924e3996b31dac5b9ea845bee8c` |
| `20261023142155` | [`20261023142155_route_availability_expiry_guards.sql`](./recovered-applied-migrations/20261023142155_route_availability_expiry_guards.sql) | #175 | `753bbb8a9feb874c8690b6cb1bdb6593a0af38ca` |
| `20261023142549` | [`20261023142549_route_availability_sa_timezone.sql`](./recovered-applied-migrations/20261023142549_route_availability_sa_timezone.sql) | #175 | `2eb3dda6b0575afcc0876aec2ae0101f85cbcbcb` |
| `20261023144551` | [`20261023144551_n15_current_verified_opportunity_feed.sql`](./recovered-applied-migrations/20261023144551_n15_current_verified_opportunity_feed.sql) | #175 | `7c67c9e746d08082995b343900f1a648583d538f` |
| `20261023145002` | [`20261023145002_n15_public_safe_opportunity_feed.sql`](./recovered-applied-migrations/20261023145002_n15_public_safe_opportunity_feed.sql) | #175 | `6e1ee0c2bd6a9fd927033755ef603313b9e2f35e` |
| `20261023145908` | [`20261023145908_n05_document_application_owner_index.sql`](./recovered-applied-migrations/20261023145908_n05_document_application_owner_index.sql) | #175 | `804e290a0bf9ddc3b5ec978dbdbced8fa4860b6a` |
| `20261023152823` | [`20261023152823_n11_ai_evidence_and_review_guards.sql`](./recovered-applied-migrations/20261023152823_n11_ai_evidence_and_review_guards.sql) | #175 | `8701d4a831f848f59a5afeb2baec9fb988cad3c6` |
| `20261023164135` | [`20261023164135_n07_durable_outbox_leases_retry.sql`](./recovered-applied-migrations/20261023164135_n07_durable_outbox_leases_retry.sql) | #155 | `b6dc1ffe7fbb81b5b7f98dcedbc66cdc57c3b814` |
| `20261025090643` | [`20261025090643_n17_founder_brief_access_hardening.sql`](./recovered-applied-migrations/20261025090643_n17_founder_brief_access_hardening.sql) | #171 | `ba57f590a5f231c7d2994fcb99bd6b8f6a628aa3` |
| `20261025090832` | [`20261025090832_n17_founder_report_access_hardening.sql`](./recovered-applied-migrations/20261025090832_n17_founder_report_access_hardening.sql) | #171 | `1087662bc3365673d8443f0808775aa57ecf1535` |
| `20261025101411` | [`20261025101411_payfast_sandbox_atomic_settlement.sql`](./recovered-applied-migrations/20261025101411_payfast_sandbox_atomic_settlement.sql) | #172 | `89aa9cc8a73e29e16919af7a309be6fc062a6764` |
| `20261025105336` | [`20261025105336_identity_review_least_privilege_role.sql`](./recovered-applied-migrations/20261025105336_identity_review_least_privilege_role.sql) | #173 | `95af6909abf3eefd4d88b7bdac4018fc5cea65f6` |
| `20261025105411` | [`20261025105411_identity_review_role_code_constraint.sql`](./recovered-applied-migrations/20261025105411_identity_review_role_code_constraint.sql) | #173 | `c9facc4d37b52f151f305fab82643918a401ba06` |
| `20261025105520` | [`20261025105520_identity_review_audit_actor_role.sql`](./recovered-applied-migrations/20261025105520_identity_review_audit_actor_role.sql) | #173 | `fc7c15379f68a2f2924ca6e1a2363f1196c996f2` |
| `20261025110908` | [`20261025110908_unified_candidate_master_application.sql`](./recovered-applied-migrations/20261025110908_unified_candidate_master_application.sql) | #175 | `d8b3fc27843b6e2e640c35eccbd1bf0f2c74585e` |
| `20261025110918` | [`20261025110918_unified_candidate_master_application_rpc.sql`](./recovered-applied-migrations/20261025110918_unified_candidate_master_application_rpc.sql) | #175 | `2bddc3fceacdc05cf4e63c58f02713bc210a354c` |
| `20261025111050` | [`20261025111050_unified_master_application_source_confidence_guard.sql`](./recovered-applied-migrations/20261025111050_unified_master_application_source_confidence_guard.sql) | #175 | `811041652a31efff16628e0527408c14eb7db8fc` |
| `20261025111404` | [`20261025111404_candidate_identity_review_private_evidence.sql`](./recovered-applied-migrations/20261025111404_candidate_identity_review_private_evidence.sql) | #174 | `1c560efc3d7d6fc7221de358669a307cea5746d2` |
| `20261025112103` | [`20261025112103_candidate_identity_review_followup_status.sql`](./recovered-applied-migrations/20261025112103_candidate_identity_review_followup_status.sql) | #176 | `45128375712ea98220b3cb479335e725df4da398` |
| `20261025112853` | [`20261025112853_master_target_to_application_lifecycle_bridge.sql`](./recovered-applied-migrations/20261025112853_master_target_to_application_lifecycle_bridge.sql) | #175 | `2b2141403a7ee959636169a0746a73648a0b8411` |
| `20261025113010` | [`20261025113010_master_target_pathway_consistency_guard.sql`](./recovered-applied-migrations/20261025113010_master_target_pathway_consistency_guard.sql) | #175 | `ebc2581c0ff2102948d51e0ab617a45c9ced8692` |
| `20261025113119` | [`20261025113119_candidate_manual_portal_handoff.sql`](./recovered-applied-migrations/20261025113119_candidate_manual_portal_handoff.sql) | #175 | `da6c992682ea3b6ae792b7fce38cf0289e1af0d3` |
| `20261025113510` | [`20261025113510_freeze_linked_master_application_targets.sql`](./recovered-applied-migrations/20261025113510_freeze_linked_master_application_targets.sql) | #175 | `b9f865b0aac961213ebe90ea473c931fe6de1e50` |
| `20261025113726` | [`20261025113726_link_reviewed_documents_to_application_evidence.sql`](./recovered-applied-migrations/20261025113726_link_reviewed_documents_to_application_evidence.sql) | #175 | `0aa1c1447818f6a4349d3f66a50898e495a2d95f` |
| `20261025113938` | [`20261025113938_verified_submission_and_outcome_workflow.sql`](./recovered-applied-migrations/20261025113938_verified_submission_and_outcome_workflow.sql) | #175 | `8da91c83290f8ca3ea745b587c8088ce9860dc1a` |
| `20261025114110` | [`20261025114110_lock_document_review_rpc_to_service_role.sql`](./recovered-applied-migrations/20261025114110_lock_document_review_rpc_to_service_role.sql) | #175 | `19a109662ed085f8c89fc9d7d03e89468aaaa08e` |

## Recovery constraints

- No recovered file is in `db/migrations/` or `supabase/migrations/`; the live migration runner cannot accidentally replay these archive copies.
- A migration name/version mapping is provisional where the historical PR filename timestamp differs from the staging ledger version. The ledger label, source PR, body semantics and live catalog effects still require independent reconciliation.
- The two applied `candidate_application_preparation_readiness_0078` ledger versions are not interchangeable. This archive contains the PR #120 body for one version only; the body for the second version remains unresolved.
- Never use these bodies to recreate a clean baseline until the entire ledger is reconciled in order and the resulting schema is validated on a disposable staging restore.
