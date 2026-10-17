-- Durable candidate-owned application tracker. External handoff and candidate-reported submission are
-- deliberately distinct from a provider-confirmed submission or decision.
create table if not exists public.candidate_route_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 source_kind text not null check (source_kind in ('ROUTE_PROGRAMME','PARTNER_LISTING')),
 route_programme_id uuid references public.route_programmes(id) on delete restrict,
 organisation_listing_id uuid references public.organisation_listings(id) on delete restrict,
 status text not null default 'PLANNING' check (status in ('PLANNING','PREPARING','READY_FOR_EXTERNAL_PORTAL','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED','PROVIDER_ACKNOWLEDGED','UNDER_REVIEW','ACCEPTED','REJECTED','CLOSED')),
 candidate_submission_reference text,
 candidate_submission_note text not null default '',
 candidate_reported_submitted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint candidate_route_application_exact_source check (
  (source_kind='ROUTE_PROGRAMME' and route_programme_id is not null and organisation_listing_id is null)
  or (source_kind='PARTNER_LISTING' and organisation_listing_id is not null and route_programme_id is null)
 ),
 constraint candidate_reported_submission_evidence check (
  status <> 'CANDIDATE_REPORTED_SUBMITTED'
  or (candidate_reported_submitted_at is not null and length(trim(candidate_submission_reference)) >= 3)
 )
);
create index if not exists candidate_route_applications_user_updated_idx on public.candidate_route_applications(user_id,updated_at desc);
create index if not exists candidate_route_applications_route_idx on public.candidate_route_applications(route_programme_id);
create index if not exists candidate_route_applications_listing_idx on public.candidate_route_applications(organisation_listing_id);
alter table public.candidate_route_applications enable row level security;
drop policy if exists candidate_route_applications_select_own on public.candidate_route_applications;
create policy candidate_route_applications_select_own on public.candidate_route_applications
 for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists candidate_route_applications_insert_own on public.candidate_route_applications;
create policy candidate_route_applications_insert_own on public.candidate_route_applications
 for insert to authenticated with check (
  user_id=(select auth.uid()) and status='PLANNING'
  and candidate_reported_submitted_at is null
  and candidate_submission_reference is null
  and (
   (source_kind='ROUTE_PROGRAMME' and exists (
    select 1 from public.route_programmes rp join public.route_providers p on p.id=rp.provider_id
    where rp.id=route_programme_id and rp.route_status='VERIFIED'
     and rp.availability_status in ('OPEN','FUTURE') and rp.source_confidence_band in ('A','B')
     and rp.updated_at >= now()-interval '90 days'
     and p.public_safe=true and p.verification_status='VERIFIED' and p.default_confidence_band in ('A','B')
   ))
   or
   (source_kind='PARTNER_LISTING' and exists (
    select 1 from public.organisation_listings l join public.organisations o on o.id=l.organisation_id
    where l.id=organisation_listing_id and l.status='PUBLISHED' and l.source_verified_at is not null
     and (l.closes_at is null or l.closes_at>=now()) and o.verification_status='VERIFIED'
   ))
  )
 );
drop policy if exists candidate_route_applications_update_own on public.candidate_route_applications;
create policy candidate_route_applications_update_own on public.candidate_route_applications
 for update to authenticated
 using (user_id=(select auth.uid()))
 with check (
  user_id=(select auth.uid())
  and status in ('PLANNING','PREPARING','READY_FOR_EXTERNAL_PORTAL','EXTERNAL_PORTAL_OPENED','CANDIDATE_REPORTED_SUBMITTED')
  and (
   status <> 'CANDIDATE_REPORTED_SUBMITTED'
   or (candidate_reported_submitted_at is not null and length(trim(candidate_submission_reference)) >= 3)
  )
 );
drop policy if exists candidate_route_applications_delete_own on public.candidate_route_applications;
create policy candidate_route_applications_delete_own on public.candidate_route_applications
 for delete to authenticated using (user_id=(select auth.uid()));
revoke all on public.candidate_route_applications from anon,authenticated;
grant select,insert,update,delete on public.candidate_route_applications to authenticated;
