-- N07 durable outbox hardening: authenticated service-only enqueue and leased claims.
-- PostgreSQL remains the sole source of truth. Airtable is an asynchronous mirror only.
begin;

alter table public.airtable_sync_outbox
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists max_attempts integer not null default 3,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists error_code text;

alter table public.airtable_sync_outbox
  drop constraint if exists airtable_sync_outbox_attempts_nonnegative_chk;
alter table public.airtable_sync_outbox
  add constraint airtable_sync_outbox_attempts_nonnegative_chk check (attempts >= 0);
alter table public.airtable_sync_outbox
  drop constraint if exists airtable_sync_outbox_max_attempts_chk;
alter table public.airtable_sync_outbox
  add constraint airtable_sync_outbox_max_attempts_chk check (max_attempts between 1 and 3);
alter table public.airtable_sync_outbox
  drop constraint if exists airtable_sync_outbox_payload_object_chk;
alter table public.airtable_sync_outbox
  add constraint airtable_sync_outbox_payload_object_chk check (jsonb_typeof(payload) = 'object');

create index if not exists idx_airtable_outbox_claimable
  on public.airtable_sync_outbox (next_attempt_at, created_at)
  where status in ('PENDING', 'LOCKED');
create index if not exists idx_airtable_outbox_expired_lease
  on public.airtable_sync_outbox (lease_expires_at)
  where status = 'LOCKED';
create index if not exists idx_airtable_outbox_target_status
  on public.airtable_sync_outbox (sync_target_id, status, updated_at desc);

-- Existing permissive RLS policies are not sufficient as an access boundary.
-- Remove table privileges from browser roles. service_role is the only API role
-- allowed to operate this queue; it bypasses RLS by design in Supabase.
revoke all on table public.airtable_sync_outbox from anon, authenticated;
grant select, insert, update on table public.airtable_sync_outbox to service_role;

create or replace function public.n07_enqueue_airtable_mirror(
  p_idempotency_key text,
  p_sync_target_id uuid,
  p_source_table text,
  p_source_record_id uuid,
  p_operation text,
  p_payload jsonb default '{}'::jsonb
)
returns public.airtable_sync_outbox
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_role text := current_user;
  v_row public.airtable_sync_outbox;
  v_target public.airtable_sync_targets;
begin
  if v_role <> 'service_role' then
    raise exception 'N07 enqueue requires service role' using errcode = '42501';
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 12 or length(p_idempotency_key) > 240 then
    raise exception 'Invalid idempotency key' using errcode = '22023';
  end if;
  if p_source_table is null or p_source_table !~ '^[a-z][a-z0-9_]{0,62}$' then
    raise exception 'Invalid source table identifier' using errcode = '22023';
  end if;
  if p_operation not in ('CREATE_MIRROR', 'UPDATE_MIRROR', 'ARCHIVE_MIRROR', 'UPSERT_MIRROR') then
    raise exception 'Unsupported mirror operation' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload must be a JSON object' using errcode = '22023';
  end if;

  select * into v_target
    from public.airtable_sync_targets
   where id = p_sync_target_id and is_active = true
     and direction = 'POSTGRES_TO_AIRTABLE'
     and backend_state_authoritative = true;
  if not found then
    raise exception 'Sync target is missing, inactive, or not outbound mirror-only' using errcode = '22023';
  end if;

  insert into public.airtable_sync_outbox
    (idempotency_key, sync_target_id, source_table, source_record_id, operation, payload, status, attempts, max_attempts, next_attempt_at, updated_at)
  values
    (p_idempotency_key, p_sync_target_id, p_source_table, p_source_record_id, p_operation, p_payload, 'PENDING', 0, 3, now(), now())
  on conflict (idempotency_key) do update
    set updated_at = public.airtable_sync_outbox.updated_at
  returning * into v_row;

  -- Do not allow a repeated key to silently alias a different event.
  if v_row.sync_target_id <> p_sync_target_id
     or v_row.source_table <> p_source_table
     or v_row.source_record_id is distinct from p_source_record_id
     or v_row.operation <> p_operation then
    raise exception 'Idempotency key reused for a different mirror event' using errcode = '23505';
  end if;
  return v_row;
end;
$$;

create or replace function public.n07_claim_airtable_mirror_batch(
  p_worker_ref text,
  p_batch_size integer default 25
)
returns setof public.airtable_sync_outbox
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if current_user <> 'service_role' then
    raise exception 'N07 worker claim requires service role' using errcode = '42501';
  end if;
  if p_worker_ref is null or length(btrim(p_worker_ref)) < 3 or length(p_worker_ref) > 120 then
    raise exception 'Invalid worker reference' using errcode = '22023';
  end if;
  if p_batch_size < 1 or p_batch_size > 50 then
    raise exception 'Batch size must be between 1 and 50' using errcode = '22023';
  end if;

  -- Expired jobs with exhausted attempts are dead-lettered in place, preserving
  -- the original durable event and avoiding a second, disconnected DLQ record.
  update public.airtable_sync_outbox
     set status = 'DEAD_LETTER',
         locked_at = null,
         locked_by = null,
         lease_expires_at = null,
         error_code = coalesce(error_code, 'RETRY_LIMIT_EXHAUSTED'),
         last_error = coalesce(last_error, 'Worker lease expired after retry limit'),
         updated_at = now()
   where status = 'LOCKED'
     and lease_expires_at < now()
     and attempts >= max_attempts;

  return query
  with picked as (
    select id
      from public.airtable_sync_outbox
     where attempts < max_attempts
       and (
         (status = 'PENDING' and next_attempt_at <= now())
         or (status = 'LOCKED' and lease_expires_at < now())
       )
     order by next_attempt_at, created_at
     for update skip locked
     limit p_batch_size
  )
  update public.airtable_sync_outbox o
     set status = 'LOCKED',
         attempts = o.attempts + 1,
         locked_at = now(),
         locked_by = p_worker_ref,
         lease_expires_at = now() + interval '5 minutes',
         updated_at = now()
    from picked
   where o.id = picked.id
  returning o.*;
end;
$$;

create or replace function public.n07_finish_airtable_mirror_job(
  p_job_id uuid,
  p_worker_ref text,
  p_succeeded boolean,
  p_error_code text default null,
  p_redacted_error text default null
)
returns public.airtable_sync_outbox
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_row public.airtable_sync_outbox;
  v_delay_seconds integer;
begin
  if current_user <> 'service_role' then
    raise exception 'N07 job completion requires service role' using errcode = '42501';
  end if;
  if p_worker_ref is null or length(btrim(p_worker_ref)) < 3 then
    raise exception 'Invalid worker reference' using errcode = '22023';
  end if;
  if p_redacted_error is not null and length(p_redacted_error) > 300 then
    raise exception 'Error detail too long; store a short redacted diagnostic' using errcode = '22023';
  end if;

  update public.airtable_sync_outbox
     set status = case
           when p_succeeded then 'COMPLETED'
           when attempts >= max_attempts then 'DEAD_LETTER'
           else 'PENDING'
         end,
         next_attempt_at = case
           when p_succeeded or attempts >= max_attempts then next_attempt_at
           else now() + make_interval(secs => least(900, 30 * (2 ^ greatest(0, attempts - 1))::integer))
         end,
         locked_at = null,
         locked_by = null,
         lease_expires_at = null,
         completed_at = case when p_succeeded then now() else completed_at end,
         error_code = case when p_succeeded then null else left(coalesce(p_error_code, 'MIRROR_FAILED'), 80) end,
         last_error = case when p_succeeded then null else left(coalesce(p_redacted_error, 'Mirror operation failed; details withheld'), 300) end,
         updated_at = now()
   where id = p_job_id
     and status = 'LOCKED'
     and locked_by = p_worker_ref
  returning * into v_row;

  if not found then
    raise exception 'Job is not leased to this worker' using errcode = '42501';
  end if;
  return v_row;
end;
$$;

revoke all on function public.n07_enqueue_airtable_mirror(text, uuid, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.n07_claim_airtable_mirror_batch(text, integer) from public, anon, authenticated;
revoke all on function public.n07_finish_airtable_mirror_job(uuid, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.n07_enqueue_airtable_mirror(text, uuid, text, uuid, text, jsonb) to service_role;
grant execute on function public.n07_claim_airtable_mirror_batch(text, integer) to service_role;
grant execute on function public.n07_finish_airtable_mirror_job(uuid, text, boolean, text, text) to service_role;

commit;
