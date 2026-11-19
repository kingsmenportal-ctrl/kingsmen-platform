-- Public read-only discovery for verified opportunities.
-- RLS is the security boundary; no service-role key is required by the public website.
drop policy if exists route_providers_public_verified_read on public.route_providers;
create policy route_providers_public_verified_read on public.route_providers
  for select to anon, authenticated
  using (public_safe = true and verification_status = 'VERIFIED' and default_confidence_band in ('A','B'));

drop policy if exists route_programmes_public_verified_read on public.route_programmes;
create policy route_programmes_public_verified_read on public.route_programmes
  for select to anon, authenticated
  using (
    route_status = 'VERIFIED'
    and availability_status in ('OPEN','FUTURE')
    and source_confidence_band in ('A','B')
    and source_url is not null
    and updated_at >= now() - interval '90 days'
    and exists (
      select 1 from public.route_providers p
      where p.id = provider_id
        and p.public_safe = true
        and p.verification_status = 'VERIFIED'
        and p.default_confidence_band in ('A','B')
    )
  );

grant select on public.route_providers, public.route_programmes to anon, authenticated;
