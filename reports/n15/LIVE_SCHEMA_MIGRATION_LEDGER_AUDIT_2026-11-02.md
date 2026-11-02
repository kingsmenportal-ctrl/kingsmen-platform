# Live staging schema and migration-ledger audit — 2026-11-02

## Scope and safety boundary

Read-only inspection of Supabase staging project `euhubhhnumtibbyufghm`. No SQL writes, migration application, restore, seed import, provider connection, or production action was performed. This is an evidence snapshot, not change-control approval.

## Observed migration ledger

- Supabase migration API returned **130 migration records**.
- Direct read of `supabase_migrations.schema_migrations` returned **130 rows, 130 distinct version values, 0 duplicate version values**.
- The ledger schema contains `version`, `statements`, `name`, `created_by`, `idempotency_key`, and `rollback`.
- Two migration *names* occur twice under different version values:
  - `candidate_application_preparation_readiness_0078`: `20261019112452`, `20261019112511`.
  - `seed_verified_labour_vacancy_deadlines_0093`: `20261029180632`, `20261029180642`.
- These are not duplicate version keys, but they are migration-provenance ambiguities that require repository-to-ledger reconciliation. Do not delete, rename, mark-repaired, or reapply either entry until the exact repository files, statement arrays, checksums/commit ancestry, and live schema effects have been compared and independently reviewed.

## Observed catalogue baseline

| Table | Live row count |
|---|---:|
| `public.opportunity_providers` | 0 |
| `public.opportunity_programmes` | 0 |
| `public.opportunity_source_authorities` | 38 |
| `public.source_authorities` | 38 |
| `public.organisations` | 0 |

The live `opportunity_providers` table currently exposes only `id`, `provider_ref`, `provider_name`, `provider_type`, `sector`, `province`, `official_url`, `accreditation_status`, `source_confidence`, `safe_to_recommend`, `evidence_refs`, and timestamps. No dedicated alias, campus/branch relationship, or normalized source-assertion table was found in the sampled set of table names. Do not assume the proposed canonical identity contract is already implemented in the database.

## Immediate required reconciliation work

1. Export the full ordered migration ledger, including each `statements` and `rollback` array, with restricted access and integrity hash.
2. Compare every ledger row with the exact migration files in the intended release commit. Report: file-only migrations, ledger-only migrations, version/name mismatches, statement/hash mismatches, repeated semantic migrations, and migration files with no ledger record.
3. For the two repeated names above, determine whether the second record is an intentional corrective migration, a duplicated migration body, or a provenance error. Produce a reviewed reconciliation decision; never rewrite historical evidence in place.
4. Inspect the schema definitions, constraints, indexes, RLS policies, grants, triggers and dependent functions for the live catalogue tables and all candidate identity-related tables. The absence of a table in the sampled names list is not proof of absence from every schema.
5. Only after independent review, create a forward-only corrective migration with explicit preconditions, safe rollback/restore plan, and test evidence. Do not apply it before backup/restore and approval gates pass.

## Protected backup/restore drill — NOT COMPLETED

Required evidence before any staging migration/import:
- Record provider backup/PITR capability and retention; identify the protected recovery point and exact target environment.
- Obtain written change-control approval, named operator/reviewer, impact window, and restore acceptance criteria.
- Restore to an isolated non-production target, not over staging or production.
- Verify restored database identity, schema/migration ledger, critical row counts, RLS/policies/grants, storage references, and application smoke tests.
- Record start/end times, recovery-point timestamp, observed recovery time, redacted logs, discrepancies, reviewer sign-off, and cleanup.
- Abort if restore permissions, target isolation, or evidence capture cannot be proved.

No claim of a successful backup or restore is made by this report.

## Import reconciliation — NOT COMPLETED

The institution seed PR is authored but not applied. Before import, provide per-source manifests with source URL, authority, publication/effective date, retrieval timestamp, source hash/snapshot, parser version, raw row count, normalized row count, exact duplicates, likely duplicates, unresolved identity rows, rejected rows, and reason codes. Preserve legal statuses separately (registered, provisional, lapsed, cancelled, unresolved). Do not merge on fuzzy name alone.

Programme rows must remain distinct from time-sensitive opportunities. An opportunity may be published as open only with individually reviewed source evidence, official application destination, applicable deadline/window, eligibility criteria, and a freshness check. Provider integration is separately authorized per provider and must not be inferred from an official URL.

## Security/release gates — OPEN

- Protected backup/restore drill and signed change-control approval.
- Independent review of migration provenance and canonical identity/evidence schema.
- CI checks on the exact proposed release commit.
- Authenticated Candidate A/B tests proving own-record access and cross-candidate denial.
- Reviewer-role tests proving least privilege and denied candidate/client writes.
- Evidence of RLS, grants, storage access, and API behavior in staging.
- Founder approval after review, followed by a controlled production promotion and exact deployed-SHA verification.

## Status

**Audit:** read-only observations captured.  
**Database changes:** none.  
**Import status:** not applied.  
**Backup/restore:** not proven.  
**CI:** not proven green for this branch head at audit time.  
**Authenticated isolation/reviewer tests:** not run/proven by this audit.  
**Production promotion:** blocked pending all gates above.
