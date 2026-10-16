-- Read-only preflight for the candidate document storage-path index.
-- Run against staging and the isolated restore database; do not modify schema here.
with expected as (
  select
    'public.document_files_storage_bucket_path_key'::text as expected_name,
    'public.document_files'::regclass as expected_table,
    array['storage_bucket','storage_path']::text[] as expected_columns
), actual as (
  select
    ns.nspname || '.' || idx.relname as qualified_name,
    i.indrelid as table_oid,
    i.indisunique as is_unique,
    i.indisvalid as is_valid,
    array_agg(a.attname order by k.ordinality) as columns,
    pg_get_indexdef(i.indexrelid) as definition
  from pg_index i
  join pg_class idx on idx.oid = i.indexrelid
  join pg_namespace ns on ns.oid = idx.relnamespace
  join lateral unnest(i.indkey) with ordinality as k(attnum, ordinality) on true
  join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
  where ns.nspname = 'public'
    and idx.relname = 'document_files_storage_bucket_path_key'
  group by ns.nspname, idx.relname, i.indrelid, i.indisunique, i.indisvalid, i.indexrelid
)
select
  e.expected_name,
  a.qualified_name,
  a.is_unique,
  a.is_valid,
  a.columns,
  a.definition,
  case
    when a.qualified_name is null then 'MISSING'
    when a.table_oid <> e.expected_table then 'WRONG_TABLE'
    when not a.is_unique or not a.is_valid then 'NOT_VALID_UNIQUE'
    when a.columns is distinct from e.expected_columns then 'WRONG_COLUMNS'
    else 'MATCH'
  end as verification_status
from expected e
left join actual a on a.qualified_name = e.expected_name;

-- A MATCH is required on both staging and restore. Also inspect duplicates before
-- index creation; this query is read-only and should return zero rows.
select storage_bucket, storage_path, count(*) as duplicate_count
from public.document_files
group by storage_bucket, storage_path
having count(*) > 1;
