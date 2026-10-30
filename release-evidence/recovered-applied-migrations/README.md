# Recovered applied-migration bodies — provenance index

These SQL files are archival evidence only, stored outside the runnable migration directories. Depending on the row, they are reconstructed from historical PR patches or preserved from a historical feature-branch snapshot, then mapped to the staging migration ledger by migration name/version. The PR #64 snapshots below are strong source-history evidence, but still require row-by-row catalog/provenance reconciliation. They must **not** be applied or replayed from this directory.

Important distinction: the listed Git blob SHA fingerprints the archived recovered file in this repository; it is **not** a checksum captured at the original staging execution time. The patch is a strong historical source, but original executed bytes are not independently proven unless a database/deployment artifact checksum is found.

| Staging ledger version | Recovered body file | Source PR | Archived Git blob SHA |
|---|---|---:|---|
| `20261017062557` | [`20261017062557_n11_payfast_provider_idempotency.sql`](./20261017062557_n11_payfast_provider_idempotency.sql) | #86 | `1238aa0460b3a47c1fe73474897d1ce489a18194` |
| `20261017062602` | [`20261017062602_n11_payfast_retryable_rejected_itn.sql`](./20261017062602_n11_payfast_retryable_rejected_itn.sql) | #86 | `e709698240152e5432be43fc31af3e8a10ad303b` |
| `20261017062700` | [`20261017062700_candidate_sessions_legacy_compatible.sql`](./20261017062700_candidate_sessions_legacy_compatible.sql) | #86 | `9edac6561412a930313a2800680033e99c6838e0` |
| `20261017062706` | [`20261017062706_candidate_credentials.sql`](./20261017062706_candidate_credentials.sql) | #86 | `4f045cb79be539cea9f053332c12ce26a6885997` |
| `20261017062711` | [`20261017062711_candidate_auth_identity_link.sql`](./20261017062711_candidate_auth_identity_link.sql) | #86 | `3bc2c8cbefabf902c4a965a984730d1f94c42378` |
| `20261017082458` | [`20261017082458_kingsmen_ecosystem_marketplace.sql`](./20261017082458_kingsmen_ecosystem_marketplace.sql) | #86 | `6aa85d0484e9c7ecb75391d749b7b0ac9b75e059` |
| `20261017082554` | [`20261017082554_public_verified_opportunity_read.sql`](./20261017082554_public_verified_opportunity_read.sql) | #86 | `daf44b87b6e8cc6a3a3a07dec12db0a2c7344742` |
| `20261017082751` | [`20261017082751_marketplace_rls_performance_hardening.sql`](./20261017082751_marketplace_rls_performance_hardening.sql) | #86 | `923e9819fbcfae48ad0796720c33a17e8a840711` |
| `20261017083209` | [`20261017083209_candidate_saved_routes.sql`](./20261017083209_candidate_saved_routes.sql) | #86 | `8dcf29fd29d992e29f1163c46256fbe786d377f7` |
| `20261017084704` | [`20261017084704_marketplace_review_event_audit.sql`](./20261017084704_marketplace_review_event_audit.sql) | #86 | `2f54b26fef29fe025f635482fee1263ce9431e2d` |
| `20261017085001` | [`20261017085001_marketplace_https_url_constraints.sql`](./20261017085001_marketplace_https_url_constraints.sql) | #86 | `20846783d24983a54459e77a6f31702b986e2dbb` |
| `20261017085438` | [`20261017085438_marketplace_public_dns_url_constraints.sql`](./20261017085438_marketplace_public_dns_url_constraints.sql) | #86 | `055814be6fe0e55f7db4d1701239b379b21c1889` |
| `20261019095926` | [`20261019095926_candidate_workspace_persistence_v1.sql`](./20261019095926_candidate_workspace_persistence_v1.sql) | #120 | `29d2dcc4dc6f8774c37a32a9916091bf31f1dd33` |
| `20261019101601` | [`20261019101601_candidate_identity_review_requests_v1.sql`](./20261019101601_candidate_identity_review_requests_v1.sql) | #120 | `b04e9ebe99a6b77ea4a33bcc56ea4c36a92c8d65` |
| `20261019112437` | [`20261019112437_candidate_identity_review_decision_workflow_0076.sql`](./20261019112437_candidate_identity_review_decision_workflow_0076.sql) | #120 | `4b7aa23cf677146a50c79a911312df8039dc0e4a` |
| `20261019112445` | [`20261019112445_candidate_application_tracker_0077.sql`](./20261019112445_candidate_application_tracker_0077.sql) | #120 | `cc497c66237518285aeac8e7149ac5ad152fab25` |
| `20261019112452` | [`20261019112452_candidate_application_preparation_readiness_0078.sql`](./20261019112452_candidate_application_preparation_readiness_0078.sql) | #120 | `6f3512d330b99206bad7859318dcaf9fdb461c59` |
| `20261019112511` | [`20261019112511_candidate_application_preparation_readiness_0078_corrected.sql`](./20261019112511_candidate_application_preparation_readiness_0078_corrected.sql) | #120, commit [`f723fbe`](https://github.com/kingsmenportal-ctrl/kingsmen-platform/commit/f723fbe7ac9eb3e3afe15e640d61da433bf1bdb4) | `9fdabdde36c981ae305e57df589c168471b7d974` |
| `20261019112516` | [`20261019112516_candidate_private_document_vault.sql`](./20261019112516_candidate_private_document_vault.sql) | #121 | `ce637183e10077e54a9e1cd38f8b0641e23f9f9e` |
| `20261019112627` | [`20261019112627_candidate_document_preparation_detach_and_fk_indexes.sql`](./20261019112627_candidate_document_preparation_detach_and_fk_indexes.sql) | #121 | `5713c8821777223349b882e4e9e20af63fac3256` |
| `20261020031028` | [`20261020031028_n12_candidate_private_document_review.sql`](./20261020031028_n12_candidate_private_document_review.sql) | #134 | `12a0476777b46ec3824104524b86a5f4127bb629` |
| `20261022042942` | [`20261022042942_candidate_identity_review_submission_rpc.sql`](./20261022042942_candidate_identity_review_submission_rpc.sql) | #140 | `0963c379243ddf76a11777e3c5b04fd3e0029ecf` |
| `20261022043212` | [`20261022043212_serialize_candidate_identity_review_submissions.sql`](./20261022043212_serialize_candidate_identity_review_submissions.sql) | #142 | `6f53510a41192cc8e31c89a649bf392cc7bf0407` |
| `20261022183219` | [`20261022183219_revoke_client_candidate_identity_link_table_access.sql`](./20261022183219_revoke_client_candidate_identity_link_table_access.sql) | #143 | `d7eb5abd546d893ddd20c2b3c1fdfb1afcfd51e3` |
| `20261022184513` | [`20261022184513_identity_review_server_side_submission_route.sql`](./20261022184513_identity_review_server_side_submission_route.sql) | #143 | `232bb290644c96b95fd078b42b9374e9df0e3f91` |
| `20261022184626` | [`20261022184626_identity_review_submission_audit_schema_compat.sql`](./20261022184626_identity_review_submission_audit_schema_compat.sql) | #143 | `fb300f77805217786aab36d2fd709c74e37bfcfd` |
| `20261022194413` | [`20261022194413_expand_sa_official_source_catalog.sql`](./20261022194413_expand_sa_official_source_catalog.sql) | #134 | `77c439d9fe565f93ba66196d5e7f0503e9a9aa75` |
| `20261022202953` | [`20261022202953_n09_communications_backend_only.sql`](./20261022202953_n09_communications_backend_only.sql) | #134 | `991459940a4c3f0d24e78d3183b7e4c455370f34` |
| `20261023040341` | [`20261023040341_cross_module_application_outcome_truth_guards.sql`](./20261023040341_cross_module_application_outcome_truth_guards.sql) | #134 | `7e9ad6c5f0641f57200fc953af3eecaa8cc9cca5` |
| `20261023132336` | [`20261023132336_revoke_client_execute_application_outcome_guard_functions.sql`](./20261023132336_revoke_client_execute_application_outcome_guard_functions.sql) | #134 | `65be42678f2722726a2477edaa76d9621629fdcd` |
| `20261023133631` | [`20261023133631_application_linked_private_document_evidence.sql`](./20261023133631_application_linked_private_document_evidence.sql) | #134 | `f7d244b350ad8218c9c0c064609db9e750f79103` |
| `20261023135605` | [`20261023135605_seed_verified_labour_vacancies.sql`](./20261023135605_seed_verified_labour_vacancies.sql) | #134 | `66079bd74132b924e3996b31dac5b9ea845bee8c` |
| `20261023142155` | [`20261023142155_route_availability_expiry_guards.sql`](./20261023142155_route_availability_expiry_guards.sql) | #134 | `753bbb8a9feb874c8690b6cb1bdb6593a0af38ca` |
| `20261023142549` | [`20261023142549_route_availability_sa_timezone.sql`](./20261023142549_route_availability_sa_timezone.sql) | #134 | `2eb3dda6b0575afcc0876aec2ae0101f85cbcbcb` |
| `20261023144551` | [`20261023144551_n15_current_verified_opportunity_feed.sql`](./20261023144551_n15_current_verified_opportunity_feed.sql) | #134 | `7c67c9e746d08082995b343900f1a648583d538f` |
| `20261023145002` | [`20261023145002_n15_public_safe_opportunity_feed.sql`](./20261023145002_n15_public_safe_opportunity_feed.sql) | #134 | `6e1ee0c2bd6a9fd927033755ef603313b9e2f35e` |
| `20261023145908` | [`20261023145908_n05_document_application_owner_index.sql`](./20261023145908_n05_document_application_owner_index.sql) | #134 | `804e290a0bf9ddc3b5ec978dbdbced8fa4860b6a` |
| `20261023152823` | [`20261023152823_n11_ai_evidence_and_review_guards.sql`](./20261023152823_n11_ai_evidence_and_review_guards.sql) | #134 | `8701d4a831f848f59a5afeb2baec9fb988cad3c6` |
| `20261023164135` | [`20261023164135_n07_durable_outbox_leases_retry.sql`](./20261023164135_n07_durable_outbox_leases_retry.sql) | #155 | `b6dc1ffe7fbb81b5b7f98dcedbc66cdc57c3b814` |
| `20261025090643` | [`20261025090643_n17_founder_brief_access_hardening.sql`](./20261025090643_n17_founder_brief_access_hardening.sql) | #171 | `ba57f590a5f231c7d2994fcb99bd6b8f6a628aa3` |
| `20261025090832` | [`20261025090832_n17_founder_report_access_hardening.sql`](./20261025090832_n17_founder_report_access_hardening.sql) | #171 | `1087662bc3365673d8443f0808775aa57ecf1535` |
| `20261025101411` | [`20261025101411_payfast_sandbox_atomic_settlement.sql`](./20261025101411_payfast_sandbox_atomic_settlement.sql) | #172 | `89aa9cc8a73e29e16919af7a309be6fc062a6764` |
| `20261025105336` | [`20261025105336_identity_review_least_privilege_role.sql`](./20261025105336_identity_review_least_privilege_role.sql) | #173 | `95af6909abf3eefd4d88b7bdac4018fc5cea65f6` |
| `20261025105411` | [`20261025105411_identity_review_role_code_constraint.sql`](./20261025105411_identity_review_role_code_constraint.sql) | #173 | `c9facc4d37b52f151f305fab82643918a401ba06` |
| `20261025105520` | [`20261025105520_identity_review_audit_actor_role.sql`](./20261025105520_identity_review_audit_actor_role.sql) | #173 | `fc7c15379f68a2f2924ca6e1a2363f1196c996f2` |
| `20261025110908` | [`20261025110908_unified_candidate_master_application.sql`](./20261025110908_unified_candidate_master_application.sql) | #175 | `d8b3fc27843b6e2e640c35eccbd1bf0f2c74585e` |
| `20261025110918` | [`20261025110918_unified_candidate_master_application_rpc.sql`](./20261025110918_unified_candidate_master_application_rpc.sql) | #175 | `2bddc3fceacdc05cf4e63c58f02713bc210a354c` |
| `20261025111050` | [`20261025111050_unified_master_application_source_confidence_guard.sql`](./20261025111050_unified_master_application_source_confidence_guard.sql) | #175 | `811041652a31efff16628e0527408c14eb7db8fc` |
| `20261025111404` | [`20261025111404_candidate_identity_review_private_evidence.sql`](./20261025111404_candidate_identity_review_private_evidence.sql) | #174 | `1c560efc3d7d6fc7221de358669a307cea5746d2` |
| `20261025112103` | [`20261025112103_candidate_identity_review_followup_status.sql`](./20261025112103_candidate_identity_review_followup_status.sql) | #176 | `45128375712ea98220b3cb479335e725df4da398` |
| `20261025112853` | [`20261025112853_master_target_to_application_lifecycle_bridge.sql`](./20261025112853_master_target_to_application_lifecycle_bridge.sql) | #175 | `2b2141403a7ee959636169a0746a73648a0b8411` |
| `20261025113010` | [`20261025113010_master_target_pathway_consistency_guard.sql`](./20261025113010_master_target_pathway_consistency_guard.sql) | #175 | `ebc2581c0ff2102948d51e0ab617a45c9ced8692` |
| `20261025113119` | [`20261025113119_candidate_manual_portal_handoff.sql`](./20261025113119_candidate_manual_portal_handoff.sql) | #175 | `da6c992682ea3b6ae792b7fce38cf0289e1af0d3` |
| `20261025113510` | [`20261025113510_freeze_linked_master_application_targets.sql`](./20261025113510_freeze_linked_master_application_targets.sql) | #175 | `b9f865b0aac961213ebe90ea473c931fe6de1e50` |
| `20261025113726` | [`20261025113726_link_reviewed_documents_to_application_evidence.sql`](./20261025113726_link_reviewed_documents_to_application_evidence.sql) | #175 | `0aa1c1447818f6a4349d3f66a50898e495a2d95f` |
| `20261025113938` | [`20261025113938_verified_submission_and_outcome_workflow.sql`](./20261025113938_verified_submission_and_outcome_workflow.sql) | #175 | `8da91c83290f8ca3ea745b587c8088ce9860dc1a` |
| `20261025114110` | [`20261025114110_lock_document_review_rpc_to_service_role.sql`](./20261025114110_lock_document_review_rpc_to_service_role.sql) | #175 | `19a109662ed085f8c89fc9d7d03e89468aaaa08e` |

| `20261012155326` | [`20261012155326_n03_truth_vault_0001.sql`](./20261012155326_n03_truth_vault_0001.sql) | PR #64 historical branch snapshot `303d692b60f36d6a5f26f6ba45e397d8500b1852` | `a46c8c0e4efda63bb483690767aeed370a429b21` |
| `20261012155332` | [`20261012155332_n04_candidate_core_0002.sql`](./20261012155332_n04_candidate_core_0002.sql) | PR #64 historical branch snapshot `303d692b60f36d6a5f26f6ba45e397d8500b1852` | `b538d630eb47c4eb92a920b70aa6d8fd3366ac45` |
| `20261012155338` | [`20261012155338_n05_document_vault_0003.sql`](./20261012155338_n05_document_vault_0003.sql) | PR #64 historical branch snapshot `303d692b60f36d6a5f26f6ba45e397d8500b1852` | `77bdf37db1edd1eb7a63ecefdfedd99776c516bc` |
| `20261012155345` | [`20261012155345_n06_route_universe_0004.sql`](./20261012155345_n06_route_universe_0004.sql) | PR #64 historical branch snapshot `303d692b60f36d6a5f26f6ba45e397d8500b1852` | `e9ca35a0f54dfd09b932b95d20d16d24e5f12921` |
| `20261012155355` | [`20261012155355_n07_airtable_sync_0005.sql`](./20261012155355_n07_airtable_sync_0005.sql) | PR #64 historical branch snapshot `303d692b60f36d6a5f26f6ba45e397d8500b1852` | `33b810e66f43935c2a82d28fc941432570f18e82` |

## Recovery constraints

- No recovered file is in `db/migrations/` or `supabase/migrations/`; the live migration runner cannot accidentally replay these archive copies.
- A migration name/version mapping is provisional where the historical PR filename timestamp differs from the staging ledger version. The ledger label, source PR, body semantics and live catalog effects still require independent reconciliation.
- The two applied `candidate_application_preparation_readiness_0078` ledger versions are not interchangeable. Their two historical source bodies are now archived separately: version `20261019112452` maps to the 98-line pre-fix body (blob `6f3512d...`); version `20261019112511` maps to the 104-line corrected body (blob `9fdabdde...`).
- The PR #120 fix commit [`f723fbe`](https://github.com/kingsmenportal-ctrl/kingsmen-platform/commit/f723fbe7ac9eb3e3afe15e640d61da433bf1bdb4), timestamped `2026-10-19T11:25:04Z`, adds the composite unique index on `(candidate_application_preparation_items.id, candidate_id)`. This sits between the two ledger versions (`11:24:52` and `11:25:11`) and supports the pre-fix/post-fix mapping.
- Read-only live staging inspection confirms both candidate/tracker and preparation-item composite unique indexes currently exist and are valid/ready. This validates the expected postcondition; it does not prove the exact SQL bytes executed at each migration timestamp because the ledger does not store the source-body checksum.
- Provenance state: **historical source bodies recovered and timeline mapping supported; raw execution checksum unavailable**. Keep this distinction in all release decisions.
- Never use these bodies to recreate a clean baseline until the entire ledger is reconciled in order and the resulting schema is validated on a disposable staging restore.
