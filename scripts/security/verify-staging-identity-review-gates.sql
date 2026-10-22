-- Read-only staging proof for candidate identity/reviewer security.
-- Run against staging with an operator role that can read the catalog.
-- This script does not create users, grant roles, or mutate candidate data.

-- 1. Helper is internal and absent from exposed public schema.
select
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='current_verified_candidate_id'
  ) as private_helper_exists,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='current_verified_candidate_id'
  ) as public_helper_exists;

-- 2. Helper execution/schema privileges. authenticated must retain EXECUTE
-- because existing candidate-owned RLS policies invoke it; anon/PUBLIC must not.
select
  has_schema_privilege('anon','private','USAGE') as anon_private_schema_usage,
  has_schema_privilege('authenticated','private','USAGE') as authenticated_private_schema_usage,
  has_function_privilege('anon','private.current_verified_candidate_id()','EXECUTE') as anon_helper_execute,
  has_function_privilege('authenticated','private.current_verified_candidate_id()','EXECUTE') as authenticated_helper_execute;

-- 3. Dependent policy inventory. The helper should be referenced by the existing
-- candidate ownership policies; show only counts, not policy expressions/data.
select
  count(*) filter (where schemaname='public' and qual ilike '%private.current_verified_candidate_id%') as private_helper_policy_count,
  count(*) filter (where schemaname='public' and (qual ilike '%public.current_verified_candidate_id%' or qual ilike '%current_verified_candidate_id%' and qual not ilike '%private.current_verified_candidate_id%')) as stale_or_unqualified_helper_policy_count
from pg_policies;

-- 4. Backend-only reviewer tables: no direct client SELECT; service_role has SELECT.
select table_name,
  has_table_privilege('anon', format('public.%I',table_name), 'SELECT') as anon_select,
  has_table_privilege('authenticated', format('public.%I',table_name), 'SELECT') as authenticated_select,
  has_table_privilege('service_role', format('public.%I',table_name), 'SELECT') as service_role_select
from (values
  ('candidate_identity_review_audit'),
  ('candidate_identity_review_requests'),
  ('candidate_private_document_reviews')
) as t(table_name)
order by table_name;

-- 5. Reviewer/bootstrap and E2E readiness counts. Counts only; no PII emitted.
select 'auth_users' as check_name, count(*)::bigint as row_count from auth.users
union all select 'active_reviewers', count(*) from public.platform_reviewers where is_active and revoked_at is null
union all select 'identity_review_requests', count(*) from public.candidate_identity_review_requests
union all select 'verified_identity_links', count(*) from public.candidate_auth_identity_links where link_status='VERIFIED' and verified_at is not null
union all select 'private_documents', count(*) from public.candidate_private_documents;
