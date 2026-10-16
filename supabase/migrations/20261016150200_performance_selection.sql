-- G: Performance and selection baseline. DRAFT ONLY; validate candidate/audit contracts.
begin;
create table if not exists public.performance_metrics (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 metric_key text not null, metric_value numeric(12,3) not null, recorded_by uuid not null, recorded_at timestamptz not null default now(), notes text
);
create index if not exists performance_metrics_candidate_time_idx on public.performance_metrics(candidate_id,recorded_at desc);
create table if not exists public.selection_decisions (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 decision text not null check(decision in ('selected','waitlisted','rejected','pending')), decided_by uuid not null,
 decided_at timestamptz not null default now(), rationale text, idempotency_key text not null unique
);
alter table public.performance_metrics enable row level security;
alter table public.selection_decisions enable row level security;
revoke all on table public.performance_metrics,public.selection_decisions from public,anon,authenticated;
grant select on table public.performance_metrics,public.selection_decisions to authenticated;
create policy performance_candidate_read_own on public.performance_metrics for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
create policy performance_founder_read on public.performance_metrics for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create policy selection_candidate_read_own on public.selection_decisions for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
create policy selection_founder_read on public.selection_decisions for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create or replace function public.record_selection_decision(p_candidate_id uuid,p_decision text,p_rationale text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_existing public.selection_decisions%rowtype;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 if p_candidate_id is null or p_decision not in ('selected','waitlisted','rejected','pending')
    or p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 128 then
   raise exception 'invalid selection decision input' using errcode='22023';
 end if;
 insert into public.selection_decisions(candidate_id,decision,decided_by,rationale,idempotency_key)
 values(p_candidate_id,p_decision,auth.uid(),p_rationale,p_idempotency_key)
 on conflict(idempotency_key) do nothing returning id into v_id;
 if v_id is null then
   select * into v_existing from public.selection_decisions where idempotency_key=p_idempotency_key;
   if not found or v_existing.candidate_id <> p_candidate_id or v_existing.decision <> p_decision
      or v_existing.rationale is distinct from p_rationale then
     raise exception 'idempotency key reused with different decision' using errcode='23505';
   end if;
   return v_existing.id;
 end if;
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'selection.decision.recorded','selection_decision',v_id,
        jsonb_build_object('candidate_id',p_candidate_id,'decision',p_decision),now());
 return v_id;
end $;
revoke all on function public.record_selection_decision(uuid,text,text,text) from public,anon;
grant execute on function public.record_selection_decision(uuid,text,text,text) to authenticated;
commit;
