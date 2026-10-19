-- Founder command decisions: explicit human review, immutable decision history, no execution.
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
create index if not exists idx_founder_command_decisions_request on public.founder_command_decisions(request_ref, created_at desc);
alter table public.founder_command_decisions enable row level security;
drop policy if exists founder_command_decisions_select on public.founder_command_decisions;
drop policy if exists founder_command_decisions_insert on public.founder_command_decisions;
create policy founder_command_decisions_select on public.founder_command_decisions
  for select to authenticated using (public.is_kingsmen_founder());
-- No direct INSERT/UPDATE/DELETE policies: decisions must go through the guarded RPC.

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
begin
  if auth.uid() is null or auth.uid() <> p_reviewer_user_id or not public.is_kingsmen_founder() then
    raise exception 'FOUNDER_ACCESS_REQUIRED' using errcode = '42501';
  end if;
  if char_length(coalesce(p_request_ref,'')) not between 8 and 100
    or char_length(coalesce(p_decision_ref,'')) not between 8 and 100
    or char_length(coalesce(p_audit_ref,'')) not between 8 and 100
    or p_decision not in ('APPROVED','REJECTED')
    or char_length(coalesce(p_reason,'')) not between 8 and 1200 then
    raise exception 'INVALID_COMMAND_DECISION' using errcode = '22023';
  end if;

  select * into v_request
  from public.founder_command_intake
  where request_ref = p_request_ref
  for update;
  if not found then
    raise exception 'COMMAND_REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_request.actor_user_id = auth.uid() then
    raise exception 'SEPARATION_OF_DUTIES_REQUIRED' using errcode = '42501';
  end if;
  if v_request.request_status not in ('WAITING_REVIEW','WAITING_APPROVAL') then
    raise exception 'COMMAND_REQUEST_ALREADY_DECIDED' using errcode = '55000';
  end if;

  insert into public.founder_command_decisions
    (decision_ref, request_ref, decision, reviewer_user_id, reviewer_email, reason, audit_ref)
  values
    (p_decision_ref, p_request_ref, p_decision, auth.uid(), left(coalesce(p_reviewer_email,''),254), p_reason, p_audit_ref)
  returning id into v_decision_id;

  update public.founder_command_intake
    set request_status = p_decision
    where id = v_request.id;

  insert into public.founder_ops_audit_events
    (audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs)
  values
    (p_audit_ref, auth.uid()::text, 'FOUNDER_COMMAND_' || p_decision, p_request_ref,
     case when p_decision = 'REJECTED' then 'WARN' else 'INFO' end,
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
