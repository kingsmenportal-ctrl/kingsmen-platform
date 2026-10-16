-- FORWARD RECONCILIATION MIGRATION — prepared for staging, NOT YET APPLIED.
-- Restores the durable founder command intake/decision contract missing from staging.
-- Command requests and decisions are review records only; no operational command is executed.
-- Keep founder_ops_audit_events service-role-only. SECURITY DEFINER RPCs perform narrowly
-- scoped writes after validating the caller's founder role and actor identity.

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
  created_at timestamptz not null default now(),
  constraint founder_command_intake_payload_object check (jsonb_typeof(request_payload) = 'object')
);
create index if not exists idx_founder_command_intake_status
  on public.founder_command_intake(request_status, created_at desc);
create index if not exists idx_founder_command_intake_actor
  on public.founder_command_intake(actor_user_id, created_at desc);
alter table public.founder_command_intake enable row level security;
drop policy if exists founder_command_intake_select on public.founder_command_intake;
drop policy if exists founder_command_intake_insert on public.founder_command_intake;
drop policy if exists founder_command_intake_founder on public.founder_command_intake;
create policy founder_command_intake_select on public.founder_command_intake
  for select to authenticated using (public.is_kingsmen_founder());
-- No direct INSERT policy: the validated RPC is the only authenticated intake path.

create table if not exists public.founder_command_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_ref text not null unique,
  request_ref text not null references public.founder_command_intake(request_ref),
  decision text not null check (decision in ('APPROVED','REJECTED')),
  reviewer_user_id uuid not null,
  reviewer_email text not null default '',
  reason text not null check (char_length(reason) between 8 and 1200),
  audit_ref text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_founder_command_decisions_request
  on public.founder_command_decisions(request_ref, created_at desc);
alter table public.founder_command_decisions enable row level security;
drop policy if exists founder_command_decisions_select on public.founder_command_decisions;
drop policy if exists founder_command_decisions_insert on public.founder_command_decisions;
create policy founder_command_decisions_select on public.founder_command_decisions
  for select to authenticated using (public.is_kingsmen_founder());
-- No direct INSERT/UPDATE/DELETE policy: decisions must go through the guarded RPC.

create or replace function public.record_founder_command_intake(
  p_request_ref text,
  p_command_key text,
  p_command_name text,
  p_actor_user_id uuid,
  p_actor_email text,
  p_reason text,
  p_evidence_ref text,
  p_audit_ref text,
  p_request_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_existing public.founder_command_intake%rowtype;
begin
  if auth.uid() is null or auth.uid() is distinct from p_actor_user_id
     or not public.is_kingsmen_founder() then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_request_ref,'')) not between 8 and 100
    or char_length(coalesce(p_command_key,'')) not between 1 and 100
    or char_length(coalesce(p_command_name,'')) not between 1 and 180
    or char_length(coalesce(p_reason,'')) not between 8 and 1200
    or char_length(coalesce(p_evidence_ref,'')) not between 1 and 180
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or p_request_payload is null
    or jsonb_typeof(p_request_payload) <> 'object'
    or octet_length(p_request_payload::text) > 8192 then
    raise exception 'INVALID_COMMAND_INTAKE' using errcode = '22023';
  end if;

  insert into public.founder_command_intake
    (request_ref,command_key,command_name,actor_user_id,actor_email,request_status,reason,evidence_ref,audit_ref,request_payload)
  values
    (p_request_ref,p_command_key,p_command_name,p_actor_user_id,left(coalesce(p_actor_email,''),254),
     'WAITING_REVIEW',p_reason,p_evidence_ref,p_audit_ref,p_request_payload)
  on conflict (request_ref) do nothing
  returning id into v_request_id;

  if v_request_id is null then
    select * into v_existing from public.founder_command_intake where request_ref=p_request_ref for update;
    if not found
      or v_existing.actor_user_id is distinct from p_actor_user_id
      or v_existing.command_key is distinct from p_command_key
      or v_existing.command_name is distinct from p_command_name
      or v_existing.reason is distinct from p_reason
      or v_existing.evidence_ref is distinct from p_evidence_ref
      or v_existing.audit_ref is distinct from p_audit_ref
      or v_existing.request_payload is distinct from p_request_payload then
      raise exception 'COMMAND_REQUEST_REFERENCE_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'requestId',v_existing.id,'requestRef',v_existing.request_ref,'auditRef',v_existing.audit_ref,
      'requestStatus',v_existing.request_status,'executed',false,'idempotentReplay',true
    );
  end if;

  insert into public.founder_ops_audit_events
    (audit_ref,actor_ref,action_key,target_ref,severity,audit_message,audit_payload,evidence_refs)
  values
    (p_audit_ref,p_actor_user_id::text,'FOUNDER_COMMAND_REQUESTED',p_request_ref,'INFO',
     'Command request recorded for review; no operational action dispatched.',
     jsonb_build_object('commandKey',p_command_key,'requestStatus','WAITING_REVIEW','executed',false),
     array[p_evidence_ref]);

  return jsonb_build_object(
    'requestId',v_request_id,'requestRef',p_request_ref,'auditRef',p_audit_ref,
    'requestStatus','WAITING_REVIEW','executed',false
  );
end;
$$;
revoke all on function public.record_founder_command_intake(text,text,text,uuid,text,text,text,text,jsonb) from public, anon;
grant execute on function public.record_founder_command_intake(text,text,text,uuid,text,text,text,text,jsonb) to authenticated;

create or replace function public.decide_founder_command_intake(
  p_request_ref text,
  p_decision_ref text,
  p_decision text,
  p_reviewer_user_id uuid,
  p_reviewer_email text,
  p_reason text,
  p_audit_ref text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.founder_command_intake%rowtype;
  v_decision_id uuid;
  v_existing public.founder_command_decisions%rowtype;
begin
  if auth.uid() is null or auth.uid() is distinct from p_reviewer_user_id
     or not public.is_kingsmen_founder() then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_request_ref,'')) not between 8 and 100
    or char_length(coalesce(p_decision_ref,'')) not between 8 and 100
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or p_decision is null or p_decision not in ('APPROVED','REJECTED')
    or char_length(coalesce(p_reason,'')) not between 8 and 1200 then
    raise exception 'INVALID_COMMAND_DECISION' using errcode = '22023';
  end if;

  -- A retry after a lost HTTP response returns the existing decision, never executes a command.
  select * into v_existing from public.founder_command_decisions
  where decision_ref=p_decision_ref;
  if found then
    if v_existing.request_ref is distinct from p_request_ref
      or v_existing.decision is distinct from p_decision
      or v_existing.reviewer_user_id is distinct from p_reviewer_user_id
      or v_existing.reason is distinct from p_reason
      or v_existing.audit_ref is distinct from p_audit_ref then
      raise exception 'COMMAND_DECISION_REFERENCE_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'decisionId',v_existing.id,'decisionRef',v_existing.decision_ref,'requestRef',v_existing.request_ref,
      'requestStatus',v_existing.decision,'auditRef',v_existing.audit_ref,'executed',false,'idempotentReplay',true
    );
  end if;

  select * into v_request from public.founder_command_intake
  where request_ref=p_request_ref for update;
  if not found then raise exception 'COMMAND_REQUEST_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_request.actor_user_id = auth.uid() then
    raise exception 'SEPARATION_OF_DUTIES_REQUIRED' using errcode = '42501';
  end if;
  if v_request.request_status not in ('WAITING_REVIEW','WAITING_APPROVAL') then
    raise exception 'COMMAND_REQUEST_ALREADY_DECIDED' using errcode = '55000';
  end if;

  insert into public.founder_command_decisions
    (decision_ref,request_ref,decision,reviewer_user_id,reviewer_email,reason,audit_ref)
  values
    (p_decision_ref,p_request_ref,p_decision,auth.uid(),left(coalesce(p_reviewer_email,''),254),p_reason,p_audit_ref)
  returning id into v_decision_id;

  update public.founder_command_intake set request_status=p_decision where id=v_request.id;

  insert into public.founder_ops_audit_events
    (audit_ref,actor_ref,action_key,target_ref,severity,audit_message,audit_payload,evidence_refs)
  values
    (p_audit_ref,auth.uid()::text,'FOUNDER_COMMAND_' || p_decision,p_request_ref,
     case when p_decision='REJECTED' then 'WARNING' else 'INFO' end,
     'Founder command request decision recorded; no operational action dispatched.',
     jsonb_build_object('decisionRef',p_decision_ref,'decision',p_decision,'requestStatus',p_decision,'executed',false),
     array[v_request.evidence_ref]);

  return jsonb_build_object(
    'decisionId',v_decision_id,'decisionRef',p_decision_ref,'requestRef',p_request_ref,
    'requestStatus',p_decision,'auditRef',p_audit_ref,'executed',false
  );
end;
$$;
revoke all on function public.decide_founder_command_intake(text,text,text,uuid,text,text,text) from public, anon;
grant execute on function public.decide_founder_command_intake(text,text,text,uuid,text,text,text) to authenticated;
