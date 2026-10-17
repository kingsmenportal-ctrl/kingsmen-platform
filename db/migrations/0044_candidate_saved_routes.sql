-- Save verified route-programme records independently from partner-submitted marketplace listings.
create table if not exists public.candidate_saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  route_programme_id uuid not null references public.route_programmes(id) on delete cascade,
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique(user_id, route_programme_id)
);
create index if not exists candidate_saved_routes_user_idx on public.candidate_saved_routes(user_id, created_at desc);
alter table public.candidate_saved_routes enable row level security;
drop policy if exists candidate_saved_routes_select_own on public.candidate_saved_routes;
create policy candidate_saved_routes_select_own on public.candidate_saved_routes
 for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists candidate_saved_routes_insert_own on public.candidate_saved_routes;
create policy candidate_saved_routes_insert_own on public.candidate_saved_routes
 for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
   select 1 from public.route_programmes rp
   join public.route_providers p on p.id = rp.provider_id
   where rp.id = route_programme_id
     and rp.route_status = 'VERIFIED'
     and rp.availability_status in ('OPEN','FUTURE')
     and rp.source_confidence_band in ('A','B')
     and rp.updated_at >= now() - interval '90 days'
     and p.public_safe = true
     and p.verification_status = 'VERIFIED'
     and p.default_confidence_band in ('A','B')
  )
 );
drop policy if exists candidate_saved_routes_update_own on public.candidate_saved_routes;
create policy candidate_saved_routes_update_own on public.candidate_saved_routes
 for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists candidate_saved_routes_delete_own on public.candidate_saved_routes;
create policy candidate_saved_routes_delete_own on public.candidate_saved_routes
 for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.candidate_saved_routes from anon, authenticated;
grant select, insert, update, delete on public.candidate_saved_routes to authenticated;
