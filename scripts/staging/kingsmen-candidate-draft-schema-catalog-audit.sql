-- Candidate draft schema compatibility inventory.
-- SELECT-only. Run against the confirmed staging project before any migration review.
with target_tables as (
  select unnest(array[
    'candidate_applications',
    'candidate_application_events',
    'candidate_application_draft_answers',
    'candidate_master_profiles',
    'candidate_master_application_targets',
    'candidate_master_application_events',
    'candidate_auth_identity_links'
  ]) as table_name
),
table_state as (
  select t.table_name,
         c.oid is not null as exists,
         coalesce(c.relrowsecurity, false) as rls_enabled,
         coalesce(c.relforcerowsecurity, false) as force_rls
  from target_tables t
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relnamespace = n.oid and c.relname = t.table_name and c.relkind in ('r','p')
),
columns_state as (
  select table_name, jsonb_agg(jsonb_build_object(
    'name', column_name, 'type', data_type, 'nullable', is_nullable,
    'default', column_default
  ) order by ordinal_position) as columns
  from information_schema.columns
  where table_schema='public' and table_name in (select table_name from target_tables)
  group by table_name
),
constraints_state as (
  select rel.relname as table_name,
         jsonb_agg(jsonb_build_object('name', con.conname, 'type', con.contype,
          'definition', pg_get_constraintdef(con.oid)) order by con.conname) as constraints
  from pg_constraint con
  join pg_class rel on rel.oid=con.conrelid
  join pg_namespace ns on ns.oid=rel.relnamespace
  where ns.nspname='public' and rel.relname in (select table_name from target_tables)
  group by rel.relname
),
policies_state as (
  select tablename as table_name,
    jsonb_agg(jsonb_build_object('name', policyname, 'command', cmd,
      'roles', roles, 'using', qual, 'check', with_check) order by policyname) as policies
  from pg_policies where schemaname='public' and tablename in (select table_name from target_tables)
  group by tablename
),
routines_state as (
  select n.nspname as schema_name, p.proname as routine_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer, p.proconfig as settings,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','kingsmen_security')
    and p.proname in ('get_candidate_application_draft','save_candidate_application_draft',
      'current_verified_kingsmen_candidate_id','current_authenticated_candidate_id')
)
select 'table' as section, ts.table_name as object_name,
       jsonb_build_object('exists',ts.exists,'rls_enabled',ts.rls_enabled,'force_rls',ts.force_rls,
        'columns',cs.columns,'constraints',coalesce(cons.constraints,'[]'::jsonb),
        'policies',coalesce(ps.policies,'[]'::jsonb)) as details
from table_state ts left join columns_state cs using(table_name)
left join constraints_state cons using(table_name) left join policies_state ps using(table_name)
union all
select 'routine', schema_name||'.'||routine_name||'('||arguments||')',
  jsonb_build_object('security_definer',security_definer,'settings',settings,
   'anon_execute',anon_execute,'authenticated_execute',authenticated_execute)
from routines_state
union all
select 'migration_ledger', version||':'||name,
  jsonb_build_object('statement_count',cardinality(statements),'statement_bytes',length(statements[1]),
   'statement_md5',md5(statements[1]))
from supabase_migrations.schema_migrations
where name ilike '%candidate%application%' or name ilike '%draft%'
   or name ilike '%unified%master%'
order by 1,2;
