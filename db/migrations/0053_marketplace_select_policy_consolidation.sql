-- Consolidate authenticated read rules: public verified rows, own submissions, and authorised review access.
drop policy if exists organisations_read_verified_or_owner on public.organisations;
drop policy if exists organisations_read_verified_owner_or_reviewer on public.organisations;
create policy organisations_read_verified_owner_or_reviewer on public.organisations
  for select to authenticated using (
    verification_status = 'VERIFIED'
    or created_by = (select auth.uid())
    or kingsmen_security.is_founder_or_operator()
  );
drop policy if exists listings_read_published_or_owner on public.organisation_listings;
drop policy if exists listings_read_authenticated_public_owner_or_reviewer on public.organisation_listings;
create policy listings_read_authenticated_public_owner_or_reviewer on public.organisation_listings
  for select to authenticated using (
    (status = 'PUBLISHED' and source_verified_at is not null
      and exists (select 1 from public.organisations o where o.id=organisation_id and o.verification_status='VERIFIED')
      and (closes_at is null or closes_at >= now()))
    or created_by = (select auth.uid())
    or kingsmen_security.is_founder_or_operator()
  );
