drop policy if exists organisations_reviewer_read on public.organisations;
drop policy if exists organisations_read_verified_or_owner on public.organisations;
create policy organisations_read_verified_owner_or_reviewer on public.organisations
 for select to authenticated using (
  verification_status='VERIFIED'
  or created_by=(select auth.uid())
  or kingsmen_security.is_founder_or_operator()
 );
drop policy if exists listings_reviewer_read on public.organisation_listings;
drop policy if exists listings_read_public_or_submitter on public.organisation_listings;
create policy listings_read_public_owner_or_reviewer on public.organisation_listings
 for select to anon,authenticated using (
  (
   status='PUBLISHED'
   and source_verified_at is not null
   and exists(select 1 from public.organisations o where o.id=organisation_id and o.verification_status='VERIFIED')
   and (closes_at is null or closes_at>=now())
  )
  or created_by=(select auth.uid())
  or (select auth.role())='authenticated' and kingsmen_security.is_founder_or_operator()
 );
