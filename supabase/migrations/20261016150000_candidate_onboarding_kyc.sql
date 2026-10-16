-- E: Candidate onboarding and KYC baseline. DRAFT ONLY; verify against deployed schema.
begin;
create table if not exists public.kyc_verifications (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.candidates(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','submitted','approved','rejected','needs_review')),
 submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists kyc_verifications_candidate_created_idx on public.kyc_verifications(candidate_id,created_at desc);
alter table public.kyc_verifications enable row level security;
revoke all on table public.kyc_verifications from public, anon;
revoke insert,update,delete on table public.kyc_verifications from authenticated;
grant select on table public.kyc_verifications to authenticated;
drop policy if exists kyc_candidate_read_own on public.kyc_verifications;
create policy kyc_candidate_read_own on public.kyc_verifications for select to authenticated using(candidate_id=kingsmen_security.current_authenticated_candidate_id());
drop policy if exists kyc_founder_read_all on public.kyc_verifications;
create policy kyc_founder_read_all on public.kyc_verifications for select to authenticated using(kingsmen_security.is_kingsmen_founder());
-- Candidate-controlled onboarding start: reuses an existing pending record and never accepts a candidate_id from the caller.
create or replace function public.start_kyc()
returns public.kyc_verifications language plpgsql security definer set search_path = ''
as $
declare v_candidate uuid; v_result public.kyc_verifications;
begin
 v_candidate := kingsmen_security.current_authenticated_candidate_id();
 if v_candidate is null then raise exception 'authenticated candidate required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_candidate::text, 0));
 select * into v_result from public.kyc_verifications
  where candidate_id = v_candidate and status in ('pending','needs_review')
  order by created_at desc limit 1 for update;
 if found then return v_result; end if;
 insert into public.kyc_verifications(candidate_id,status)
 values(v_candidate,'pending') returning * into v_result;
 return v_result;
end $;
revoke all on function public.start_kyc() from public, anon;
grant execute on function public.start_kyc() to authenticated;

create or replace function public.submit_kyc(p_verification_id uuid)
returns public.kyc_verifications language plpgsql security definer set search_path = ''
as $$
declare v_candidate uuid; v_result public.kyc_verifications;
begin
 v_candidate:=kingsmen_security.current_authenticated_candidate_id();
 if v_candidate is null then raise exception 'authenticated candidate required' using errcode='42501'; end if;
 update public.kyc_verifications set status='submitted',submitted_at=coalesce(submitted_at,now()),updated_at=now()
 where id=p_verification_id and candidate_id=v_candidate and status in ('pending','needs_review') returning * into v_result;
 if not found then raise exception 'KYC record not found or not submittable' using errcode='P0002'; end if;
 return v_result;
end $$;
revoke all on function public.submit_kyc(uuid) from public, anon;
grant execute on function public.submit_kyc(uuid) to authenticated;
commit;
