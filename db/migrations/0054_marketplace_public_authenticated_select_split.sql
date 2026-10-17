drop policy if exists listings_read_public_owner_or_reviewer on public.organisation_listings;
create policy listings_read_public_anon on public.organisation_listings
 for select to anon using (
  status='PUBLISHED'
  and source_verified_at is not null
  and exists(select 1 from public.organisations o where o.id=organisation_id and o.verification_status='VERIFIED')
  and (closes_at is null or closes_at>=now())
 );
create policy listings_read_authenticated_public_owner_or_reviewer on public.organisation_listings
 for select to authenticated using (
  (
   status='PUBLISHED'
   and source_verified_at is not null
   and exists(select 1 from public.organisations o where o.id=organisation_id and o.verification_status='VERIFIED')
   and (closes_at is null or closes_at>=now())
  )
  or created_by=(select auth.uid())
  or kingsmen_security.is_founder_or_operator()
 );
