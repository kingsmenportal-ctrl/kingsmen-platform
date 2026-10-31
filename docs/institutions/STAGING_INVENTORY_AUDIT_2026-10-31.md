# Institutional staging inventory audit — 2026-10-31

## Purpose and boundary

This is a read-only point-in-time inventory of the existing Supabase staging route tables. It is **not** evidence that all South African institutions are connected, that any opportunity is currently open, or that an application can be submitted end-to-end.

Project: `kingsmen-portal-staging`  
Database migration ledger last recorded: `candidate_self_service_profile_bootstrap_0095`  
Active provider rows: 3  
Programme rows: 8  
Backup/restore drill rows: 0

## Inventory findings

| Provider key | Canonical name | Provider rows | Programme rows | Marked OPEN | Route rows marked VERIFIED | Interpretation |
|---|---|---:|---:|---:|---:|---|
| `cao_official` | Central Applications Office | 1 | 1 | 0 | 1 | Directory/route metadata exists; no programme row currently marked OPEN. |
| `labour_department_vacancies` | Department of Employment and Labour — Official Vacancies | 1 | 6 | 6 | 6 | Candidate-facing OPEN labels exist; each listing still requires current authoritative source, deadline/cutoff, eligibility and document checks. |
| `nsfas_official` | National Student Financial Aid Scheme | 1 | 1 | 0 | 1 | Directory/route metadata exists; no programme row currently marked OPEN. |

The provider-level `verification_status=VERIFIED` and programme `route_status=VERIFIED` values are stored metadata, not a substitute for fresh per-route evidence, successful route tests, connector authorization, monitoring, or candidate journey verification. The six labour listing rows must not be promoted to verified current opportunities solely because `availability_status='OPEN'`.

## Reproducible read-only audit query

Run in the Supabase SQL editor against staging. It does not modify data.

```sql
select
  p.provider_key,
  p.provider_name,
  p.provider_type,
  p.verification_status as provider_verification_status,
  p.public_safe,
  count(r.id)::int as programme_rows,
  count(*) filter (where r.availability_status = 'OPEN')::int as rows_marked_open,
  count(*) filter (where r.route_status = 'VERIFIED')::int as rows_marked_route_verified
from public.route_providers p
left join public.route_programmes r on r.provider_id = p.id
group by
  p.provider_key,
  p.provider_name,
  p.provider_type,
  p.verification_status,
  p.public_safe
order by p.provider_key;
```

Check the backup/restore evidence register separately:

```sql
select count(*)::int as completed_or_recorded_restore_drills
from public.backup_restore_drills;
```

## Required next steps

1. Complete an encrypted, restricted-storage backup and a disposable restore drill. Record restore evidence and founder signoff; never put a production/staging data archive or candidate PII in Git.
2. Obtain independent review and formal change authorization before applying migrations 0096–0098 or importing provider inventory 0099–0106. Reconcile live schema versus migration ledger rather than rerunning pre-existing DDL.
3. For each canonical provider, establish the official legal identity/domain, exact route and route scope, approved connector/handoff, access/terms review, current passing route test, monitoring, and failure handoff.
4. For each programme/opportunity, verify authoritative source identity, current status, deadline/cutoff, eligibility and required documents before making it candidate-visible as open.
5. Integrate the readiness evaluator into canonical records and authenticated candidate preflight; prove Candidate A/B isolation, reviewer audit, provider receipt evidence, and the deployed commit in end-to-end tests.

## Release decision

**Status: directory and integration foundation only.** Not a connected national institution network. No provider inventory import, migration application, or production deployment is authorized by this audit.
