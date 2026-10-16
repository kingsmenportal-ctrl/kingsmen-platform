-- Shared support operations queue. Candidate rows remain scoped to their authenticated owner;
-- founder operators can triage through audited RPCs only.
create table if not exists public.candidate_support_operations (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  request_payload jsonb not null check (jsonb_typeof(request_payload) = 'object'),
  operator_user_id uuid references auth.users(id),
  operator_status text not null default 'OPEN'
    check (operator_status in ('OPEN','IN_REVIEW','WAITING_FOR_CANDIDATE','RESOLVED','CLOSED')),
  operator_notes text not null default '',
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_user_id, request_id),
  check (char_length(request_id) between 3 and 180),
  check (char_length(operator_notes) <= 2000)
);
create index if not exists candidate_support_ops_queue_idx
  on public.candidate_support_operations(operator_status, updated_at desc);
alter table public.candidate_support_operations enable row level security;
revoke all on public.candidate_support_operations from public, anon, authenticated;

create or replace function public.sync_candidate_support_request(p_request_id text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_row public.candidate_support_operations;
begin
  if auth.uid() is null then raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode='42501'; end if;
  if char_length(coalesce(p_request_id,'')) not between 3 and 180
     or jsonb_typeof(p_payload) <> 'object'
     or char_length(coalesce(p_payload->>'subject','')) not between 4 and 160
     or char_length(coalesce(p_payload->>'description','')) not between 10 and 3000 then
    raise exception 'INVALID_SUPPORT_REQUEST' using errcode='22023';
  end if;
  insert into public.candidate_support_operations(candidate_user_id,request_id,request_payload,operator_status)
  values(auth.uid(),p_request_id,p_payload,'OPEN')
  on conflict(candidate_user_id,request_id) do update
    set request_payload=excluded.request_payload, updated_at=now()
    where public.candidate_support_operations.candidate_user_id=auth.uid();
  select * into v_row from public.candidate_support_operations
    where candidate_user_id=auth.uid() and request_id=p_request_id;
  return jsonb_build_object('synced',true,'requestId',v_row.request_id,'operatorStatus',v_row.operator_status);
end $$;

create or replace function public.founder_list_support_requests()
returns setof jsonb language plpgsql security definer set search_path = ''
as $$
declare v_role text; v_roles jsonb;
begin
  if auth.uid() is null then raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode='42501'; end if;
  v_role := lower(coalesce(auth.jwt()->'app_metadata'->>'role',''));
  v_roles := coalesce(auth.jwt()->'app_metadata'->'roles','[]'::jsonb);
  if v_role not in ('founder','admin','super_admin') and not (
    jsonb_typeof(v_roles)='array' and (v_roles ? 'founder' or v_roles ? 'admin' or v_roles ? 'super_admin')
  ) then raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode='42501'; end if;
  return query select jsonb_build_object(
    'requestId',s.request_id,'candidateUserId',s.candidate_user_id,
    'request',s.request_payload,'operatorStatus',s.operator_status,
    'operatorUserId',s.operator_user_id,'operatorNotes',s.operator_notes,
    'firstResponseAt',s.first_response_at,'resolvedAt',s.resolved_at,
    'createdAt',s.created_at,'updatedAt',s.updated_at
  ) from public.candidate_support_operations s order by
    case when s.operator_status in ('RESOLVED','CLOSED') then 1 else 0 end,
    s.updated_at asc limit 500;
end $$;

create or replace function public.founder_update_support_request(
  p_candidate_user_id uuid, p_request_id text, p_status text, p_notes text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_role text; v_roles jsonb; v_row public.candidate_support_operations; v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode='42501'; end if;
  v_role := lower(coalesce(auth.jwt()->'app_metadata'->>'role',''));
  v_roles := coalesce(auth.jwt()->'app_metadata'->'roles','[]'::jsonb);
  if v_role not in ('founder','admin','super_admin') and not (
    jsonb_typeof(v_roles)='array' and (v_roles ? 'founder' or v_roles ? 'admin' or v_roles ? 'super_admin')
  ) then raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode='42501'; end if;
  if p_candidate_user_id is null or char_length(coalesce(p_request_id,'')) not between 3 and 180
     or p_status not in ('OPEN','IN_REVIEW','WAITING_FOR_CANDIDATE','RESOLVED','CLOSED')
     or char_length(coalesce(p_notes,'')) > 2000 then
    raise exception 'INVALID_SUPPORT_UPDATE' using errcode='22023';
  end if;
  update public.candidate_support_operations s set
    operator_status=p_status, operator_notes=coalesce(p_notes,''),
    operator_user_id=auth.uid(),
    first_response_at=coalesce(s.first_response_at,v_now),
    resolved_at=case when p_status in ('RESOLVED','CLOSED') then coalesce(s.resolved_at,v_now) else null end,
    updated_at=v_now
  where s.candidate_user_id=p_candidate_user_id and s.request_id=p_request_id
  returning * into v_row;
  if not found then raise exception 'SUPPORT_REQUEST_NOT_FOUND' using errcode='P0002'; end if;
  return jsonb_build_object('updated',true,'requestId',v_row.request_id,'operatorStatus',v_row.operator_status,'updatedAt',v_row.updated_at);
end $$;

revoke all on function public.sync_candidate_support_request(text,jsonb) from public, anon;
revoke all on function public.founder_list_support_requests() from public, anon, authenticated;
revoke all on function public.founder_update_support_request(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.sync_candidate_support_request(text,jsonb) to authenticated;
grant execute on function public.founder_list_support_requests() to authenticated;
grant execute on function public.founder_update_support_request(uuid,text,text,text) to authenticated;
