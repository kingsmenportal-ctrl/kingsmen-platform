-- Kingsmen staging backend live-catalog audit (READ ONLY).
-- Run with a read-only-capable Supabase SQL session. Does not alter schema/data.
-- Export each result set for normalized comparison against repository source.

-- 1. Migration ledger: retain both version and label; duplicate labels are significant.
select version, name
from supabase_migrations.schema_migrations
order by version, name;

-- 2. Tables/views, RLS flags, and owners.
select n.nspname as schema_name, c.relname as object_name, c.relkind,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
       pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','private','kingsmen_security')
  and c.relkind in ('r','p','v','m','f')
order by 1,2;

-- 3. Column definitions, defaults, generated/identity flags and nullability.
select table_schema, table_name, ordinal_position, column_name, data_type,
       udt_schema, udt_name, is_nullable, column_default,
       is_identity, identity_generation, is_generated, generation_expression
from information_schema.columns
where table_schema in ('public','private','kingsmen_security')
order by table_schema, table_name, ordinal_position;

-- 4. Constraints, including definitions and validation state.
select ns.nspname as schema_name, cls.relname as table_name, con.conname,
       con.contype, con.convalidated, con.condeferrable, con.condeferred,
       pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class cls on cls.oid = con.conrelid
join pg_namespace ns on ns.oid = cls.relnamespace
where ns.nspname in ('public','private','kingsmen_security')
order by 1,2,3;

-- 5. Indexes and validity/readiness. Definitions are compared verbatim after normalization.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname in ('public','private','kingsmen_security')
order by schemaname, tablename, indexname;

select ns.nspname as schema_name, tbl.relname as table_name, idx.relname as index_name,
       i.indisunique, i.indisprimary, i.indisvalid, i.indisready,
       pg_get_indexdef(i.indexrelid) as definition,
       pg_get_expr(i.indpred, i.indrelid, true) as predicate
from pg_index i
join pg_class tbl on tbl.oid = i.indrelid
join pg_class idx on idx.oid = i.indexrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname in ('public','private','kingsmen_security')
order by 1,2,3;

-- 6. RLS policy roles, commands, permissiveness, USING and WITH CHECK.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','private','kingsmen_security')
order by schemaname, tablename, policyname;

-- 7. Triggers and normalized trigger bodies.
select ns.nspname as schema_name, cls.relname as table_name, trg.tgname,
       trg.tgenabled, pg_get_triggerdef(trg.oid, true) as definition,
       pg_get_userbyid(proc.proowner) as function_owner,
       proc.oid::regprocedure::text as function_signature
from pg_trigger trg
join pg_class cls on cls.oid = trg.tgrelid
join pg_namespace ns on ns.oid = cls.relnamespace
join pg_proc proc on proc.oid = trg.tgfoid
where not trg.tgisinternal
  and ns.nspname in ('public','private','kingsmen_security')
order by 1,2,3;

-- 8. Functions: body, language, volatility, SECURITY DEFINER, fixed search_path, ACL.
select ns.nspname as schema_name, proc.oid::regprocedure::text as signature,
       lang.lanname as language, proc.provolatile, proc.prosecdef,
       proc.proconfig, pg_get_userbyid(proc.proowner) as owner,
       coalesce(proc.proacl::text, 'NULL (default ACL)') as acl,
       pg_get_functiondef(proc.oid) as definition
from pg_proc proc
join pg_namespace ns on ns.oid = proc.pronamespace
join pg_language lang on lang.oid = proc.prolang
where ns.nspname in ('public','private','kingsmen_security')
order by 1,2;

-- 9. Table/sequence/function grants. Compare against intended least-privilege grants.
select table_schema, table_name, grantee, privilege_type, is_grantable
from information_schema.table_privileges
where table_schema in ('public','private','kingsmen_security')
order by table_schema, table_name, grantee, privilege_type;

select routine_schema, routine_name, specific_name, grantee, privilege_type, is_grantable
from information_schema.routine_privileges
where routine_schema in ('public','private','kingsmen_security')
order by routine_schema, specific_name, grantee, privilege_type;

-- 10. Candidate data counts are operational context only; never infer identity links by email.
select 'candidates' as table_name, count(*) as row_count from public.candidates
union all
select 'candidate_profiles', count(*) from public.candidate_profiles
union all
select 'applications', count(*) from public.applications
union all
select 'candidate_applications', count(*) from public.candidate_applications
union all
select 'candidate_master_application_targets', count(*) from public.candidate_master_application_targets;
