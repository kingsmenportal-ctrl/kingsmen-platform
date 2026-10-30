# CAO 0096 live-schema provenance reconciliation

Status: **source proposal prepared; not applied**  
Production ready: **false**

## Why this exists

A read-only staging inspection on 30 October 2026 found that the live schema already contains the CAO choice bridge contract from db/migrations/0096_candidate_application_cao_choice_bridge.sql, while the Supabase migration ledger still reports its latest entry as 20261029193124 candidate_self_service_profile_bootstrap_0095.

The observed live objects include:
- nullable legacy cao_choice_items.application_id and UUID candidate_application_id;
- owner-bound composite foreign key and exactly-one-parent check;
- the two partial unique parent/choice indexes plus candidate-parent lookup index;
- CAO_CHOICES_UPDATED in the candidate application event allow-list;
- all three CAO list/get/save RPCs with fixed search_path, verified Auth-to-candidate identity checks, and current profile-processing consent on writes.

The original structural migration application time, actor and execution path are **unknown**. A later coordinator rollback-only SQL probe did not persist any of those objects. Do not attribute the live change to that probe or to an unverified actor.

## Proposed reconciliation

The new timestamped migration supabase/migrations/20261030150000_reconcile_cao_choice_bridge_0096_schema_drift.sql is a **guard-only, read-only assertion**. It performs no schema DDL or data DML. It fails closed unless the expected live CAO schema, indexes, constraints, RPC security settings and role grants are already present.

When independently reviewed and formally approved, the migration runner can execute this assertion and record the actual reconciliation timestamp in the Supabase migration ledger. That row documents when the existing schema was checked; it does not backdate the original 0096 DDL or invent its original provenance.

## Safety conditions

- Do not rerun or recreate 0096 structural DDL.
- Do not manually insert a fabricated row into supabase_migrations.schema_migrations.
- Do not treat this assertion as backup/restore proof or as candidate A/B E2E.
- Run only after independent migration-owner review, approved backup/restore/change control, and exact live-schema inspection.
- If any expected object or permission differs, the assertion aborts and the drift must be reconciled before release.

## Source validation

node scripts/validators/validate-cao-0096-provenance-adoption.mjs

The source validator proves that the adoption migration is assertion-only and includes the expected security/provenance checks. It does not connect to staging or apply the migration.
