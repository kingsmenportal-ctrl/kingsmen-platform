-- N07 staging runtime assertions. Read-only: this block does not enqueue or mutate jobs.
-- Run in the Supabase SQL Editor against staging after applying migration 0020.
do $$
declare
  v_missing text;
begin
  select string_agg(required_name, ', ')
    into v_missing
  from unnest(array[
    'airtable_sync_outbox_attempts_nonnegative_chk',
    'airtable_sync_outbox_max_attempts_chk',
    'airtable_sync_outbox_payload_object_chk',
    'idx_airtable_outbox_claimable',
    'idx_airtable_outbox_expired_lease',
    'idx_airtable_outbox_target_status'
  ]) as required(required_name)
  where not (
    exists (select 1 from pg_constraint c where c.conname = required_name)
    or exists (select 1 from pg_class i join pg_namespace n on n.oid=i.relnamespace
               where n.nspname='public' and i.relname = required_name and i.relkind='i')
  );
  if v_missing is not null then raise exception 'N07 staging assertion failed; missing constraint/index: %', v_missing; end if;

  if has_table_privilege('anon', 'public.airtable_sync_outbox', 'SELECT')
     or has_table_privilege('anon', 'public.airtable_sync_outbox', 'INSERT')
     or has_table_privilege('anon', 'public.airtable_sync_outbox', 'UPDATE')
     or has_table_privilege('authenticated', 'public.airtable_sync_outbox', 'SELECT')
     or has_table_privilege('authenticated', 'public.airtable_sync_outbox', 'INSERT')
     or has_table_privilege('authenticated', 'public.airtable_sync_outbox', 'UPDATE') then
    raise exception 'N07 staging assertion failed; browser roles have outbox table privileges';
  end if;

  if not has_table_privilege('service_role', 'public.airtable_sync_outbox', 'SELECT')
     or not has_table_privilege('service_role', 'public.airtable_sync_outbox', 'INSERT')
     or not has_table_privilege('service_role', 'public.airtable_sync_outbox', 'UPDATE') then
    raise exception 'N07 staging assertion failed; service_role lacks required outbox privileges';
  end if;

  if exists (
    select 1 from (values
      ('n07_enqueue_airtable_mirror', 6),
      ('n07_claim_airtable_mirror_batch', 2),
      ('n07_finish_airtable_mirror_job', 5)
    ) as required(proname, arg_count)
    where not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=required.proname and p.pronargs=required.arg_count
        and p.prosecdef=false
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and not has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and has_function_privilege('service_role', p.oid, 'EXECUTE')
    )
  ) then
    raise exception 'N07 staging assertion failed; RPC missing or function grants/security mode are incorrect';
  end if;

  raise notice 'N07 staging assertions passed: constraints/indexes, browser-role denial, service-role access, and RPC execution grants.';
end $$;
