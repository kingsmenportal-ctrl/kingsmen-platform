# Kingsmen private identity/document review-table access proof

**Observed staging state:** 2026-10-19 12:20 UTC. This is a live, read-only catalog/privilege query against Supabase staging project `euhubhhnumtibbyufghm`. No grants, policies, schema, or rows were changed.

## Verified results

| Table | RLS enabled | anon SELECT | authenticated SELECT | service_role SELECT | RLS policy count |
|---|---:|---:|---:|---:|---:|
| `candidate_identity_review_audit` | true | false | false | true | 0 |
| `candidate_identity_review_requests` | true | false | false | true | 0 |
| `candidate_private_document_reviews` | true | false | false | true | 0 |

The Supabase security advisor's “RLS enabled but no policy” findings for these tables are **not treated as a reason to add broad policies**. RLS is enabled and the Data API roles `anon` and `authenticated` do not have SELECT privilege; the observed service role does. Zero policies therefore preserves the service-only access posture for direct table reads under this grant model. Keep reviewer access in the authorized backend/review workflow; do not grant candidate-facing or public direct table access to silence the advisor.

This result is limited to table SELECT privileges and policy inventory. It does **not** prove reviewer identity authorization, service-token handling, all write privileges, two-candidate RLS isolation, or the complete live candidate/reviewer journey. Those remain separate release gates.

## Reproduction query

Run as an appropriately privileged read-only database session and attach the returned rows to the staging evidence record:

```sql
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', format('%I.%I', n.nspname, c.relname), 'SELECT') as anon_can_select,
       has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'SELECT') as authenticated_can_select,
       has_table_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'SELECT') as service_role_can_select,
       (select count(*) from pg_policies p
        where p.schemaname=n.nspname and p.tablename=c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in (
    'candidate_identity_review_audit',
    'candidate_identity_review_requests',
    'candidate_private_document_reviews'
  )
order by c.relname;
```

Expected reviewed contract: all three rows have RLS enabled, `anon_can_select=false`, `authenticated_can_select=false`, `service_role_can_select=true`, and `policy_count=0`. Re-run the query after any grant, policy, or migration change; do not treat this dated observation as perpetual proof.

## Regression guard

`npm run security:validate:review-tables` checks this documented contract and scans checked-in SQL migrations for direct table-specific SELECT grants or policies targeting these review tables for `PUBLIC`, `anon`, or `authenticated`. It is a source guard, not a substitute for re-running the live query.
