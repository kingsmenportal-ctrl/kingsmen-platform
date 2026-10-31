# Institutional staging inventory audit — 2026-10-31

## Purpose and boundary

Read-only snapshot of the existing Supabase staging route tables. This is **not** evidence that all South African institutions are connected, that any opportunity is open, or that an application can be submitted end-to-end.

- Project: `kingsmen-portal-staging`
- Migration ledger newest entry: `20261029193124 / candidate_self_service_profile_bootstrap_0095`
- Provider rows: 3
- Programme rows: 8
- Candidate rows: 2, both currently flagged `is_active=true`
- Backup/restore drill register rows: 0

## Inventory findings (live query)

| Provider key | Canonical name | Programme rows | Rows marked OPEN | Rows marked CLOSED | Route rows marked VERIFIED | Interpretation |
|---|---|---:|---:|---:|---:|---|
| `cao_official` | Central Applications Office | 1 | 0 | 0 | 1 | Route anchor only; `MANUAL_CHECK_REQUIRED`. |
| `labour_department_vacancies` | Department of Employment and Labour — Official Vacancies | 6 | 0 | 6 | 6 | The six vacancy rows have closing date 2026-10-30 and were auto-closed on 2026-10-31. Do not expose as open; only reopen after fresh authoritative source verification. |
| `nsfas_official` | National Student Financial Aid Scheme | 1 | 0 | 0 | 1 | Route anchor only; `MANUAL_CHECK_REQUIRED`. |

**No current programme rows are marked OPEN.** Provider-level `verification_status=VERIFIED` and programme `route_status=VERIFIED` are stored metadata, not proof of a live connector, successful current route test, provider authorization, monitoring or candidate end-to-end submission.

The labour vacancy rows have authoritative-source metadata and are closed because their stated deadline is in the past. Candidate eligibility, qualifications, location and application instructions must still be evaluated from each official advert if a current listing is later re-verified.

## Migration and change-control findings

- The migration ledger's latest recorded entry is `candidate_self_service_profile_bootstrap_0095`.
- Migration versions 0096–0098 and source-import migrations 0099–0106 are not recorded in the ledger.
- The CAO bridge's structural objects are already present in staging: candidate parent column, composite parent FK, exactly-one-parent check and three candidate RPCs. Actual deployment provenance is unknown; do not rerun the migration blindly or invent a ledger row.
- The active-candidate-cap enforcement trigger, function and index for migration 0098 are absent. Two candidates currently have `is_active=true`; the configured 500 cap is not proven to be enforced.
- The `backup_restore_drills` evidence table has zero rows. A protected backup/restore drill and change authorization remain mandatory before schema changes or source imports.
- Migration history includes two distinct ledger versions both named `seed_verified_labour_vacancy_deadlines_0093`. Reconcile their migration contents and provenance as part of drift review; do not delete or rewrite ledger rows without approved evidence.

## Reproducible read-only audit query

```sql
select
  p.provider_key,
  p.provider_name,
  p.provider_type,
  p.verification_status as provider_verification_status,
  p.public_safe,
  count(r.id)::int as programme_rows,
  count(r.id) filter (where r.availability_status = 'OPEN')::int as rows_marked_open,
  count(r.id) filter (where r.availability_status = 'CLOSED')::int as rows_marked_closed,
  count(r.id) filter (where r.route_status = 'VERIFIED')::int as rows_marked_route_verified
from public.route_providers p
left join public.route_programmes r on r.provider_id = p.id
group by p.provider_key, p.provider_name, p.provider_type,
         p.verification_status, p.public_safe
order by p.provider_key;
```

```sql
select count(*)::int as recorded_restore_drills
from public.backup_restore_drills;

select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 25;
```

## Required sequence

1. Obtain independent reviewers for PRs #232, #233, #238, #239 and #242. The PR author must not self-approve.
2. Create a verified encrypted backup in restricted storage and complete a disposable staging restore drill. Record RPO/RTO, schema/object and row counts, checksums, restore evidence and founder signoff; never commit archives or candidate PII to Git.
3. Complete migration-owner/security review and formal change approval. Reconcile migration 0096 against existing CAO objects, 0097 client grants, 0098 capacity enforcement, duplicate 0093 history and source imports 0099–0106.
4. Import only the reviewed canonical provider/source inventory using idempotent SQL and evidence/count/checksum postflight checks.
5. Verify every provider's official identity/domain, precise application route, handoff method, connector authorization/terms, passing current route test, monitoring and failure handling.
6. Verify each opportunity's official source, current status, deadline/cutoff, eligibility and required documents before it becomes candidate-visible as open.
7. Integrate the readiness evaluator into canonical records and authenticated candidate preflight; test Candidate A/B isolation, consent, reviewer audit and the separation of candidate-reported submission, provider receipt and provider-confirmed outcome.
8. Verify build, deploy commit, public route and authenticated staging journey against the exact deployed revision.

## Release decision

**Directory and integration foundation only.** No live national connected-institution network is proven. No migration application, provider import or production deployment is authorized by this audit.
