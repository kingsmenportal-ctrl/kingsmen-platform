-- READ-ONLY diagnostic queries for the controlled migration provenance review.
-- Run only with an authorized read-only role against the target project.
-- Do not run UPDATE/DELETE against supabase_migrations.schema_migrations.
-- Capture output as restricted release evidence; it can contain migration SQL.

-- 1. Ledger rows and repeated names/versions.
select count(*) as ledger_rows,
       count(distinct version) as distinct_versions,
       count(*) - count(distinct version) as duplicate_version_rows,
       count(distinct name) as distinct_names
from supabase_migrations.schema_migrations;

select version, name, created_by, idempotency_key,
       cardinality(statements) as statement_count,
       cardinality(rollback) as rollback_statement_count
from supabase_migrations.schema_migrations
order by version, name;

select name, count(*) as copies,
       array_agg(version order by version) as versions,
       array_agg(created_by order by version) as creators
from supabase_migrations.schema_migrations
group by name
having count(*) > 1
order by name;

-- 2. Exact ledger body inspection for the two known repeated migration names.
select version, name, created_by, idempotency_key, statements, rollback
from supabase_migrations.schema_migrations
where name in (
  'candidate_application_preparation_readiness_0078',
  'seed_verified_labour_vacancy_deadlines_0093'
)
order by name, version;

-- 3. Catalog definitions and columns for all schemas (identity/campus/alias/evidence).
select table_schema, table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
from information_schema.columns
where table_schema not in ('pg_catalog', 'information_schema')
  and (
    table_name ilike '%institution%' or table_name ilike '%provider%'
    or table_name ilike '%campus%' or table_name ilike '%alias%'
    or table_name ilike '%source%authorit%' or table_name ilike '%evidence%'
    or table_name ilike '%opportunit%' or table_name ilike '%programme%'
    or table_name ilike '%migration%'
  )
order by table_schema, table_name, ordinal_position;

-- 4. Constraints and indexes for those tables.
select ns.nspname as schema_name, tbl.relname as table_name,
       con.conname as constraint_name, con.contype as constraint_type,
       pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class tbl on tbl.oid = con.conrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname not in ('pg_catalog', 'information_schema')
  and (tbl.relname ilike '%institution%' or tbl.relname ilike '%provider%'
       or tbl.relname ilike '%campus%' or tbl.relname ilike '%alias%'
       or tbl.relname ilike '%source%authorit%' or tbl.relname ilike '%evidence%'
       or tbl.relname ilike '%opportunit%' or tbl.relname ilike '%programme%')
order by ns.nspname, tbl.relname, con.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname not in ('pg_catalog', 'information_schema')
  and (tablename ilike '%institution%' or tablename ilike '%provider%'
       or tablename ilike '%campus%' or tablename ilike '%alias%'
       or tablename ilike '%source%authorit%' or tablename ilike '%evidence%'
       or tablename ilike '%opportunit%' or tablename ilike '%programme%')
order by schemaname, tablename, indexname;

-- 5. RLS and policies for those tables.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and c.relkind in ('r','p')
  and (c.relname ilike '%institution%' or c.relname ilike '%provider%'
       or c.relname ilike '%campus%' or c.relname ilike '%alias%'
       or c.relname ilike '%source%authorit%' or c.relname ilike '%evidence%'
       or c.relname ilike '%opportunit%' or c.relname ilike '%programme%')
order by n.nspname, c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname not in ('pg_catalog', 'information_schema')
  and (tablename ilike '%institution%' or tablename ilike '%provider%'
       or tablename ilike '%campus%' or tablename ilike '%alias%'
       or tablename ilike '%source%authorit%' or tablename ilike '%evidence%'
       or tablename ilike '%opportunit%' or tablename ilike '%programme%')
order by schemaname, tablename, policyname;

-- 6. Catalogue baseline. Reconcile legacy tables separately; never merge by name alone.
select 'opportunity_providers' as table_name, count(*) as row_count from public.opportunity_providers
union all select 'opportunity_programmes', count(*) from public.opportunity_programmes
union all select 'opportunity_source_authorities', count(*) from public.opportunity_source_authorities
union all select 'source_authorities', count(*) from public.source_authorities
union all select 'organisations', count(*) from public.organisations;
