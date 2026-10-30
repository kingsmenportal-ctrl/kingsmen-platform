-- 0098: enforce the registered active-candidate cap at the database admission boundary.
-- The authoritative cap is public.system_runtime_config.KINGSMEN_CAP_ACTIVE_CANDIDATES.
-- Candidate rows with is_active=true count regardless of workflow state (including NEW).
-- A transaction-scoped advisory lock serializes concurrent admissions and activations.
begin;

do $preflight$
declare
  v_cap_text text;
  v_cap integer;
  v_active_count bigint;
begin
  select value->>'value'
    into v_cap_text
    from public.system_runtime_config
   where key = 'KINGSMEN_CAP_ACTIVE_CANDIDATES';

  if v_cap_text is null or v_cap_text !~ '^[0-9]+$' then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  end if;

  v_cap := v_cap_text::integer;
  if v_cap not in (500, 1000, 5000, 10000, 25000) then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED';
  end if;

  select count(*) into v_active_count
    from public.candidates
   where is_active is true;

  if v_active_count > v_cap then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_ALREADY_EXCEEDED';
  end if;
end
$preflight$;

create index if not exists idx_candidates_active_capacity
  on public.candidates (id)
  where is_active is true;

create or replace function public.enforce_candidate_active_capacity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_cap_text text;
  v_cap integer;
  v_active_count bigint;
begin
  -- Inactive records do not consume a slot. True -> true updates consume no new slot.
  if new.is_active is not true then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.is_active is true then
    return new;
  end if;

  -- All concurrent admissions/activations in this database share one transaction lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kingsmen.active-candidate-admission.v1', 0)
  );

  select value->>'value'
    into v_cap_text
    from public.system_runtime_config
   where key = 'KINGSMEN_CAP_ACTIVE_CANDIDATES'
   for share;

  if v_cap_text is null or v_cap_text !~ '^[0-9]+$' then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  end if;

  begin
    v_cap := v_cap_text::integer;
  exception when others then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_CONFIG_INVALID';
  end;

  if v_cap not in (500, 1000, 5000, 10000, 25000) then
    raise exception using
      errcode = '55000',
      message = 'ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED';
  end if;

  select count(*)
    into v_active_count
    from public.candidates
   where is_active is true;

  if v_active_count >= v_cap then
    raise exception using
      errcode = '23514',
      constraint = 'candidates_active_capacity_guard',
      message = 'ACTIVE_CANDIDATE_CAP_EXCEEDED';
  end if;

  return new;
end
$function$;

revoke all on function public.enforce_candidate_active_capacity() from public;
revoke all on function public.enforce_candidate_active_capacity() from anon, authenticated;

drop trigger if exists candidates_active_capacity_guard on public.candidates;
create trigger candidates_active_capacity_guard
before insert or update of is_active on public.candidates
for each row
execute function public.enforce_candidate_active_capacity();

comment on function public.enforce_candidate_active_capacity() is
  'Serializes active candidate admission and fail-closes at the approved cap stored in system_runtime_config.KINGSMEN_CAP_ACTIVE_CANDIDATES.';

commit;
