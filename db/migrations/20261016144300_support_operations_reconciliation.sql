-- FORWARD RECONCILIATION MIGRATION — prepared for staging, NOT YET APPLIED.
-- Restores the canonical support queue/event RPCs expected by the current web API.
-- Candidate identity is resolved through the deployed candidate_accounts binding helper;
-- this deliberately does not rely on a candidates.owner_user_id column (not present in staging).
-- No email, SMS, WhatsApp or other external notification is dispatched by these RPCs.

alter table public.candidate_support_tickets enable row level security;
drop policy if exists service_role_all_candidate_support_tickets on public.candidate_support_tickets;
drop policy if exists founder_support_ticket_select on public.candidate_support_tickets;
drop policy if exists founder_support_ticket_update on public.candidate_support_tickets;
create policy founder_support_ticket_select on public.candidate_support_tickets
  for select to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
  );
create policy founder_support_ticket_update on public.candidate_support_tickets
  for update to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
  );

create table if not exists public.candidate_support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.candidate_support_tickets(id) on delete cascade,
  ticket_ref text not null,
  event_type text not null check (event_type in ('ASSIGNED','STATUS_CHANGED','RESOLUTION_NOTE','INTERNAL_NOTE')),
  from_status text,
  to_status text,
  from_assignee text,
  to_assignee text,
  note text not null check (char_length(note) between 4 and 2000),
  actor_user_id uuid not null,
  actor_email text not null default '',
  audit_ref text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_support_ticket_events_ticket_created
  on public.candidate_support_ticket_events(ticket_id,created_at desc);
alter table public.candidate_support_ticket_events enable row level security;
drop policy if exists founder_support_ticket_events_select on public.candidate_support_ticket_events;
drop policy if exists founder_support_ticket_events_insert on public.candidate_support_ticket_events;
create policy founder_support_ticket_events_select on public.candidate_support_ticket_events
  for select to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
  );
create policy founder_support_ticket_events_insert on public.candidate_support_ticket_events
  for insert to authenticated
  with check (
    (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
      or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
    )
    and actor_user_id=auth.uid()
  );
comment on table public.candidate_support_ticket_events is
  'Append-only audit timeline for canonical support tickets; events do not imply external notification delivery.';

create or replace function public.update_support_ticket_as_operator(
  p_ticket_ref text,
  p_status text,
  p_assigned_to text,
  p_event_type text,
  p_note text,
  p_actor_user_id uuid,
  p_actor_email text,
  p_audit_ref text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ticket public.candidate_support_tickets%rowtype;
  v_old_status text;
  v_old_assignee text;
  v_existing public.candidate_support_ticket_events%rowtype;
begin
  if auth.uid() is null or not (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('founder','admin','super_admin')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles','[]'::jsonb) ?| array['founder','admin','super_admin']
  ) then
    raise exception 'SUPPORT_OPERATOR_ROLE_REQUIRED' using errcode='42501';
  end if;
  if p_actor_user_id is distinct from auth.uid() then
    raise exception 'SUPPORT_ACTOR_MISMATCH' using errcode='42501';
  end if;
  if p_status is null or p_status not in ('OPEN','WAITING_ON_CANDIDATE','WAITING_ON_OPERATOR','RESOLVED','CLOSED')
    or p_event_type is null or p_event_type not in ('ASSIGNED','STATUS_CHANGED','RESOLUTION_NOTE','INTERNAL_NOTE')
    or char_length(coalesce(p_ticket_ref,'')) not between 4 and 160
    or char_length(coalesce(p_note,'')) not between 4 and 2000
    or (p_assigned_to is not null and char_length(p_assigned_to)>160)
    or coalesce(p_audit_ref,'') !~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$' then
    raise exception 'SUPPORT_INPUT_INVALID' using errcode='22023';
  end if;

  select * into v_ticket from public.candidate_support_tickets
  where ticket_ref=p_ticket_ref for update;
  if not found then raise exception 'SUPPORT_TICKET_NOT_FOUND' using errcode='P0002'; end if;

  -- Retries with the same audit reference must not duplicate an event or repeat a state change.
  select * into v_existing from public.candidate_support_ticket_events where audit_ref=p_audit_ref;
  if found then
    if v_existing.ticket_ref is distinct from p_ticket_ref
      or v_existing.actor_user_id is distinct from auth.uid()
      or v_existing.event_type is distinct from p_event_type
      or v_existing.to_status is distinct from p_status
      or v_existing.to_assignee is distinct from p_assigned_to
      or v_existing.note is distinct from p_note then
      raise exception 'SUPPORT_AUDIT_REFERENCE_CONFLICT' using errcode='23505';
    end if;
    return jsonb_build_object(
      'ticket_ref',v_existing.ticket_ref,'status',v_existing.to_status,
      'assigned_to',v_existing.to_assignee,'updated_at',v_ticket.updated_at,
      'closed_at',v_ticket.closed_at,'audit_ref',v_existing.audit_ref,'idempotentReplay',true
    );
  end if;

  v_old_status := v_ticket.status;
  v_old_assignee := v_ticket.assigned_to;
  update public.candidate_support_tickets
    set status=p_status,
        assigned_to=p_assigned_to,
        updated_at=now(),
        closed_at=case when p_status in ('RESOLVED','CLOSED') then coalesce(closed_at,now()) else null end
    where id=v_ticket.id
    returning * into v_ticket;

  insert into public.candidate_support_ticket_events
    (ticket_id,ticket_ref,event_type,from_status,to_status,from_assignee,to_assignee,note,actor_user_id,actor_email,audit_ref)
  values
    (v_ticket.id,v_ticket.ticket_ref,p_event_type,v_old_status,p_status,v_old_assignee,p_assigned_to,
     p_note,auth.uid(),left(coalesce(p_actor_email,''),254),p_audit_ref);

  return jsonb_build_object(
    'ticket_ref',v_ticket.ticket_ref,'status',v_ticket.status,'assigned_to',v_ticket.assigned_to,
    'updated_at',v_ticket.updated_at,'closed_at',v_ticket.closed_at,'audit_ref',p_audit_ref
  );
end;
$$;
revoke all on function public.update_support_ticket_as_operator(text,text,text,text,text,uuid,text,text) from public,anon;
grant execute on function public.update_support_ticket_as_operator(text,text,text,text,text,uuid,text,text) to authenticated;

create or replace function public.create_candidate_support_ticket(
  p_ticket_ref text,
  p_category text,
  p_priority text,
  p_title text,
  p_description text,
  p_evidence_ref text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_ticket public.candidate_support_tickets%rowtype;
begin
  if auth.uid() is null then raise exception 'CANDIDATE_AUTH_REQUIRED' using errcode='42501'; end if;
  if char_length(coalesce(p_ticket_ref,'')) not between 8 and 160
    or char_length(coalesce(p_title,'')) not between 4 and 160
    or char_length(coalesce(p_description,'')) not between 10 and 3000
    or p_category is null or p_category not in ('GENERAL','APPLICATION','DOCUMENTS','FINANCE','URGENT_BLOCKER','DISPUTE')
    or p_priority is null or p_priority not in ('NORMAL','HIGH','URGENT')
    or (p_evidence_ref is not null and char_length(p_evidence_ref) not between 3 and 180) then
    raise exception 'SUPPORT_TICKET_INPUT_INVALID' using errcode='22023';
  end if;

  v_candidate_id := kingsmen_security.current_authenticated_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_RECORD_NOT_FOUND' using errcode='P0002';
  end if;

  insert into public.candidate_support_tickets
    (ticket_ref,candidate_id,category,priority,status,title,description,evidence_ref)
  values
    (p_ticket_ref,v_candidate_id,p_category,p_priority,'OPEN',p_title,p_description,nullif(p_evidence_ref,''))
  on conflict (ticket_ref) do nothing;

  select * into v_ticket from public.candidate_support_tickets where ticket_ref=p_ticket_ref;
  if v_ticket.id is null or v_ticket.candidate_id is distinct from v_candidate_id
    or v_ticket.category is distinct from p_category
    or v_ticket.priority is distinct from p_priority
    or v_ticket.title is distinct from p_title
    or v_ticket.description is distinct from p_description
    or v_ticket.evidence_ref is distinct from nullif(p_evidence_ref,'') then
    raise exception 'SUPPORT_TICKET_REFERENCE_CONFLICT' using errcode='23505';
  end if;
  return jsonb_build_object('created',true,'ticket_ref',v_ticket.ticket_ref,'status',v_ticket.status);
end;
$$;
revoke all on function public.create_candidate_support_ticket(text,text,text,text,text,text) from public,anon;
grant execute on function public.create_candidate_support_ticket(text,text,text,text,text,text) to authenticated;
