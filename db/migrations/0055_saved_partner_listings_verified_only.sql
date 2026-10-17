drop policy if exists candidate_saved_listings_insert_own on public.candidate_saved_listings;
create policy candidate_saved_listings_insert_own on public.candidate_saved_listings
 for insert to authenticated with check (
  user_id=(select auth.uid())
  and exists (
   select 1 from public.organisation_listings l
   join public.organisations o on o.id=l.organisation_id
   where l.id=listing_id
    and l.status='PUBLISHED'
    and l.source_verified_at is not null
    and o.verification_status='VERIFIED'
    and (l.closes_at is null or l.closes_at>=now())
  )
 );
