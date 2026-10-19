# Kingsmen foreign-key index hardening — migration and verification

## Scope and current baseline

Supabase performance advisor for staging project `euhubhhnumtibbyufghm` reported **14 unindexed single-column foreign keys** at 2026-10-19T12:20Z. Read-only catalog inspection confirmed the FK columns below had no existing valid leading-column index. Existing indexes on other columns (for example application ID, candidate ID, queue status, and created-at) do not cover these FK columns.

| # | Table | FK column | Proposed index |
|---:|---|---|---|
| 1 | `candidate_application_events` | `candidate_id` | `candidate_application_events_candidate_id_idx` |
| 2 | `candidate_application_evidence` | `candidate_id` | `candidate_application_evidence_candidate_id_idx` |
| 3 | `candidate_application_submission_jobs` | `opportunity_id` | `candidate_application_submission_jobs_opportunity_id_idx` |
| 4 | `candidate_applications` | `opportunity_id` | `candidate_applications_opportunity_id_idx` |
| 5 | `candidate_communications` | `outcome_id` | `candidate_communications_outcome_id_idx` |
| 6 | `candidate_follow_up_tasks` | `application_id` | `candidate_follow_up_tasks_application_id_idx` |
| 7 | `candidate_follow_up_tasks` | `communication_id` | `candidate_follow_up_tasks_communication_id_idx` |
| 8 | `candidate_follow_up_tasks` | `outcome_id` | `candidate_follow_up_tasks_outcome_id_idx` |
| 9 | `candidate_identity_review_requests` | `reviewed_by` | `candidate_identity_review_requests_reviewed_by_idx` |
| 10 | `candidate_outcomes` | `evidence_id` | `candidate_outcomes_evidence_id_idx` |
| 11 | `candidate_outcomes` | `opportunity_id` | `candidate_outcomes_opportunity_id_idx` |
| 12 | `candidate_refund_requests` | `order_id` | `candidate_refund_requests_order_id_idx` |
| 13 | `candidate_saved_opportunities` | `opportunity_id` | `candidate_saved_opportunities_opportunity_id_idx` |
| 14 | `candidate_service_orders` | `package_id` | `candidate_service_orders_package_id_idx` |

The migration is index-only. It does not modify rows, foreign-key constraints, RLS, policies, grants, credentials, or deployment settings. Index creation is idempotent by name, and a postflight DO block fails the migration unless all 14 named indexes are valid, ready, non-partial, and have the intended FK column as their leading key.

## Before applying — capture baseline

Run the following read-only SQL against the target database and save the output with the release evidence. This reproduces the 14-column inventory and reports whether a valid leading-key index exists at the time of execution.

```sql
with targets(table_name, column_name) as (values
 ('candidate_application_events','candidate_id'),
 ('candidate_application_evidence','candidate_id'),
 ('candidate_application_submission_jobs','opportunity_id'),
 ('candidate_applications','opportunity_id'),
 ('candidate_communications','outcome_id'),
 ('candidate_follow_up_tasks','application_id'),
 ('candidate_follow_up_tasks','communication_id'),
 ('candidate_follow_up_tasks','outcome_id'),
 ('candidate_identity_review_requests','reviewed_by'),
 ('candidate_outcomes','evidence_id'),
 ('candidate_outcomes','opportunity_id'),
 ('candidate_refund_requests','order_id'),
 ('candidate_saved_opportunities','opportunity_id'),
 ('candidate_service_orders','package_id')
)
select t.table_name, t.column_name,
       exists (
         select 1
         from pg_class tbl
         join pg_namespace ns on ns.oid=tbl.relnamespace
         join pg_attribute a on a.attrelid=tbl.oid and a.attname=t.column_name
         join pg_index i on i.indrelid=tbl.oid
         where ns.nspname='public' and tbl.relname=t.table_name
           and i.indisvalid and i.indisready and i.indpred is null
           and i.indkey[0]=a.attnum
       ) as has_valid_leading_index
from targets t
order by t.table_name, t.column_name;
```

Expected baseline from the 2026-10-19 advisor/catalog snapshot: 14 rows with `has_valid_leading_index = false`. Re-capture before applying; do not assume the baseline has not changed.

## After applying — verify database state

1. Re-run the baseline query. All 14 rows must return `true`.
2. Run Supabase performance advisor again. The `unindexed_foreign_keys` finding count should decrease by 14, ideally to zero; if it does not, investigate the exact remaining findings instead of suppressing the advisor.
3. Query index definitions and validity:

```sql
select tbl.relname as table_name, ix.relname as index_name,
       i.indisvalid, i.indisready, i.indpred is null as non_partial,
       pg_get_indexdef(i.indexrelid) as index_definition
from pg_index i
join pg_class tbl on tbl.oid=i.indrelid
join pg_namespace ns on ns.oid=tbl.relnamespace
join pg_class ix on ix.oid=i.indexrelid
where ns.nspname='public'
  and ix.relname in (
    'candidate_application_events_candidate_id_idx',
    'candidate_application_evidence_candidate_id_idx',
    'candidate_application_submission_jobs_opportunity_id_idx',
    'candidate_applications_opportunity_id_idx',
    'candidate_communications_outcome_id_idx',
    'candidate_follow_up_tasks_application_id_idx',
    'candidate_follow_up_tasks_communication_id_idx',
    'candidate_follow_up_tasks_outcome_id_idx',
    'candidate_identity_review_requests_reviewed_by_idx',
    'candidate_outcomes_evidence_id_idx',
    'candidate_outcomes_opportunity_id_idx',
    'candidate_refund_requests_order_id_idx',
    'candidate_saved_opportunities_opportunity_id_idx',
    'candidate_service_orders_package_id_idx'
  )
order by tbl.relname, ix.relname;
```

Attach before/after SQL output and the post-migration advisor response to the PR/release evidence. The SQL postflight inside the migration is a fail-fast structural assertion, not a substitute for the post-apply advisor check.

## Release boundary

The migration has **not** been applied to staging or production by this PR. No live after-state is claimed. Apply only after migration review/approval and through the repository's normal migration process. Live RLS role-isolation, authenticated candidate/reviewer journey, Netlify deployment identity, and post-deployment request evidence remain separate release gates; FK index work cannot satisfy or waive them.

## Source validation

Run `npm run db:validate:fk-index-hardening`. This validates the migration's 14 definitions and scope; it is deliberately not represented as live database verification.
