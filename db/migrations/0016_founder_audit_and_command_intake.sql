-- Founder command intake: durable review requests, never direct execution.
create table if not exists public.founder_command_intake (
  id uuid primary key default gen_random_uuid(),
  request_ref text not null unique,
  command_key text not null,
  command_name text not null,
  actor_user_id uuid not null,
  actor_email text not null default '',
  request_status text not null default 'WAITING_REVIEW'
    check (request_status in ('WAITING_REVIEW','WAITING_APPROVAL','APPROVED','REJECTED','CANCELLED')),
  reason text not null check (char_length(reason) between 8 and 1200),
  evidence_ref text not null check (char_length(evidence_ref) between 1 and 180),
  audit_ref text not null unique,
  request_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_founder_command_intake_status on public.founder_command_intake(request_status, created_at desc);
create index if not exists idx_founder_command_intake_actor on public.founder_command_intake(actor_user_id, created_at desc);
alter table public.founder_command_intake enable row level security;

create or replace function public.is_kingsmen_founder()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','admin','super_admin')
    or exists (
      select 1 from jsonb_array_elements_text(
        case when jsonb_typeof(auth.jwt() -> 'app_metadata' -> 'roles') = 'array'
          then auth.jwt() -> 'app_metadata' -> 'roles' else '[]'::jsonb end
      ) as role_names(role_name)
      where lower(role_name) in ('founder','admin','super_admin')
    ), false
  );
$$;

-- Replace permissive policies created in migration 0015 with trusted-role policies.
drop policy if exists founder_runtime_config_all on public.founder_runtime_config;
drop policy if exists founder_operator_profiles_all on public.founder_operator_profiles;
drop policy if exists founder_command_catalog_all on public.founder_command_catalog;
drop policy if exists founder_command_requests_all on public.founder_command_requests;
drop policy if exists founder_command_results_all on public.founder_command_results;
drop policy if exists founder_daily_briefs_all on public.founder_daily_briefs;
drop policy if exists founder_watchlist_items_all on public.founder_watchlist_items;
drop policy if exists founder_escalation_threads_all on public.founder_escalation_threads;
drop policy if exists founder_decision_log_all on public.founder_decision_log;
drop policy if exists founder_mobile_cards_all on public.founder_mobile_cards;
drop policy if exists founder_ops_audit_events_all on public.founder_ops_audit_events;

create policy founder_runtime_config_founder on public.founder_runtime_config for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_operator_profiles_founder on public.founder_operator_profiles for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_command_catalog_founder on public.founder_command_catalog for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_command_requests_founder on public.founder_command_requests for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_command_results_founder on public.founder_command_results for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_daily_briefs_founder on public.founder_daily_briefs for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_watchlist_items_founder on public.founder_watchlist_items for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_escalation_threads_founder on public.founder_escalation_threads for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_decision_log_founder on public.founder_decision_log for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
create policy founder_mobile_cards_founder on public.founder_mobile_cards for all to authenticated using (public.is_kingsmen_founder()) with check (public.is_kingsmen_founder());
drop policy if exists founder_ops_audit_events_founder on public.founder_ops_audit_events;
create policy founder_ops_audit_events_select on public.founder_ops_audit_events for select to authenticated using (public.is_kingsmen_founder());
create policy founder_ops_audit_events_insert on public.founder_ops_audit_events for insert to authenticated with check (public.is_kingsmen_founder());
drop policy if exists founder_command_intake_founder on public.founder_command_intake;
create policy founder_command_intake_select on public.founder_command_intake for select to authenticated using (public.is_kingsmen_founder());
create policy founder_command_intake_insert on public.founder_command_intake for insert to authenticated with check (public.is_kingsmen_founder());

create or replace function public.record_founder_command_intake(
  p_request_ref text, p_command_key text, p_command_name text, p_actor_user_id uuid,
  p_actor_email text, p_reason text, p_evidence_ref text, p_audit_ref text,
  p_request_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare v_request_id uuid;
begin
  if not public.is_kingsmen_founder() or auth.uid() is null or auth.uid() <> p_actor_user_id then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_request_ref,'')) not between 8 and 100
    or char_length(coalesce(p_command_key,'')) not between 1 and 100
    or char_length(coalesce(p_command_name,'')) not between 1 and 180
    or char_length(coalesce(p_reason,'')) not between 8 and 1200
    or char_length(coalesce(p_evidence_ref,'')) not between 1 and 180
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or octet_length(coalesce(p_request_payload, '{}'::jsonb)::text) > 8192 then
    raise exception 'INVALID_COMMAND_INTAKE' using errcode = '22023';
  end if;
  insert into public.founder_command_intake
    (request_ref, command_key, command_name, actor_user_id, actor_email, request_status, reason, evidence_ref, audit_ref, request_payload)
  values
    (p_request_ref, p_command_key, p_command_name, p_actor_user_id, left(coalesce(p_actor_email,''),254),
     'WAITING_REVIEW', p_reason, p_evidence_ref, p_audit_ref, coalesce(p_request_payload, '{}'::jsonb))
  returning id into v_request_id;
  insert into public.founder_ops_audit_events
    (audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs)
  values
    (p_audit_ref, p_actor_user_id::text, 'FOUNDER_COMMAND_REQUESTED', p_request_ref, 'INFO',
     'Command request recorded for review; no operational action dispatched.',
     jsonb_build_object('commandKey',p_command_key,'requestStatus','WAITING_REVIEW','executed',false),
     array[p_evidence_ref]);
  return jsonb_build_object('requestId',v_request_id,'requestRef',p_request_ref,'auditRef',p_audit_ref,'requestStatus','WAITING_REVIEW','executed',false);
end;
$$;
revoke all on function public.record_founder_command_intake(text,text,text,uuid,text,text,text,text,jsonb) from public, anon;
grant execute on function public.record_founder_command_intake(text,text,text,uuid,text,text,text,text,jsonb) to authenticated;
revoke all on function public.is_kingsmen_founder() from public, anon;
grant execute on function public.is_kingsmen_founder() to authenticated;
