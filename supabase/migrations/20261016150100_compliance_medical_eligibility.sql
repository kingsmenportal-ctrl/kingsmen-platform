-- F: Compliance and medical clearance baseline. DRAFT ONLY; verify audit_log contract before application.
begin;
create table if not exists public.medical_clearances (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 status text not null check(status in ('pending','cleared','restricted','expired')), valid_until date,
 recorded_by uuid not null, recorded_at timestamptz not null default now(), reason_code text, created_at timestamptz not null default now()
);
create table if not exists public.compliance_checks (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete restrict,
 check_type text not null, status text not null check(status in ('pending','passed','failed','needs_review')),
 checked_by uuid, checked_at timestamptz, created_at timestamptz not null default now(), unique(candidate_id,check_type)
);
alter table public.medical_clearances enable row level security;
alter table public.compliance_checks enable row level security;
revoke all on table public.medical_clearances,public.compliance_checks from public,anon,authenticated;
grant select on table public.medical_clearances,public.compliance_checks to authenticated;
drop policy if exists medical_clearance_candidate_read on public.medical_clearances;
create policy medical_clearance_candidate_read on public.medical_clearances for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
drop policy if exists medical_clearance_founder_read on public.medical_clearances;
create policy medical_clearance_founder_read on public.medical_clearances for select to authenticated using(kingsmen_security.is_kingsmen_founder());
drop policy if exists compliance_candidate_read on public.compliance_checks;
create policy compliance_candidate_read on public.compliance_checks for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
drop policy if exists compliance_founder_read on public.compliance_checks;
create policy compliance_founder_read on public.compliance_checks for select to authenticated using(kingsmen_security.is_kingsmen_founder());
create or replace view public.eligibility_status with (security_invoker=true) as
select c.id candidate_id,
 case when mc.status='cleared' and (mc.valid_until is null or mc.valid_until>=current_date)
 and not exists(select 1 from public.compliance_checks cc where cc.candidate_id=c.id and cc.status='failed')
 then 'eligible' else 'review_required' end status
from public.candidates c
left join lateral(select m.status,m.valid_until from public.medical_clearances m where m.candidate_id=c.id order by m.recorded_at desc limit 1) mc on true;
revoke all on public.eligibility_status from public,anon;
grant select on public.eligibility_status to authenticated;
create or replace function public.record_medical_clearance(p_candidate_id uuid,p_status text,p_valid_until date,p_reason_code text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
 if not kingsmen_security.is_kingsmen_founder() then raise exception 'founder role required' using errcode='42501'; end if;
 if p_status not in ('pending','cleared','restricted','expired') then raise exception 'invalid status'; end if;
 insert into public.medical_clearances(candidate_id,status,valid_until,recorded_by,reason_code)
 values(p_candidate_id,p_status,p_valid_until,auth.uid(),p_reason_code) returning id into v_id;
 insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata,created_at)
 values(auth.uid(),'medical_clearance.recorded','medical_clearance',v_id,jsonb_build_object('candidate_id',p_candidate_id,'status',p_status),now());
 return v_id;
end $$;
revoke all on function public.record_medical_clearance(uuid,text,date,text) from public,anon;
grant execute on function public.record_medical_clearance(uuid,text,date,text) to authenticated;
commit;
